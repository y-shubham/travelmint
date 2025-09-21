import express from "express";
import {
  bookPackage,
  cancelBooking,
  deleteBookingHistory,
  getAllBookings,
  getAllUserBookings,
  getCurrentBookings,
  getUserCurrentBookings,
} from "../controllers/booking.controller.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import ensureVerified from "../middlewares/ensureVerified.js";

const router = express.Router();

// Book package (must be signed in + verified)
router.post(
  "/book-package/:packageId",
  requireSignIn,
  ensureVerified,
  bookPackage
);

// Admin: get all current bookings
router.get("/get-currentBookings", requireSignIn, isAdmin, getCurrentBookings);

// Admin: get all bookings
router.get("/get-allBookings", requireSignIn, isAdmin, getAllBookings);

// User: get current bookings by user id
router.get(
  "/get-UserCurrentBookings/:id",
  requireSignIn,
  ensureVerified,
  getUserCurrentBookings
);

// User: get all bookings by user id
router.get(
  "/get-allUserBookings/:id",
  requireSignIn,
  ensureVerified,
  getAllUserBookings
);

// User: delete booking history
router.delete(
  "/delete-booking-history/:id/:userId",
  requireSignIn,
  ensureVerified,
  deleteBookingHistory
);

// User: cancel booking by id
router.post(
  "/cancel-booking/:id/:userId",
  requireSignIn,
  ensureVerified,
  cancelBooking
);

export default router;
