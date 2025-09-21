import React from "react";
import { Link } from "react-router-dom";
import { Rating } from "@mui/material";
import { FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { formatINR } from "../utils/formatCurrency"; // same util used in Package.jsx

const PackageCard = ({ packageData = {} }) => {
  const {
    _id,
    packageImages = [],
    packageName = "",
    packageDestination = "",
    packageDays = 0,
    packageNights = 0,
    packagePrice = 0,
    packageDiscountPrice = 0,
    packageOffer, // canonical flag
    offer, // some APIs use 'offer' – we’ll treat either as truthy
    packageRating = 0,
    packageTotalRatings = 0,
  } = packageData;

  const hasDiscount =
    (packageOffer || offer) &&
    Number(packageDiscountPrice) > 0 &&
    Number(packageDiscountPrice) < Number(packagePrice);

  const discountPct = hasDiscount
    ? Math.floor(
        ((Number(packagePrice) - Number(packageDiscountPrice)) /
          Number(packagePrice)) *
          100
      )
    : 0;

  const imgSrc = packageImages?.[0];

  return (
    <Link
      to={`/package/${_id}`}
      aria-label={`Open ${packageName}`}
      className="group block"
    >
      <article
        className="
          h-full w-full rounded-2xl border border-neutral-200 bg-white shadow-sm
          overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md
          focus-within:ring-2 focus-within:ring-neutral-300
        "
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={imgSrc}
            alt={packageName || "Package image"}
            className="
              h-48 w-full object-cover transition-transform duration-300
              group-hover:scale-[1.03]
            "
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 rounded-full bg-emerald-600 text-white text-xs font-semibold px-2 py-1 shadow">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Title + rating */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 capitalize">
              {packageName}
            </h3>
            {packageTotalRatings > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Rating
                  value={Number(packageRating) || 0}
                  size="small"
                  readOnly
                  precision={0.1}
                />
                <span className="text-xs text-neutral-600">
                  ({packageTotalRatings})
                </span>
              </div>
            )}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {packageDestination && (
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800">
                <FaMapMarkerAlt className="opacity-70" />
                <span className="capitalize">{packageDestination}</span>
              </span>
            )}
            {(Number(packageDays) > 0 || Number(packageNights) > 0) && (
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800">
                <FaClock className="opacity-70" />
                <span className="capitalize">
                  {Number(packageDays) > 0 &&
                    `${packageDays} ${
                      Number(packageDays) > 1 ? "Days" : "Day"
                    }`}
                  {Number(packageDays) > 0 && Number(packageNights) > 0
                    ? " · "
                    : ""}
                  {Number(packageNights) > 0 &&
                    `${packageNights} ${
                      Number(packageNights) > 1 ? "Nights" : "Night"
                    }`}
                </span>
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-sm text-neutral-500 line-through">
                    {formatINR(packagePrice)}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-neutral-900">
                    {formatINR(packageDiscountPrice)}
                  </span>
                </>
              ) : (
                <span className="text-base sm:text-lg font-semibold text-neutral-900">
                  {formatINR(packagePrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default PackageCard;
