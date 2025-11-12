"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const trainer_routes_1 = __importDefault(require("./routes/trainer.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const classCategory_routes_1 = __importDefault(require("./routes/classCategory.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const stripe_routes_1 = __importDefault(require("./routes/stripe.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4000;
app.use((0, cors_1.default)());
// Stripe webhook requires raw body BEFORE json middleware
app.use("/api/stripe/webhook", body_parser_1.default.raw({ type: "application/json" })); // raw เฉพาะ webhook
app.use(body_parser_1.default.json({ limit: "2mb" }));
app.use("/api/stripe", stripe_routes_1.default);
app.use("/api", auth_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/trainers", trainer_routes_1.default);
app.use("/api/classes", class_routes_1.default);
app.use("/api/class-categories", classCategory_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/payments", payment_routes_1.default);
app.use("/api/contact", contact_routes_1.default);
app.get("/", (_req, res) => {
    res.send("API Server is running...");
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
