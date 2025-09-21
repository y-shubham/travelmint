import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    amount: Number, // paise
    status: { type: String, default: "created" }, // created | paid | failed
  },
  { timestamps: true }
);

export default mongoose.model("OrderMap", schema);
