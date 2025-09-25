import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css/bundle";
import {
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaMapMarkerAlt,
  FaShare,
} from "react-icons/fa";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import Rating from "@mui/material/Rating";
import { useSelector } from "react-redux";
import RatingCard from "./RatingCard";
import { formatINR } from "../utils/formatCurrency";

SwiperCore.use([Navigation]);

// Small UI helpers ---------------------------------
function ErrorBanner({ message, onBack }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-start justify-between gap-4">
      <p className="text-sm">{message}</p>
      {onBack && (
        <Link
          to="/"
          className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
        >
          Back to home
        </Link>
      )}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-800">
      {children}
    </span>
  );
}

function Divider() {
  return <hr className="my-6 border-neutral-200" />;
}

// Main component -----------------------------------
const Package = () => {
  const { currentUser } = useSelector((state) => state.user);
  const params = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const [descExpanded, setDescExpanded] = useState(false);

  const [ratingsData, setRatingsData] = useState({
    rating: 0,
    review: "",
    packageId: params?.id,
    userRef: currentUser?._id,
    username: currentUser?.username,
    userProfileImg: currentUser?.avatar,
  });
  const [packageRatings, setPackageRatings] = useState([]);
  const [ratingGiven, setRatingGiven] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMsg, setRatingMsg] = useState("");

  // Derived helpers
  const discountPct = useMemo(() => {
    if (!pkg?.packageOffer) return 0;
    const p = Number(pkg.packagePrice) || 0;
    const d = Number(pkg.packageDiscountPrice) || 0;
    if (p <= 0 || d <= 0 || d >= p) return 0;
    return Math.floor(((p - d) / p) * 100);
  }, [pkg]);

  const getPackageData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`/api/package/get-package-data/${params?.id}`);
      const data = await res.json();
      if (data?.success) {
        setPkg(data?.packageData);
      } else {
        setErr(data?.message || "Something went wrong!");
      }
    } catch (e) {
      setErr(e?.message || "Unable to load package.");
    } finally {
      setLoading(false);
    }
  };

  const getRatings = async () => {
    try {
      const res = await fetch(`/api/rating/get-ratings/${params.id}/4`);
      const data = await res.json();
      setPackageRatings(Array.isArray(data) ? data : []);
    } catch (e) {
      // non-blocking
    }
  };

  const checkRatingGiven = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await fetch(
        `/api/rating/rating-given/${currentUser?._id}/${params?.id}`
      );
      const data = await res.json();
      setRatingGiven(!!data?.given);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (params.id) {
      getPackageData();
      getRatings();
    }
  }, [params.id]);

  useEffect(() => {
    setRatingsData((r) => ({
      ...r,
      userRef: currentUser?._id,
      username: currentUser?.username,
      userProfileImg: currentUser?.avatar,
    }));
    if (currentUser) checkRatingGiven();
  }, [currentUser]);

  const giveRating = async () => {
    setRatingMsg("");
    if (ratingGiven) {
      setRatingMsg("You already submitted a rating for this package.");
      return;
    }
    if (ratingsData.rating === 0 && ratingsData.review.trim() === "") {
      setRatingMsg("Please add a rating or a short review.");
      return;
    }
    if (!ratingsData.userRef) {
      setRatingMsg("Please log in to submit your rating.");
      return;
    }
    try {
      setRatingSubmitting(true);
      const res = await fetch("/api/rating/give-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratingsData),
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        setRatingMsg("Thanks! Your feedback was submitted.");
        setRatingsData((r) => ({ ...r, review: "", rating: 0 }));
        getPackageData();
        getRatings();
        checkRatingGiven();
      } else {
        setRatingMsg(data?.message || "Something went wrong while submitting.");
      }
    } catch (e) {
      setRatingMsg(e?.message || "Unable to submit right now.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  // UI ------------------------------------------------
  return (
    <div className="bg-neutral-50 text-neutral-900">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {loading && (
          <p className="text-center text-sm sm:text-base font-medium">
            Loading…
          </p>
        )}

        {err && <ErrorBanner message={err} onBack />}

        {pkg && !loading && !err && (
          <>
            {/* Media / carousel */}
            <section className="relative">
              <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
                {Array.isArray(pkg.packageImages) &&
                pkg.packageImages.length > 0 ? (
                  <Swiper navigation className="w-full h-[320px] sm:h-[420px]">
                    {pkg.packageImages.map((imageUrl, i) => (
                      <SwiperSlide key={i}>
                        <div
                          className="w-full h-full"
                          style={{
                            background: `url(${imageUrl}) center/cover no-repeat`,
                          }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full h-[320px] sm:h-[420px] bg-neutral-200 grid place-items-center">
                    <span className="text-neutral-600 text-sm">
                      No images available
                    </span>
                  </div>
                )}
              </div>

              {/* Overlay controls */}
              {/* === Overlay controls (transparent pills, same positions) === */}
              <>
                {/* Back (left) */}
                <button
                  onClick={() => navigate(-1)}
                  className="
      absolute top-[13%] left-[3%] z-10
      inline-flex items-center gap-2
      rounded-2xl border border-white/40 bg-white/10 backdrop-blur-sm
      px-3 py-2 text-sm font-medium text-white shadow-sm
      hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
    "
                  title="Back"
                >
                  <FaArrowLeft className="opacity-95" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                {/* Share (right) — transparent like Home pills */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }}
                  className="
      absolute top-[13%] right-[3%] z-10
      inline-flex items-center gap-2
      rounded-2xl border border-white/40 bg-white/10 backdrop-blur-sm
      px-4 py-2 text-sm font-semibold text-white shadow-sm
      hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
    "
                  title="Share link"
                >
                  <FaShare className="opacity-95" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Copied toast */}
                {copied && (
                  <div
                    className="
        absolute top-[23%] right-[3%] z-10
        rounded-full bg-neutral-900/90 text-white text-xs px-3 py-1 shadow
      "
                  >
                    Link copied
                  </div>
                )}
              </>
            </section>

            {/* Content */}
            <section className="grid lg:grid-cols-[1fr,360px] gap-6">
              {/* Left column */}
              <article className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
                    {pkg.packageName}
                  </h1>

                  {pkg.packageTotalRatings > 0 && (
                    <div className="flex items-center gap-2">
                      <Rating
                        value={pkg.packageRating || 0}
                        readOnly
                        precision={0.1}
                      />
                      <span className="text-sm text-neutral-600">
                        ({pkg.packageTotalRatings})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pkg.packageDestination && (
                    <Chip>
                      <FaMapMarkerAlt className="opacity-70" />
                      <span className="capitalize">
                        {pkg.packageDestination}
                      </span>
                    </Chip>
                  )}

                  {(+pkg.packageDays > 0 || +pkg.packageNights > 0) && (
                    <Chip>
                      <FaClock className="opacity-70" />
                      <span className="capitalize">
                        {+pkg.packageDays > 0 &&
                          `${pkg.packageDays} ${
                            +pkg.packageDays > 1 ? "Days" : "Day"
                          }`}
                        {+pkg.packageDays > 0 && +pkg.packageNights > 0
                          ? " · "
                          : ""}
                        {+pkg.packageNights > 0 &&
                          `${pkg.packageNights} ${
                            +pkg.packageNights > 1 ? "Nights" : "Night"
                          }`}
                      </span>
                    </Chip>
                  )}
                </div>

                {/* Price block */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 inline-flex items-center gap-3">
                  {pkg.packageOffer ? (
                    <>
                      <span className="line-through text-neutral-500">
                        {formatINR(pkg.packagePrice)}
                      </span>
                      <span className="text-xl font-semibold">
                        {formatINR(pkg.packageDiscountPrice)}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-xs font-semibold bg-emerald-600 text-white px-2 py-1 rounded">
                          {discountPct}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xl font-semibold">
                      {formatINR(pkg.packagePrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {pkg.packageDescription && (
                  <div className="pt-1">
                    <p className="text-neutral-800">
                      {descExpanded || pkg.packageDescription.length <= 280
                        ? pkg.packageDescription
                        : `${pkg.packageDescription.slice(0, 150)}…`}
                    </p>
                    {pkg.packageDescription.length > 280 && (
                      <button
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:underline underline-offset-4"
                      >
                        {descExpanded ? (
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
                )}

                <Divider />

                {/* Details */}
                {pkg.packageAccommodation && (
                  <div>
                    <h3 className="text-lg font-semibold">Accommodation</h3>
                    <p className="text-neutral-800">
                      {pkg.packageAccommodation}
                    </p>
                  </div>
                )}

                {pkg.packageActivities && (
                  <div>
                    <h3 className="text-lg font-semibold">Activities</h3>
                    <p className="text-neutral-800">{pkg.packageActivities}</p>
                  </div>
                )}

                {pkg.packageMeals && (
                  <div>
                    <h3 className="text-lg font-semibold">Meals</h3>
                    <p className="text-neutral-800">{pkg.packageMeals}</p>
                  </div>
                )}

                {pkg.packageTransportation && (
                  <div>
                    <h3 className="text-lg font-semibold">Transportation</h3>
                    <p className="text-neutral-800">
                      {pkg.packageTransportation}
                    </p>
                  </div>
                )}
              </article>

              {/* Right column (booking + ratings) */}
              <aside className="space-y-6">
                {/* Booking card */}
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Ready to go?</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser) navigate(`/booking/${params?.id}`);
                      else navigate("/login");
                    }}
                    className="w-full bg-neutral-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  >
                    Book now
                  </button>
                </div>

                {/* Ratings */}
                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Ratings & Reviews</h3>

                  {/* Submit */}
                  {currentUser ? (
                    ratingGiven ? (
                      <p className="text-sm text-neutral-600">
                        You’ve already rated this package.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <Rating
                          name="user-rating"
                          value={ratingsData.rating}
                          onChange={(_, v) =>
                            setRatingsData((d) => ({ ...d, rating: v }))
                          }
                        />
                        <textarea
                          rows={3}
                          className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                          placeholder="Share a short review (optional)"
                          value={ratingsData.review}
                          onChange={(e) =>
                            setRatingsData((d) => ({
                              ...d,
                              review: e.target.value,
                            }))
                          }
                        />
                        {ratingMsg && (
                          <p className="text-xs text-neutral-600">
                            {ratingMsg}
                          </p>
                        )}
                        <button
                          disabled={
                            ratingSubmitting ||
                            (ratingsData.rating === 0 &&
                              ratingsData.review.trim() === "")
                          }
                          onClick={giveRating}
                          className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white bg-neutral-900 disabled:bg-neutral-400 hover:opacity-90"
                        >
                          {ratingSubmitting ? "Submitting…" : "Submit"}
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white bg-neutral-900 hover:opacity-90"
                    >
                      Log in to rate
                    </button>
                  )}

                  {/* List (preview) */}
                  <div className="grid 2xl:grid-cols-6 xl:grid-cols-5 xlplus:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-2">
                    <RatingCard packageRatings={packageRatings} />
                    {pkg.packageTotalRatings > 4 && (
                      <button
                        onClick={() =>
                          navigate(`/package/ratings/${params?.id}`)
                        }
                        className="flex items-center justify-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
                      >
                        View all <FaArrowRight />
                      </button>
                    )}
                  </div>
                  {packageRatings.length === 0 && (
                    <p className="text-sm text-neutral-600">No reviews yet.</p>
                  )}
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Package;
