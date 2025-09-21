import Package from "../models/package.model.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import Booking from "../models/booking.model.js";
import OrderMap from "../models/order.map.model.js";
dotenv.config();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//create package
export const createPackage = async (req, res) => {
  try {
    const {
      packageName,
      packageDescription,
      packageDestination,
      packageDays,
      packageNights,
      packageAccommodation,
      packageTransportation,
      packageMeals,
      packageActivities,
      packagePrice,
      packageDiscountPrice,
      packageOffer,
      packageImages,
    } = req.body;

    if (
      !packageName ||
      !packageDescription ||
      !packageDestination ||
      !packageAccommodation ||
      !packageTransportation ||
      !packageMeals ||
      !packageActivities ||
      !packageOffer === "" ||
      !packageImages
    ) {
      return res.status(200).send({
        success: false,
        message: "All fields are required!",
      });
    }
    if (packagePrice < packageDiscountPrice) {
      return res.status(200).send({
        success: false,
        message: "Regular price should be greater than discount price!",
      });
    }
    if (packagePrice <= 0 || packageDiscountPrice < 0) {
      return res.status(200).send({
        success: false,
        message: "Price should be greater than 0!",
      });
    }
    if (packageDays <= 0 && packageNights <= 0) {
      return res.status(200).send({
        success: false,
        message: "Provide days and nights!",
      });
    }

    const newPackage = await Package.create(req.body);
    if (newPackage) {
      return res.status(201).send({
        success: true,
        message: "Package created successfully",
      });
    } else {
      return res.status(500).send({
        success: false,
        message: "Soemthing went wrong",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

//get all packages
export const getPackages = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    let offer = req.query.offer;
    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const packages = await Package.find({
      $or: [
        { packageName: { $regex: searchTerm, $options: "i" } },
        { packageDestination: { $regex: searchTerm, $options: "i" } },
      ],
      packageOffer: offer,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);
    if (packages) {
      return res.status(200).send({
        success: true,
        packages,
      });
    } else {
      return res.status(500).send({
        success: false,
        message: "No Packages yet",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

//get package data
export const getPackageData = async (req, res) => {
  try {
    const packageData = await Package.findById(req?.params?.id);
    if (!packageData) {
      return res.status(404).send({
        success: false,
        message: "Package not found!",
      });
    }
    return res.status(200).send({
      success: true,
      packageData,
    });
  } catch (error) {
    console.log(error);
  }
};

//update package
export const updatePackage = async (req, res) => {
  try {
    const findPackage = await Package.findById(req.params.id);
    if (!findPackage)
      return res.status(404).send({
        success: false,
        message: "Package not found!",
      });

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Package updated successfully!",
      updatedPackage,
    });
  } catch (error) {
    console.log(error);
  }
};

//delete package
export const deletePackage = async (req, res) => {
  try {
    const deletePackage = await Package.findByIdAndDelete(req?.params?.id);
    return res.status(200).send({
      success: true,
      message: "Package Deleted!",
    });
  } catch (error) {
    cnsole.log(error);
  }
};

// --- Razorpay controllers ---
export const getRazorpayKey = (req, res) => {
  return res
    .status(200)
    .send({ success: true, key: process.env.RAZORPAY_KEY_ID });
};


export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    // Use authenticated user id (don't trust body)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount)), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // Persist mapping for webhook -> email
    await OrderMap.create({
      razorpayOrderId: order.id,
      userId,
      bookingId: bookingId || null,
      amount: order.amount,
      status: "created",
    });

    return res.status(200).send({ success: true, order });
  } catch (error) {
    console.log("createRazorpayOrder error:", error?.message || error);
    return res
      .status(500)
      .send({ success: false, message: "Failed to create order" });
  }
};