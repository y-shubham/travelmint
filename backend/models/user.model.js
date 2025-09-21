import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://firebasestorage.googleapis.com/v0/b/travelmint-app.firebasestorage.app/o/Sample_User_Icon.png?alt=media&token=90ddcd5c-9d7a-44e8-ba8a-2ace06d9dc57",
    },
    user_role: { type: Number, default: 0 },

    // NEW:
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    lastPasswordResetAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
