import express from "express";
import {
  deleteUserAccount,
  deleteUserAccountAdmin,
  getAllUsers,
  updateProfilePhoto,
  updateUser,
  updateUserPassword,
} from "../controllers/user.controller.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import ensureVerified from "../middlewares/ensureVerified.js";

const router = express.Router();

// User auth check (only passes if signed in AND verified)
router.get("/user-auth", requireSignIn, ensureVerified, (req, res) => {
  return res.status(200).send({ check: true });
});

// Admin auth check (signed in, verified, and admin)
router.get(
  "/admin-auth",
  requireSignIn,
  ensureVerified,
  isAdmin,
  (req, res) => {
    res.status(200).send({ check: true });
  }
);

// Update user details
router.post("/update/:id", requireSignIn, ensureVerified, updateUser);

// Update user profile photo
router.post(
  "/update-profile-photo/:id",
  requireSignIn,
  ensureVerified,
  updateProfilePhoto
);

// Update user password
router.post(
  "/update-password/:id",
  requireSignIn,
  ensureVerified,
  updateUserPassword
);

// Delete user account (self)
router.delete("/delete/:id", requireSignIn, ensureVerified, deleteUserAccount);

// Admin: get all users
router.get("/getAllUsers", requireSignIn, ensureVerified, isAdmin, getAllUsers);

// Admin: delete a user
router.delete(
  "/delete-user/:id",
  requireSignIn,
  ensureVerified,
  isAdmin,
  deleteUserAccountAdmin
);

export default router;
