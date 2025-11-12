"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.attachAuthIfPresent);
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
router.post("/", upload.single("paymentImage"), payment_controller_1.uploadPaymentProof);
router.get("/", auth_1.requireAdmin, payment_controller_1.listPaymentProofs);
router.get("/all", auth_1.requireAdmin, payment_controller_1.listAllPaymentProofs);
router.get("/:paymentId/image", auth_1.requireAdmin, payment_controller_1.getPaymentProofImage);
exports.default = router;
