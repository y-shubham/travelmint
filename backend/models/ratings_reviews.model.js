import mongoose from "mongoose";

const ratingsReviewsSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
    },
    review: {
      type: String,
    },
    packageId: {
      type: String,
      required: true,
    },
    userRef: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userProfileImg: {
      type: String,
      default:
        "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
    },
  },
  { timestamps: true }
);

const RatingReview = mongoose.model("RatingReview", ratingsReviewsSchema);

export default RatingReview;
