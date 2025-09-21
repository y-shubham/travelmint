import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Chart from "../components/Chart";

// ---- Small UI helpers ------------------------------------------------
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ children = "No bookings found." }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-500">
      {children}
    </div>
  );
}

function GridSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 rounded bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const map = {
    slate: "bg-neutral-100 text-neutral-700 border-neutral-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        map[tone] || map.slate
      }`}
    >
      {children}
    </span>
  );
}

// ---- Main component ---------------------------------------------------
const AllBookings = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search a bit for nicer UX
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const getAllBookings = () => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setCurrentBookings([]);
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/booking/get-currentBookings?searchTerm=${encodeURIComponent(
            q
          )}`,
          { signal }
        );
        const data = await res.json();
        if (data?.success) {
          setCurrentBookings(data?.bookings || []);
        } else {
          setError(data?.message || "Something went wrong.");
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setError("Unable to load bookings.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = getAllBookings();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleCancel = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/booking/cancel-booking/${id}/${currentUser._id}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data?.success) {
        alert(data?.message);
        getAllBookings();
      } else {
        alert(data?.message || "Cancel failed.");
      }
    } catch (error) {
      console.log(error);
      alert("Cancel failed.");
    } finally {
      setLoading(false);
    }
  };

  const hasData = currentBookings && currentBookings.length > 0;

  const header = useMemo(
    () => (
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">All Bookings</h2>
          <input
            className="w-full sm:w-80 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            type="text"
            placeholder="Search username or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Inline chart when data exists */}
        {hasData && (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-3">
            <Chart data={currentBookings} />
          </div>
        )}
      </div>
    ),
    [searchTerm, hasData, currentBookings]
  );

  return (
    <div className="w-full flex justify-center">
      <div className="w-[95%] max-w-5xl space-y-4 p-3">
        <ErrorBanner message={error} />

        {header}

        {loading ? (
          <GridSkeleton count={6} />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {currentBookings.map((booking, i) => {
              const pkg = booking?.packageDetails;
              const buyer = booking?.buyer;
              const status = booking?.status; // may be undefined
              const isCancelled = status === "Cancelled";

              return (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Package cover + name */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Link to={`/package/${pkg?._id}`} className="shrink-0">
                        <img
                          className="h-12 w-12 rounded-lg object-cover border border-neutral-200"
                          src={pkg?.packageImages?.[0]}
                          alt={pkg?.packageName || "Package"}
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/package/${pkg?._id}`}
                          className="block font-medium text-sm sm:text-base text-neutral-900 hover:underline truncate"
                          title={pkg?.packageName}
                        >
                          {pkg?.packageName || "—"}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-600">
                          <span className="truncate">
                            {buyer?.username || "—"}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {buyer?.email || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date + status */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge tone="slate">{booking?.date || "—"}</Badge>
                      {status && (
                        <Badge tone={isCancelled ? "red" : "green"}>
                          {status}
                        </Badge>
                      )}
                    </div>

                    {/* Action */}
                    <div className="sm:ml-auto">
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={isCancelled || loading}
                        className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                          isCancelled || loading
                            ? "bg-neutral-400 cursor-not-allowed"
                            : "bg-red-600 hover:opacity-95"
                        }`}
                        title={
                          isCancelled ? "Already cancelled" : "Cancel booking"
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBookings;
