import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { Prisma, Role } from "@prisma/client";

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const isValidRole = (value: unknown): value is Role => {
  if (typeof value !== "string") {
    return false;
  }

  return (Object.values(Role) as string[]).includes(value);
};

const normalizeProfileImage = (input: unknown): string | null => {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input !== "string") {
    throw new Error("Profile image must be provided as a base64 encoded string.");
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^data:(image\/[A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error("Profile image must be a valid base64 data URL.");
  }

  const [, mimeType, rawBase64] = match;
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported profile image type.");
  }

  const base64Data = rawBase64.replace(/\s/g, "");
  const byteLength = Buffer.from(base64Data, "base64").length;

  if (byteLength > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile image must be 2MB or smaller.");
  }

  return `data:${mimeType};base64,${base64Data}`;
};

const enrollmentWithClassInclude = {
  class: {
    include: {
      trainer: {
        select: { id: true, email: true, username: true, role: true, profileImage: true },
      },
      createdBy: { select: { id: true, email: true, role: true } },
      category: true,
      _count: { select: { enrollments: true } },
    },
  },
} as const;

type EnrollmentWithClass = Prisma.ClassEnrollmentGetPayload<{
  include: typeof enrollmentWithClassInclude;
}>;

const formatEnrolledClass = (enrollment: EnrollmentWithClass) => {
  const classData = enrollment.class;
  const enrollmentCount = classData._count?.enrollments ?? 0;
  const availableSpots =
    classData.capacity !== null && classData.capacity !== undefined
      ? Math.max(classData.capacity - enrollmentCount, 0)
      : null;

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.createdAt,
    class: {
      id: classData.id,
      title: classData.title,
      description: classData.description,
      startTime: classData.startTime,
      endTime: classData.endTime,
      capacity: classData.capacity,
      createdAt: classData.createdAt,
      updatedAt: classData.updatedAt,
      requiredRole: classData.requiredRole,
      enrollmentCount,
      availableSpots,
      trainer: classData.trainer,
      createdBy: classData.createdBy,
      category: classData.category,
    },
  };
};

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "User id must be a valid number." });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Failed to get user profile", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "User id must be a valid number." });
    }
    
    const { username, profileImage: rawProfileImage } = req.body as {
      username?: string | null;
      profileImage?: string | null;
    };

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const dataToUpdate: {
      username?: string | null;
      profileImage?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (typeof username === "string") {
      dataToUpdate.username = username || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "profileImage")) {
      try {
        dataToUpdate.profileImage = normalizeProfileImage(rawProfileImage);
      } catch (imageError) {
        return res.status(400).json({
          message:
            imageError instanceof Error
              ? imageError.message
              : "Invalid profile image.",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user profile", error);
    return res.status(500).json({ message: "Failed to update user profile" });
  }
};

export const getUserEnrolledClasses = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: "User id must be a valid number." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ⚠️ ให้แน่ใจว่า enrollmentWithClassInclude เลือก field เหล่านี้ของ class มาด้วย:
    // id, title/name, startTime, endTime (ถ้ามี)
    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: enrollmentWithClassInclude,
    });

    const now = new Date();

    // ช่วยคำนวณสถานะให้แต่ละรายการ
    const withStatus = enrollments.map((en) => {
      const start = new Date(en.class.startTime);
      const end = en.class.endTime ? new Date(en.class.endTime as any) : null;

      let status: "UPCOMING" | "ONGOING" | "ENDED";
      if (start > now) status = "UPCOMING";
      else if (end && end < now) status = "ENDED";
      else status = "ONGOING";

      return {
        // โครงสร้างข้อมูลเดิมของคุณ
        ...formatEnrolledClass(en),

        // ฟิลด์สถานะที่เพิ่มให้
        hasStarted: now >= start,                  // true เมื่อเลยเวลาเริ่มแล้ว
        status,                                    // UPCOMING | ONGOING | ENDED
        startsAt: start,                           // เผื่อ frontend ใช้ต่อ
        endsAt: end,                               // เผื่อ frontend ใช้ต่อ
        // optionals เผื่ออยากโชว์เวลานับถอยหลัง
        msUntilStart: Math.max(0, start.getTime() - now.getTime()),
        msUntilEnd: end ? Math.max(0, end.getTime() - now.getTime()) : null,
      };
    });

    return res.json({
      user,
      enrollments: withStatus,
    });
  } catch (error) {
    console.error("Failed to fetch user classes", error);
    return res.status(500).json({ message: "Failed to fetch user classes." });
  }
};


export const deleteUserClassEnrollment = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const classId = Number(req.params.classId);

  if (Number.isNaN(userId) || Number.isNaN(classId)) {
    return res.status(400).json({ message: "User id and class id must be valid numbers." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await prisma.classEnrollment.delete({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

    return res.json({ message: "Enrollment removed successfully." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    console.error("Failed to delete class enrollment", error);
    return res.status(500).json({ message: "Failed to delete class enrollment." });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const authAdmin = (req as any).authUser;
  const userId = Number(req.params.userId);
  const { role } = req.body as { role?: string };

  if (Number.isNaN(userId) || !role) {
    return res.status(400).json({ message: "userId and role are required." });
  }

  if (!isValidRole(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }

  const admin = authAdmin ? await prisma.user.findUnique({ where: { id: Number(authAdmin.id) } }) : null;
  if (!admin || admin.role !== Role.ADMIN) {
    return res.status(403).json({ message: "Only admins can update user roles." });
  }

  if (role === Role.ADMIN && admin.id === userId) {
    return res.status(400).json({ message: "Cannot change own role to ADMIN again." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "User not found." });
    }

    console.error("Failed to update user role", error);
    return res.status(500).json({ message: "Failed to update user role." });
  }
};


// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Failed to change password", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  const { role } = req.query as { adminId?: string; role?: string };

  const authAdmin = (req as any).authUser;
  const admin = authAdmin ? await prisma.user.findUnique({ where: { id: Number(authAdmin.id) } }) : null;
  if (!admin || admin.role !== Role.ADMIN) {
    return res.status(403).json({ message: "Only admins can view users." });
  }

  let filterRole: Role | undefined;
  if (role) {
    if (!isValidRole(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    filterRole = role as Role;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: filterRole,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error("Failed to fetch users", error);
    return res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const listUserRoles = async (_req: Request, res: Response) => {
  try {
    return res.json(Object.values(Role));
  } catch (error) {
    console.error("Failed to fetch user roles", error);
    return res.status(500).json({ message: "Failed to fetch user roles." });
  }
};

