import { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../utils/prisma";

export const listTrainers = async (_req: Request, res: Response) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: Role.TRAINER },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profileImage: true,
        receivedReviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = trainers.map((trainer) => {
      const ratedReviews = trainer.receivedReviews.filter(
        (review) => review.rating !== null && review.rating !== undefined
      );
      const totalReviews = trainer.receivedReviews.length;
      const ratingCount = ratedReviews.length;
      const averageRating =
        ratingCount > 0
          ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
            ratingCount
          : null;

      return {
        id: trainer.id,
        email: trainer.email,
        username: trainer.username,
        role: trainer.role,
        createdAt: trainer.createdAt,
        updatedAt: trainer.updatedAt,
        profileImage: trainer.profileImage,
        totalReviews,
        averageRating,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch trainers", error);
    return res.status(500).json({ message: "Failed to fetch trainers." });
  }
};

export const getTrainerById = async (req: Request, res: Response) => {
  const trainerId = Number(req.params.trainerId);

  if (Number.isNaN(trainerId)) {
    return res.status(400).json({ message: "trainerId must be a valid number." });
  }

  try {
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profileImage: true,
        receivedReviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const ratedReviews = trainer.receivedReviews.filter(
      (review) => review.rating !== null && review.rating !== undefined
    );
    const totalReviews = trainer.receivedReviews.length;
    const ratingCount = ratedReviews.length;
    const averageRating =
      ratingCount > 0
        ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
          ratingCount
        : null;

    return res.json({
      id: trainer.id,
      email: trainer.email,
      username: trainer.username,
      role: trainer.role,
      createdAt: trainer.createdAt,
      updatedAt: trainer.updatedAt,
      profileImage: trainer.profileImage,
      totalReviews,
      averageRating,
    });
  } catch (error) {
    console.error("Failed to fetch trainer", error);
    return res.status(500).json({ message: "Failed to fetch trainer." });
  }
};
