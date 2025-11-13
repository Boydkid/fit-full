import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { Role } from "@prisma/client";

const ensureAdmin = async (req: Request) => {
  const authUser = (req as any).authUser;
  if (authUser?.id) {
    const admin = await prisma.user.findUnique({ where: { id: Number(authUser.id) } });
    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error("FORBIDDEN");
    }
    return;
  }
  const adminId = req.query.adminId as string | undefined;
  if (!adminId) {
    throw new Error("adminId query parameter is required.");
  }
  const admin = await prisma.user.findUnique({ where: { id: Number(adminId) } });
  if (!admin || admin.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN");
  }
};

export const uploadPaymentProof = async (req: Request, res: Response) => {
  const { userId, amount, note } = req.body as {
    userId?: string;
    amount?: string;
    note?: string;
  };

  if (!req.file) {
    return res.status(400).json({ message: "paymentImage file is required." });
  }

  const parsedUserId = userId ? Number(userId) : undefined;
  const parsedAmount = amount ? Number(amount) : undefined;

  if (parsedUserId !== undefined && Number.isNaN(parsedUserId)) {
    return res.status(400).json({ message: "userId must be a number." });
  }

  if (parsedAmount !== undefined && Number.isNaN(parsedAmount)) {
    return res.status(400).json({ message: "amount must be a number." });
  }

  try {
    if (parsedUserId !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const paymentProof = await prisma.paymentProof.create({
      data: {
        userId: parsedUserId,
        amount: parsedAmount,
        note,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        imageBase64,
      },
    });

    return res.status(201).json(paymentProof);
  } catch (error) {
    console.error("Failed to store payment proof", error);
    return res.status(500).json({ message: "Failed to store payment proof." });
  }
};

export const listPaymentProofs = async (req: Request, res: Response) => {
  try {
    await ensureAdmin(req);
  } catch (error) {
    if (error instanceof Error && error.message === "adminId query parameter is required.") {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only admins can view payment proofs." });
    }
    throw error;
  }

  const { userId } = req.query as { userId?: string };
  const filters: { userId?: number } = {};

  if (userId) {
    const parsedUserId = Number(userId);
    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({ message: "userId must be a number." });
    }
    filters.userId = parsedUserId;
  }

  try {
    const proofs = await prisma.paymentProof.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        amount: true,
        note: true,
        filename: true,
        mimeType: true,
        createdAt: true,
        user: { select: { id: true, email: true, role: true } },
      },
    });

    return res.json(proofs);
  } catch (error) {
    console.error("Failed to fetch payment proofs", error);
    return res.status(500).json({ message: "Failed to fetch payment proofs." });
  }
};

export const listAllPaymentProofs = async (req: Request, res: Response) => {
  try {
    await ensureAdmin(req);
  } catch (error) {
    if (error instanceof Error && error.message === "adminId query parameter is required.") {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only admins can view payment proofs." });
    }
    throw error;
  }

  try {
    const proofs = await prisma.paymentProof.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });

    return res.json(proofs);
  } catch (error) {
    console.error("Failed to fetch payment proofs", error);
    return res.status(500).json({ message: "Failed to fetch payment proofs." });
  }
};

export const getPaymentProofImage = async (req: Request, res: Response) => {
  try {
    await ensureAdmin(req);
  } catch (error) {
    if (error instanceof Error && error.message === "adminId query parameter is required.") {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "Only admins can view payment proofs." });
    }
    throw error;
  }

  const paymentId = Number(req.params.paymentId);

  if (Number.isNaN(paymentId)) {
    return res.status(400).json({ message: "paymentId must be a valid number." });
  }

  try {
    const proof = await prisma.paymentProof.findUnique({ where: { id: paymentId } });

    if (!proof) {
      return res.status(404).json({ message: "Payment proof not found." });
    }

    const buffer = Buffer.from(proof.imageBase64, "base64");
    const mimeType = proof.mimeType || "application/octet-stream";
    const filename = proof.filename || `payment-proof-${proof.id}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    console.error("Failed to fetch payment proof image", error);
    return res.status(500).json({ message: "Failed to fetch payment proof image." });
  }
};
