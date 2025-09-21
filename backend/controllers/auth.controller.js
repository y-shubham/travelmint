import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mailer.js";
import { signScopedToken, verifyScopedToken } from "../utils/tokens.js";
import verificationEmail from "../emails/verification.js";
import resetEmail from "../emails/reset.js";

export const test = (req, res) => res.send("Hello From Test!");

export const signupController = async (req, res) => {
  try {
    const { username, email, password, address, phone } = req.body;

    if (!username || !email || !password || !phone) {
      return res
        .status(200)
        .send({ success: false, message: "All fields are required!" });
    }

    if (!process.env.JWT_EMAIL_SECRET || !process.env.BASE_URL) {
      return res.status(500).send({
        success: false,
        message:
          "Server misconfigured: email verification settings missing. Contact admin.",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(200)
        .send({ success: false, message: "User already exists please login" });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      address,
      phone,
      isVerified: false,
    });

    try {
      const token = signScopedToken(
        { _id: newUser._id, email },
        "verify",
        "30m"
      );
      const link = `${
        process.env.BASE_URL
      }/verify-email?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: email,
        subject: "Verify your email",
        html: verificationEmail(username, link),
      });

      return res.status(201).send({
        success: true,
        message: "User created. Check your email to verify your account.",
      });
    } catch (mailErr) {
      console.error("Signup mail error:", mailErr?.message || mailErr);
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).send({
        success: false,
        message:
          "We couldn't send the verification email. Please try again later.",
      });
    }
  } catch (error) {
    console.log("Signup error:", error?.message || error);
    return res
      .status(500)
      .send({ success: false, message: "Error in server!" });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(200)
        .send({ success: false, message: "All fields are required!" });
    }

    const validUser = await User.findOne({ email });
    if (!validUser)
      return res
        .status(404)
        .send({ success: false, message: "User not found!" });

    // block unverified
    if (!validUser.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return res
        .status(200)
        .send({ success: false, message: "Invalid email or password" });
    }

    const token = await jwt.sign(
      { id: validUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "4d" }
    );
    const { password: pass, ...rest } = validUser._doc;
    res
      .cookie("X_TTMS_access_token", token, {
        httpOnly: true,
        maxAge: 4 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .send({ success: true, message: "Login Success", user: rest });
  } catch (error) {
    console.log(error);
  }
};

export const logOutController = (req, res) => {
  try {
    res.clearCookie("X_TTMS_access_token");
    res.status(200).send({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
  }
};

// VERIFY EMAIL (GET /api/auth/verify-email?token=...)
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const data = verifyScopedToken(token, "verify");
    const user = await User.findByIdAndUpdate(
      data._id,
      { $set: { isVerified: true, verifiedAt: new Date() } },
      { new: true }
    );
    if (!user)
      return res
        .status(400)
        .send({ success: false, message: "User not found" });
    res.send({ success: true, message: "Email verified. You can log in now." });
  } catch (e) {
    res
      .status(400)
      .send({ success: false, message: "Invalid or expired token" });
  }
};

// FORGOT PASSWORD (POST { email })
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // respond 200 either way
    if (!user)
      return res.send({
        success: true,
        message: "If that email exists, you'll receive a link.",
      });

    const token = signScopedToken({ _id: user._id, email }, "reset", "20m");
    const link = `${
      process.env.BASE_URL
    }/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: resetEmail(user.username, link),
    });

    res.send({
      success: true,
      message: "If that email exists, you'll receive a link.",
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .send({ success: false, message: "Could not send reset link" });
  }
};

// RESET PASSWORD (POST { token, newPassword })
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const data = verifyScopedToken(token, "reset");
    const hashed = bcryptjs.hashSync(newPassword, 10);
    await User.findByIdAndUpdate(data._id, {
      $set: { password: hashed, lastPasswordResetAt: new Date() },
    });
    res.send({ success: true, message: "Password updated" });
  } catch (e) {
    res
      .status(400)
      .send({ success: false, message: "Invalid or expired token" });
  }
};
