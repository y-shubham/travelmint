import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

// Routes
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import packageRoute from "./routes/package.route.js";
import ratingRoute from "./routes/rating.route.js";
import bookingRoute from "./routes/booking.route.js";
import webhookRoutes from "./routes/webhook.route.js";

import { verifyMailer } from "./utils/mailer.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// --- DB ---
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// --- CORS ---
app.use(
  cors({
    origin: process.env.BASE_URL, // http://localhost:5173
    credentials: true,
  })
);

// --- Webhooks ---
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// --- Normal middleware ---
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/package", packageRoute);
app.use("/api/rating", ratingRoute);
app.use("/api/booking", bookingRoute);

// --- SMTP self-check ---
verifyMailer();

if (process.env.NODE_ENV_CUSTOM === "production") {
  app.use(express.static(path.join(__dirname, "/client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Welcome to TravelMint");
  });
}

// --- Listen ---
const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
