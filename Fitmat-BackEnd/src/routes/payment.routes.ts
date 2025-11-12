import { Router } from "express";
import multer from "multer";
import {
  uploadPaymentProof,
  listPaymentProofs,
  getPaymentProofImage,
  listAllPaymentProofs,
} from "../controllers/payment.controller";
import { requireAdmin, attachAuthIfPresent } from "../middleware/auth";

const router = Router();
router.use(attachAuthIfPresent);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/", upload.single("paymentImage"), uploadPaymentProof);
router.get("/", requireAdmin, listPaymentProofs);
router.get("/all", requireAdmin, listAllPaymentProofs);
router.get("/:paymentId/image", requireAdmin, getPaymentProofImage);

export default router;
