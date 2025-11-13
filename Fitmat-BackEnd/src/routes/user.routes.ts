import { Router } from "express";
import { requireAdmin, attachAuthIfPresent, requireAuth } from "../middleware/auth";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  listUsers,
  listUserRoles,
  getUserEnrolledClasses,
  deleteUserClassEnrollment,
  updateUserRole,
} from "../controllers/user.controller";

const router = Router();
router.use(attachAuthIfPresent);

// Admin user management routes
router.get("/", requireAdmin, listUsers);
router.get("/roles", requireAdmin, listUserRoles);

// Password change route (requires authentication)
router.post("/change-password", requireAuth, changePassword);

// User profile routes
router.get("/:id/classes", getUserEnrolledClasses);
router.delete("/:id/classes/:classId", deleteUserClassEnrollment);
router.patch("/:userId/role", requireAdmin, updateUserRole);
router.get("/:id", getUserProfile);
router.put("/:id", updateUserProfile);

export default router;
