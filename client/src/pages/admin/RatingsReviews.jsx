import { Rating } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const RatingsReviews = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "most"
  const [search, setSearch] = useState("");
  const [showMoreBtn, setShowMoreBtn] = useState(false);
  const [error, setError] = useState("");

  const fetchUrl = (startIndex) => {
    const base =
      filter === "most"
        ? `/api/package/get-packages?searchTerm=${encodeURIComponent(
            search
          )}&sort=packageTotalRatings`
        : `/api/package/get-packages?searchTerm=${encodeURIComponent(
            search
          )}&sort=packageRating`;
    return typeof startIndex === "number"
      ? `${base}&startIndex=${startIndex}`
      : base;
  };

  const getPackages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(fetchUrl());
      const data = await res.json();
      if (data?.success) {
        setPackages(data?.packages || []);
        setShowMoreBtn((data?.packages?.length || 0) > 8);
      } else {
        setError(data?.message || "Something went wrong!");
      }
    } catch (e) {
      setError(e?.message || "Unable to load packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const onShowMoreSClick = async () => {
    const startIndex = packages.length;
    const res = await fetch(fetchUrl(startIndex));
    const data = await res.json();
    setPackages((prev) => [...prev, ...(data?.packages || [])]);
    if (!data?.packages || data.packages.length < 9) setShowMoreBtn(false);
  };

  const totalRatings = useMemo(
    () =>
      packages.reduce(
        (sum, p) => sum + (Number(p?.packageTotalRatings) || 0),
        0
      ),
    [packages]
  );

  return (
    <div className="w-full flex justify-center">
      <div className="w-[95%] rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
        {/* Header / Filters / Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Ratings & Reviews
            </h1>
            <p className="text-sm text-neutral-500">
              {loading ? "…" : `${packages.length} packages`}
              {packages.length > 0 && <> · {totalRatings} total ratings</>}
            </p>

            {/* Filter pills */}
            <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === "all"
                    ? "bg-white shadow border border-neutral-200"
                    : "text-neutral-700 hover:bg-white/70"
                }`}
              >
                Top Rated
              </button>
              <button
                onClick={() => setFilter("most")}
                className={`ml-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition ${
                  filter === "most"
                    ? "bg-white shadow border border-neutral-200"
                    : "text-neutral-700 hover:bg-white/70"
                }`}
              >
                Most Rated
              </button>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[260px]">
            <input
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              type="text"
              placeholder="Search package"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {!!error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Header row (md+) */}
        {!loading && !error && packages.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-4">
            <span className="col-span-6 text-xs font-semibold text-neutral-600">
              Package
            </span>
            <span className="col-span-3 text-xs font-semibold text-neutral-600">
              Rating
            </span>
            <span className="col-span-3 text-right text-xs font-semibold text-neutral-600">
              Total Ratings
            </span>
          </div>
        )}

        {/* Rows */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[74px] rounded-xl border border-neutral-200 bg-neutral-100 animate-pulse"
              />
            ))}
          </div>
        ) : packages && packages.length > 0 ? (
          packages.map((pack) => (
            <div
              key={pack?._id}
              className="
                group
                rounded-xl border border-neutral-200 bg-white shadow-xs
                px-3 sm:px-4 py-3 sm:py-4
                transition-transform duration-300
                hover:scale-[1.01] hover:shadow-md hover:border-neutral-300
                focus-within:scale-[1.01]
              "
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Package */}
                <div className="md:col-span-6 min-w-0">
                  <div className="md:hidden text-xs text-neutral-500 mb-1">
                    Package
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      to={`/package/ratings/${pack?._id}`}
                      className="shrink-0"
                    >
                      <img
                        src={pack?.packageImages?.[0]}
                        alt="image"
                        className="w-12 h-12 rounded object-cover border border-neutral-200 transition group-hover:shadow-sm"
                      />
                    </Link>
                    <Link
                      to={`/package/ratings/${pack?._id}`}
                      className="truncate text-sm font-medium hover:underline"
                      title={pack?.packageName}
                    >
                      {pack?.packageName || "—"}
                    </Link>
                  </div>
                </div>

                {/* Rating (adds hover scale like older code) */}
                <div className="md:col-span-3 min-w-0">
                  <div className="md:hidden text-xs text-neutral-500">
                    Rating
                  </div>
                  <div
                    className="
                      inline-flex items-center gap-2
                      transition-transform duration-300
                      group-hover:scale-[1.03]
                    "
                  >
                    <Rating
                      value={Number(pack?.packageRating) || 0}
                      precision={0.1}
                      readOnly
                      size="small"
                    />
                    <span className="text-sm text-neutral-600">
                      {Number(pack?.packageRating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Total ratings */}
                <div className="md:col-span-3 flex md:justify-end">
                  <div className="md:hidden text-xs text-neutral-500 mr-2">
                    Total
                  </div>
                  <div className="text-sm font-semibold">
                    {pack?.packageTotalRatings ?? 0}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          !error && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-10 text-neutral-500">
              No ratings available.
            </div>
          )
        )}

        {/* Show more */}
        {!loading && showMoreBtn && (
          <div className="pt-2">
            <button
              onClick={onShowMoreSClick}
              className="text-sm bg-neutral-900 text-white rounded-xl px-4 py-2.5 font-semibold hover:opacity-90"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsReviews;
