import express from "express";
import crypto from "crypto";
import OrderMap from "../models/order.map.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/mailer.js";
import paymentEmail from "../emails/payment.js";

const router = express.Router();

// IMPORTANT: this route must be mounted with express.raw({ type: "application/json" }) in index.js
router.post("/razorpay", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");
    if (
      !signature ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured") {
      const p = event.payload.payment.entity; // id, order_id, amount, method, status...

      const map = await OrderMap.findOneAndUpdate(
        { razorpayOrderId: p.order_id },
        { $set: { status: "paid" } },
        { new: true }
      ).populate("userId");

      if (map?.userId?.email) {
        await sendEmail({
          to: map.userId.email,
          subject: "Payment received",
          html: paymentEmail(map.userId.username || "there", p),
        });
      }
    }

    return res.json({ received: true });
  } catch (e) {
    console.error("Webhook error", e);
    res.status(500).send("Webhook error");
  }
});

export default router;
