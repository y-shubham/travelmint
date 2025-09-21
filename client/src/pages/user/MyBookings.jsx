import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// Small UI helpers ---------------------------------------------------
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ text = "No bookings found." }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-500">
      {text}
    </div>
  );
}

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[64px,1fr,auto] gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm"
        >
          <div className="h-16 w-16 rounded-lg bg-neutral-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-neutral-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    // booking date is likely "YYYY-MM-DD"
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

// Component -----------------------------------------------------------
const MyBookings = () => {
  const { currentUser } = useSelector((state) => state.user);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  // Debounced search term to avoid spamming server
  const [debouncedTerm, setDebouncedTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchBookings = async (term) => {
    if (!currentUser?._id) return;
    setErr("");
    setLoading(true);
    setBookings([]);
    try {
      const res = await fetch(
        `/api/booking/get-UserCurrentBookings/${
          currentUser._id
        }?searchTerm=${encodeURIComponent(term || "")}`
      );
      const data = await res.json();
      if (data?.success) {
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } else {
        setErr(data?.message || "Unable to load bookings.");
      }
    } catch (e) {
      setErr(e?.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(debouncedTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, currentUser?._id]);

  const handleCancel = async (id) => {
    if (!id || !currentUser?._id) return;
    const ok = window.confirm("Cancel this booking?");
    if (!ok) return;

    try {
      setCancellingId(id);
      const res = await fetch(
        `/api/booking/cancel-booking/${id}/${currentUser._id}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data?.success) {
        alert(data?.message || "Booking cancelled");
        // Refresh list
        fetchBookings(debouncedTerm);
      } else {
        alert(data?.message || "Unable to cancel booking");
      }
    } catch (e) {
      alert("Unable to cancel booking");
    } finally {
      setCancellingId("");
    }
  };

  const hasResults = useMemo(() => bookings && bookings.length > 0, [bookings]);

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold">Your Bookings</h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              placeholder="Search by package, date, or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* optional: search icon could go here absolutely positioned */}
          </div>
        </div>

        <ErrorBanner message={err} />

        {/* Content */}
        {loading ? (
          <ListSkeleton rows={4} />
        ) : !hasResults ? (
          <EmptyState text="No current bookings found." />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const pkg = b?.packageDetails;
              const buyer = b?.buyer;
              return (
                <div
                  key={b?._id}
                  className="grid grid-cols-[64px,1fr,auto] gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/package/${pkg?._id}`}
                    className="block h-16 w-16 rounded-lg overflow-hidden border border-neutral-200"
                    title={pkg?.packageName}
                  >
                    <img
                      src={pkg?.packageImages?.[0]}
                      alt={pkg?.packageName || "Package"}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Middle content */}
                  <div className="min-w-0">
                    <Link
                      to={`/package/${pkg?._id}`}
                      className="block font-semibold truncate hover:underline"
                    >
                      {pkg?.packageName || "Package"}
                    </Link>
                    <div className="text-sm text-neutral-700 truncate">
                      {buyer?.username} • {buyer?.email}
                    </div>
                    <div className="text-sm text-neutral-600">
                      Date: {formatDate(b?.date)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCancel(b?._id)}
                      disabled={cancellingId === b?._id}
                      className="inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      title="Cancel booking"
                    >
                      {cancellingId === b?._id ? "Cancelling…" : "Cancel"}
                    </button>
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

export default MyBookings;
