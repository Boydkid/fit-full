import { Router } from "express";
import { requireAdmin, attachAuthIfPresent, requireAuth } from "../middleware/auth";
import {
  createClass,
  listClasses,
  listUpcomingClasses,
  getClassById,
  enrollInClass,
  listClassEnrollments,
  listTrainerClasses,
  updateClass,
  deleteClass,
  getMyClasses,
} from "../controllers/class.controller";

const router = Router();
router.use(attachAuthIfPresent);

router.get("/", listClasses);
router.get("/listclassupcoming", listUpcomingClasses);
router.get("/my-classes", requireAuth, getMyClasses);
router.get("/trainer/:trainerId", listTrainerClasses);
router.post("/", requireAdmin, createClass);
router.put("/:classId", requireAdmin, updateClass);
router.delete("/:classId", requireAdmin, deleteClass);
router.post("/:classId/enroll", requireAuth, enrollInClass);
router.get("/:classId/enrollments", listClassEnrollments);
router.get("/:classId", getClassById);

export default router;
