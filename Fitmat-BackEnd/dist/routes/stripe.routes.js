"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/stripe.routes.ts
const express_1 = require("express");
const stripe_controller_1 = require("../controllers/stripe.controller");
const router = (0, express_1.Router)();
router.post("/checkout", stripe_controller_1.createCheckoutSession);
router.post("/webhook", stripe_controller_1.handleWebhook);
router.get("/verify", stripe_controller_1.verifySession);
exports.default = router;
