// src/routes/stripe.routes.ts
import { Router } from "express";
import { createCheckoutSession, handleWebhook,verifySession } from "../controllers/stripe.controller";
const router = Router();
router.post("/checkout", createCheckoutSession);
router.post("/webhook", handleWebhook);
router.get("/verify", verifySession);
export default router;
