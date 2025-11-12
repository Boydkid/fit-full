"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.use(auth_1.attachAuthIfPresent);
// Admin user management routes
router.get("/", auth_1.requireAdmin, user_controller_1.listUsers);
router.get("/roles", auth_1.requireAdmin, user_controller_1.listUserRoles);
// Password change route (requires authentication)
router.post("/change-password", auth_1.requireAuth, user_controller_1.changePassword);
// User profile routes
router.get("/:id/classes", user_controller_1.getUserEnrolledClasses);
router.delete("/:id/classes/:classId", user_controller_1.deleteUserClassEnrollment);
router.patch("/:userId/role", auth_1.requireAdmin, user_controller_1.updateUserRole);
router.get("/:id", user_controller_1.getUserProfile);
router.put("/:id", user_controller_1.updateUserProfile);
exports.default = router;
