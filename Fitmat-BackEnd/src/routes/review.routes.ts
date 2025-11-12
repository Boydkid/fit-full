import { Router } from "express";
import { requireAdmin, attachAuthIfPresent } from "../middleware/auth";
import {
  createReview,
  listReviews,
  getReviewSummary,
  getTrainerReviews,
  deleteReview,
} from "../controllers/review.controller";

const router = Router();
router.use(attachAuthIfPresent);

router.get("/summary", getReviewSummary);
router.get("/trainer/:trainerId", getTrainerReviews);
router.get("/", listReviews);
router.post("/", createReview);
router.delete("/:reviewId", requireAdmin, deleteReview);

export default router;
