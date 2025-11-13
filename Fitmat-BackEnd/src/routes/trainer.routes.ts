import { Router } from "express";
import { listTrainers, getTrainerById, createBooking,listBookings,listMyTrainerBookings  } from "../controllers/trainer.controller";
import { requireAuth,requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", listTrainers);

// ⭐ เส้นนี้เฉพาะยูสเซอร์ → ต้องมาก่อน
router.get("/my-bookings", requireAuth, listMyTrainerBookings);

// ⭐ เส้นนี้เป็นรายการทั้งหมด → ต้องอยู่ถัดมา
router.get("/bookings", requireAuth, listBookings);

router.post("/book", requireAuth, createBooking);

// ❗ เส้นกินทุกอย่าง ต้องอยู่ล่างสุดเท่านั้น
router.get("/:trainerId", getTrainerById);

export default router;
