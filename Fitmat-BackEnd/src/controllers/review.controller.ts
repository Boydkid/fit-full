import { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../utils/prisma";
import { verifyToken } from "../utils/jwt";

type TokenPayload = { id?: number; email?: string; role?: string; exp?: number };

export const createReview = async (req: Request, res: Response) => {
  const { trainerId, comment, rating } = req.body as {
    trainerId?: number;
    comment?: string;
    rating?: number;
  };

  // Extract reviewer from JWT instead of trusting client input
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;
  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }
  let reviewerId: number | undefined;
  try {
    const payload = verifyToken<TokenPayload>(token);
    reviewerId = payload?.id;
  } catch (_e) {
    return res.status(401).json({ message: "Invalid token." });
  }

  if (reviewerId === undefined || trainerId === undefined || !comment) {
    return res
      .status(400)
      .json({ message: "reviewerId, trainerId, and comment are required." });
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res
      .status(400)
      .json({ message: "rating must be between 1 and 5." });
  }

  try {
    const [reviewer, trainer] = await Promise.all([
      prisma.user.findUnique({ where: { id: Number(reviewerId) } }),
      prisma.user.findUnique({ where: { id: Number(trainerId) } }),
    ]);

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found." });
    }

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res
        .status(404)
        .json({ message: "Trainer not found or not eligible for reviews." });
    }

    const review = await prisma.trainerReview.create({
      data: {
        reviewerId: reviewer.id,
        trainerId: trainer.id,
        comment,
        rating,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
        trainer: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error("Failed to create review", error);
    return res.status(500).json({ message: "Failed to create review." });
  }
};

export const listReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await prisma.trainerReview.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
        trainer: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    return res.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

export const getReviewSummary = async (_req: Request, res: Response) => {
  try {
    const [aggregate, ratingGroups] = await Promise.all([
      prisma.trainerReview.aggregate({
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.trainerReview.groupBy({
        by: ["rating"],
        _count: {
          rating: true,
        },
        where: {
          rating: {
            not: null,
          },
        },
      }),
    ]);

    const ratingCounts = ratingGroups.reduce<Record<number, number>>((acc, group) => {
      if (group.rating !== null) {
        acc[group.rating] = group._count.rating;
      }
      return acc;
    }, {});

    return res.json({
      totalReviews: aggregate._count.id,
      averageRating: aggregate._avg.rating,
      ratingCounts,
    });
  } catch (error) {
    console.error("Failed to summarize reviews", error);
    return res.status(500).json({ message: "Failed to summarize reviews." });
  }
};

export const getTrainerReviews = async (req: Request, res: Response) => {
  const trainerIdParam = req.params.trainerId;
  const trainerId = Number(trainerIdParam);

  if (!trainerIdParam || Number.isNaN(trainerId)) {
    return res
      .status(400)
      .json({ message: "trainerId parameter must be a valid number." });
  }

  try {
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: {
        id: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!trainer || trainer.role !== Role.TRAINER) {
      return res
        .status(404)
        .json({ message: "Trainer not found or not eligible for reviews." });
    }

    const reviews = await prisma.trainerReview.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    const ratedReviews = reviews.filter((review) => review.rating !== null);
    const averageRating =
      ratedReviews.length > 0
        ? ratedReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
          ratedReviews.length
        : null;

    return res.json({
      trainer,
      totalReviews: reviews.length,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Failed to fetch trainer reviews", error);
    return res.status(500).json({ message: "Failed to fetch trainer reviews." });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  const reviewIdParam = req.params.reviewId;
  const reviewId = Number(reviewIdParam);

  if (!reviewIdParam || Number.isNaN(reviewId)) {
    return res
      .status(400)
      .json({ message: "reviewId parameter must be a valid number." });
  }

  try {
    const review = await prisma.trainerReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    await prisma.trainerReview.delete({
      where: { id: reviewId },
    });

    return res.json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("Failed to delete review", error);
    return res.status(500).json({ message: "Failed to delete review." });
  }
};
