import User from "../models/user.model.js";

//for routes that need a verified account
export default async function ensureVerified(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("isVerified");
    if (!user?.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Email not verified. Please verify to use this service.",
      });
    }
    next();
  } catch (e) {
    next(e);
  }
}
