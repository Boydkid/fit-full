import { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../utils/prisma";

const USER_MEMBERSHIP_ROLES = new Set<Role>([
  Role.USER,
  Role.USER_BRONZE,
  Role.USER_GOLD,
  Role.USER_PLATINUM,
]);

const isUserMembershipRole = (role: Role) => USER_MEMBERSHIP_ROLES.has(role);

const formatClass = (clazz: any) => {
  const enrollmentCount = clazz._count?.enrollments ?? 0;
  const availableSpots =
    clazz.capacity !== null && clazz.capacity !== undefined
      ? Math.max(clazz.capacity - enrollmentCount, 0)
      : null;

  return {
    id: clazz.id,
    title: clazz.title,
    description: clazz.description,
    startTime: clazz.startTime,
    endTime: clazz.endTime,
    capacity: clazz.capacity,
    createdAt: clazz.createdAt,
    updatedAt: clazz.updatedAt,
    createdBy: clazz.createdBy,
    trainer: clazz.trainer,
    category: clazz.category,
    requiredRole: clazz.requiredRole,
    enrollmentCount,
    availableSpots,
  };
};
export const createClass = async (req: Request, res: Response) => {
  const {
    trainerId,
    categoryId,
    requiredRole,
    title,
    description,
    startTime,
    endTime,
    capacity,
  } = req.body as {
    trainerId?: number;
    categoryId?: number;
    requiredRole?: Role;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
  };

  const authAdminId = (req as any).authUser?.id;
  const hasAdmin = Boolean(authAdminId);

  if ((!hasAdmin) && (!trainerId || !title || !startTime || !endTime)) {
    return res.status(400).json({
      message: "admin authentication, trainerId, title, startTime, and endTime are required.",
    });
  }

  if (!trainerId || !title || !startTime || !endTime) {
    return res.status(400).json({
      message: "trainerId, title, startTime, and endTime are required.",
    });
  }

  if (requiredRole && !USER_MEMBERSHIP_ROLES.has(requiredRole)) {
    return res.status(400).json({
      message:
        "requiredRole must be one of USER, USER_BRONZE, USER_GOLD, USER_PLATINUM if provided.",
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: "startTime and endTime must be valid dates." });
  }

  if (end <= start) {
    return res.status(400).json({ message: "endTime must be after startTime." });
  }

  if (capacity !== undefined && capacity !== null && capacity <= 0) {
    return res
      .status(400)
      .json({ message: "capacity must be greater than zero if provided." });
  }

  try {
    const [admin, trainer, category] = await Promise.all([
      authAdminId ? prisma.user.findUnique({ where: { id: Number(authAdminId) } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { id: Number(trainerId) } }),
      categoryId !== undefined && categoryId !== null
        ? prisma.classCategory.findUnique({ where: { id: Number(categoryId) } })
        : Promise.resolve(null),
    ]);

    if (!admin || admin.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Only admins can create classes." });
    }

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res.status(400).json({ message: "trainerId must reference a trainer user." });
    }

    if (categoryId && !category) {
      return res.status(400).json({ message: "categoryId must reference an existing category." });
    }

    const createdClass = await prisma.class.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        capacity,
        createdById: admin.id,
        trainerId: trainer.id,
        categoryId: category ? category.id : null,
        requiredRole: requiredRole ?? null,
      },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
      },
    });

    return res.status(201).json(createdClass);
  } catch (error) {
    console.error("Failed to create class", error);
    return res.status(500).json({ message: "Failed to create class." });
  }
};

export const listClasses = async (_req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { startTime: "asc" },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
        _count: { select: { enrollments: true } },
      },
    });

    const formatted = classes.map(formatClass);

    return res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch classes", error);
    return res.status(500).json({ message: "Failed to fetch classes." });
  }
};

export const listUpcomingClasses = async (req: Request, res: Response) => {
  try {
    // ใช้เวลาปัจจุบัน (UTC) เปรียบเทียบกับ startTime ที่เก็บใน DB
    const now = new Date();

    const classes = await prisma.class.findMany({
      where: {
        startTime: { gt: now },
        // ถ้ามีสถานะยกเลิก/ปิดรับ สามารถกรองเพิ่มได้ เช่น:
        // status: "ACTIVE",
      },
      orderBy: { startTime: "asc" },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
        _count: { select: { enrollments: true } },
      },
    });

    const formatted = classes.map(formatClass);
    return res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch upcoming classes", error);
    return res.status(500).json({ message: "Failed to fetch upcoming classes." });
  }
};

