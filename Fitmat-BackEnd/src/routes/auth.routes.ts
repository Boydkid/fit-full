import { Router } from "express";
import { login, register, requestPasswordReset, verifyResetToken, resetPassword, logout, reissueToken } from "../controllers/auth.controller";
import { changePassword } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/reissue-token", reissueToken);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth, changePassword);

export default router;
