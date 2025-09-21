import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Rating } from "@mui/material";
import RatingCard from "./RatingCard";

const RatingsPage = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [packageRatings, setPackageRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const getRatings = async () => {
    try {
      setLoading(true);
      setErr("");

      const [resList, resMeta] = await Promise.all([
        fetch(`/api/rating/get-ratings/${params.id}/999999999999`),
        fetch(`/api/rating/average-rating/${params.id}`),
      ]);

      const [list, meta] = await Promise.all([resList.json(), resMeta.json()]);

      if (!Array.isArray(list)) {
        setPackageRatings([]);
      } else {
        setPackageRatings(list);
      }

      setAvgRating(Number(meta?.rating || 0));
      setTotalRatings(Number(meta?.totalRatings || 0));
    } catch (e) {
      setErr(e?.message || "Unable to load ratings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) getRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const EmptyState = () => (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-600">
      No ratings yet.
    </div>
  );

  return (
    <div className="bg-neutral-50 text-neutral-900 min-h-[calc(100svh-4rem)]">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Ratings</h1>
            {!loading && (
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
                <Rating
                  value={avgRating}
                  readOnly
                  precision={0.1}
                  size="small"
                />
                <span className="text-sm text-neutral-700">
                  ({totalRatings})
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/package/${params?.id}`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            Back to package
          </button>
        </div>

        {/* Content card */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6 space-y-4">
          {loading && (
            <p className="text-center text-sm sm:text-base font-medium">
              Loading…
            </p>
          )}

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {err}
            </div>
          )}

          {!loading && !err && (
            <>
              {packageRatings.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-3 sm:gap-4 2xl:grid-cols-7 xl:grid-cols-6 xlplus:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
                  <RatingCard packageRatings={packageRatings} />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default RatingsPage;