export const enrollInClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  // Use userId from authenticated token for security
  const authUser = (req as any).authUser;
  const userId = authUser?.id;

  if (!classId) {
    return res.status(400).json({ message: "classId is required." });
  }

  if (!userId) {
    return res.status(401).json({ message: "Authentication required. Please log in to enroll." });
  }

  try {
    const clazz = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!clazz) {
      return res.status(404).json({ message: "Class not found." });
    }

    if (clazz.startTime <= new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot enroll in a class that has started or finished." });
    }

    if (
      clazz.capacity !== null &&
      clazz.capacity !== undefined &&
      clazz._count.enrollments >= clazz.capacity
    ) {
      return res.status(400).json({ message: "Class is already full." });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (
      clazz.requiredRole &&
      !isUserMembershipRole(user.role as Role) &&
      user.role !== Role.ADMIN &&
      user.role !== Role.TRAINER
    ) {
      return res.status(403).json({
        message: "This class is restricted to membership users.",
      });
    }

    if (
      clazz.requiredRole &&
      isUserMembershipRole(user.role as Role) &&
      user.role !== clazz.requiredRole
    ) {
      return res.status(403).json({
        message: `This class is only available to users with role ${clazz.requiredRole}.`,
      });
    }

    try {
      const enrollment = await prisma.classEnrollment.create({
        data: {
          classId: clazz.id,
          userId: user.id,
        },
      });

      return res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
        return res.status(409).json({ message: "User already enrolled in this class." });
      }

      throw error;
    }
  } catch (error) {
    console.error("Failed to enroll in class", error);
    return res.status(500).json({ message: "Failed to enroll in class." });
  }
};

export const listClassEnrollments = async (req: Request, res: Response) => {
  const { classId } = req.params;

  if (!classId) {
    return res.status(400).json({ message: "classId parameter is required." });
  }

  try {
    const clazz = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
      },
    });

    if (!clazz) {
      return res.status(404).json({ message: "Class not found." });
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: Number(classId) },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      class: {
        id: clazz.id,
        title: clazz.title,
        description: clazz.description,
        startTime: clazz.startTime,
        endTime: clazz.endTime,
        capacity: clazz.capacity,
        createdBy: clazz.createdBy,
        trainer: clazz.trainer,
        category: clazz.category,
        requiredRole: clazz.requiredRole,
      },
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        createdAt: enrollment.createdAt,
        user: enrollment.user,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch class enrollments", error);
    return res.status(500).json({ message: "Failed to fetch class enrollments." });
  }
};

export const listTrainerClasses = async (req: Request, res: Response) => {
  const trainerId = Number(req.params.trainerId);
  const authUser = (req as any).authUser;

  if (Number.isNaN(trainerId)) {
    return res.status(400).json({ message: "trainerId parameter must be a valid number." });
  }

  try {
    const trainer = await prisma.user.findUnique({ where: { id: trainerId } });

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    // ถ้าเป็น trainer เอง ตรวจสอบว่าต้องเป็นคลาสของตัวเอง
    if (authUser?.id && authUser.role === Role.TRAINER && Number(authUser.id) !== trainerId) {
      return res.status(403).json({ message: "You can only view your own classes." });
    }

    const classes = await prisma.class.findMany({
      where: { trainerId },
      orderBy: { startTime: "asc" },
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
    });

    const formatted = classes.map(formatClass);

    return res.json({ trainer: { id: trainer.id, email: trainer.email, username: trainer.username }, classes: formatted });
  } catch (error) {
    console.error("Failed to fetch trainer classes", error);
    return res.status(500).json({ message: "Failed to fetch trainer classes." });
  }
};

export const getMyClasses = async (req: Request, res: Response) => {
  const authUser = (req as any).authUser;
  const trainerId = authUser?.id;

  if (!trainerId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const trainer = await prisma.user.findUnique({ where: { id: Number(trainerId) } });

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res.status(403).json({ message: "Only trainers can view their classes." });
    }

    const classes = await prisma.class.findMany({
      where: { trainerId: Number(trainerId) },
      orderBy: { startTime: "asc" },
      include: {
        category: true,
        _count: { select: { enrollments: true } },
      },
    });

    const formatted = classes.map(formatClass);

    return res.json({ trainer: { id: trainer.id, email: trainer.email, username: trainer.username }, classes: formatted });
  } catch (error) {
    console.error("Failed to fetch my classes", error);
    return res.status(500).json({ message: "Failed to fetch my classes." });
  }
};




