import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import ensureVerified from "../middlewares/ensureVerified.js";
import {
  getRazorpayKey,
  createRazorpayOrder,
  createPackage,
  deletePackage,
  getPackageData,
  getPackages,
  updatePackage,
} from "../controllers/package.controller.js";

const router = express.Router();

// Admin: create/update/delete packages
router.post("/create-package", requireSignIn, isAdmin, createPackage);
router.post("/update-package/:id", requireSignIn, isAdmin, updatePackage);
router.delete("/delete-package/:id", requireSignIn, isAdmin, deletePackage);

// Public: browse packages
router.get("/get-packages", getPackages);
router.get("/get-package-data/:id", getPackageData);

// Payments
router.get("/razorpay/key", getRazorpayKey); // key_id is safe to expose
router.post(
  "/razorpay/create-order",
  requireSignIn,
  ensureVerified,
  createRazorpayOrder
); // only signed-in & verified users can create orders

export default router;
