import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import reviewRoutes from "./routes/review.routes";
import trainerRoutes from "./routes/trainer.routes";
import classRoutes from "./routes/class.routes";
import contactRoutes from "./routes/contact.routes";
import classCategoryRoutes from "./routes/classCategory.routes";
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import stripeRoutes from "./routes/stripe.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
// Stripe webhook requires raw body BEFORE json middleware
app.use("/api/stripe/webhook", bodyParser.raw({ type: "application/json" })); // raw เฉพาะ webhook
app.use(bodyParser.json({ limit: "2mb" }));
app.use("/api/stripe", stripeRoutes);

app.use("/api", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/class-categories", classCategoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (_req, res) => {
  res.send("API Server is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