export const getClassById = async (req: Request, res: Response) => {
  const classId = Number(req.params.classId);

  if (Number.isNaN(classId)) {
    return res.status(400).json({ message: "classId must be a valid number." });
  }

  try {
    const clazz = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
        _count: { select: { enrollments: true } },
        enrollments: {
          include: {
            user: { select: { id: true, email: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!clazz) {
      return res.status(404).json({ message: "Class not found." });
    }

    const formatted = formatClass(clazz);

    return res.json({
      ...formatted,
      enrollments: clazz.enrollments.map((enrollment) => ({
        id: enrollment.id,
        createdAt: enrollment.createdAt,
        user: enrollment.user,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch class", error);
    return res.status(500).json({ message: "Failed to fetch class." });
  }
};

export const updateClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const {
    trainerId,
    categoryId,
    requiredRole,
    title,
    description,
    startTime,
    endTime,
    capacity,
  } = req.body as {
    trainerId?: number;
    categoryId?: number;
    requiredRole?: Role;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
  };

  const authAdminId = (req as any).authUser?.id;

  if (!classId) {
    return res.status(400).json({ message: "classId is required." });
  }

  if (!authAdminId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const classIdNum = Number(classId);
  if (Number.isNaN(classIdNum)) {
    return res.status(400).json({ message: "classId must be a valid number." });
  }

  try {
    const admin = await prisma.user.findUnique({ where: { id: Number(authAdminId) } });
    if (!admin || admin.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Only admins can update classes." });
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: classIdNum },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found." });
    }

    if (requiredRole && !USER_MEMBERSHIP_ROLES.has(requiredRole)) {
      return res.status(400).json({
        message:
          "requiredRole must be one of USER, USER_BRONZE, USER_GOLD, USER_PLATINUM if provided.",
      });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) {
      if (capacity === null) {
        updateData.capacity = null;
      } else if (capacity <= 0) {
        return res.status(400).json({ message: "capacity must be greater than zero if provided." });
      } else {
        updateData.capacity = capacity;
      }
    }
    if (requiredRole !== undefined) {
      updateData.requiredRole = requiredRole || null;
    }

    if (startTime !== undefined || endTime !== undefined) {
      const start = startTime ? new Date(startTime) : new Date(existingClass.startTime);
      const end = endTime ? new Date(endTime) : new Date(existingClass.endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: "startTime and endTime must be valid dates." });
      }

      if (end <= start) {
        return res.status(400).json({ message: "endTime must be after startTime." });
      }

      updateData.startTime = start;
      updateData.endTime = end;
    }

    if (trainerId !== undefined) {
      const trainer = await prisma.user.findUnique({ where: { id: Number(trainerId) } });
      if (!trainer || trainer.role !== Role.TRAINER) {
        return res.status(400).json({ message: "trainerId must reference a trainer user." });
      }
      updateData.trainerId = trainer.id;
    }

    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.categoryId = null;
      } else {
        const category = await prisma.classCategory.findUnique({
          where: { id: Number(categoryId) },
        });
        if (!category) {
          return res.status(400).json({ message: "categoryId must reference an existing category." });
        }
        updateData.categoryId = category.id;
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classIdNum },
      data: updateData,
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        trainer: { select: { id: true, email: true, username: true, role: true } },
        category: true,
        _count: { select: { enrollments: true } },
      },
    });

    const formatted = formatClass(updatedClass);
    return res.json(formatted);
  } catch (error) {
    console.error("Failed to update class", error);
    return res.status(500).json({ message: "Failed to update class." });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const authAdminId = (req as any).authUser?.id;

  if (!classId) {
    return res.status(400).json({ message: "classId is required." });
  }

  if (!authAdminId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const classIdNum = Number(classId);
  if (Number.isNaN(classIdNum)) {
    return res.status(400).json({ message: "classId must be a valid number." });
  }

  try {
    const admin = await prisma.user.findUnique({ where: { id: Number(authAdminId) } });
    if (!admin || admin.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Only admins can delete classes." });
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: classIdNum },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found." });
    }

    // ลบ enrollments ก่อน (cascade delete)
    await prisma.classEnrollment.deleteMany({
      where: { classId: classIdNum },
    });

    // แล้วค่อยลบ class
    await prisma.class.delete({
      where: { id: classIdNum },
    });

    return res.json({ message: "Class deleted successfully." });
  } catch (error) {
    console.error("Failed to delete class", error);
    return res.status(500).json({ message: "Failed to delete class." });
  }
};




