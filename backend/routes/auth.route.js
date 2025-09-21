import express from "express";
import {
  test,
  signupController,
  loginController,
  logOutController,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Test
router.get("/test", test);

// Auth
router.post("/signup", signupController);
router.post("/login", loginController);

// Email verification
// GET /api/auth/verify-email?token=...
router.get("/verify-email", verifyEmail);

// Password reset
router.post("/forgot-password", forgotPassword); // { email }
router.post("/reset-password", resetPassword); // { token, newPassword }

// Logout
router.get("/logout", requireSignIn, logOutController);

export default router;
