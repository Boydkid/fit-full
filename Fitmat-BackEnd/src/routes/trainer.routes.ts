import { Router } from "express";
import { listTrainers, getTrainerById } from "../controllers/trainer.controller";

const router = Router();

router.get("/", listTrainers);
router.get("/:trainerId", getTrainerById);

export default router;

