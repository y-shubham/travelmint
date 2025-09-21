import React, { useState } from "react";
import { Rating } from "@mui/material";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import defaultProfileImg from "../assets/images/profile.png"; // adjust if needed

const TRUNCATE_AT = 140;

const RatingCard = ({ packageRatings = [] }) => {
  if (!Array.isArray(packageRatings) || packageRatings.length === 0)
    return null;

  return (
    <React.Fragment>
      {packageRatings.map((rating, i) => (
        <div
          key={rating._id || i}
          className="col-span-2 md:col-span-1 xl:col-span-2 2xl:col-span-2 min-w-[240px]"
        >
          <RatingItem rating={rating} />
        </div>
      ))}
    </React.Fragment>
  );
};

function RatingItem({ rating }) {
  const [expanded, setExpanded] = useState(false);

  const {
    userProfileImg,
    username = "Traveler",
    rating: stars = 0,
    review = "",
  } = rating || {};

  const safeAvatar = userProfileImg || defaultProfileImg;
  const displayName = typeof username === "string" ? username : "Traveler";

  const hasLongReview = review && review.length > TRUNCATE_AT;
  const shortText =
    review && review.length
      ? review.slice(0, TRUNCATE_AT) + (hasLongReview ? "…" : "")
      : stars < 3
      ? "Not Bad"
      : "Good";

  return (
    <article className="h-full w-full rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 space-y-2 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        <img
          src={safeAvatar}
          alt={`${displayName}'s avatar`}
          className="h-8 w-8 rounded-full object-cover border border-neutral-200"
        />
        <p className="font-medium truncate">{displayName}</p>
      </div>

      <div className="pointer-events-none">
        <Rating
          value={Number(stars) || 0}
          readOnly
          size="small"
          precision={0.1}
        />
      </div>

      <div className="text-sm text-neutral-800">
        <p className="whitespace-pre-wrap break-words">
          {expanded || !hasLongReview ? review || shortText : shortText}
        </p>

        {hasLongReview && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 rounded"
          >
            {expanded ? (
              <>
                Less <FaArrowUp />
              </>
            ) : (
              <>
                More <FaArrowDown />
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

export default RatingCard;
