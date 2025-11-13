import { Router } from "express";
import { listTrainers, getTrainerById, createBooking,listBookings  } from "../controllers/trainer.controller";
import { requireAuth,requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", listTrainers);

// ⭐ ต้องอยู่ก่อน /:trainerId
router.get("/bookings", requireAuth, listBookings);

router.post("/book", requireAuth, createBooking);

// เส้นนี้ต้องอยู่ล่างสุด
router.get("/:trainerId", getTrainerById);


export default router;
