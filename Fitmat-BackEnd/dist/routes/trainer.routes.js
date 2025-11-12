"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainer_controller_1 = require("../controllers/trainer.controller");
const router = (0, express_1.Router)();
router.get("/", trainer_controller_1.listTrainers);
router.get("/:trainerId", trainer_controller_1.getTrainerById);
exports.default = router;
