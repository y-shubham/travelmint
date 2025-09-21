import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// --- Small UI helpers ------------------------------------------------
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ text = "No past bookings yet." }) {
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

function StatusChip({ status }) {
  const s = (status || "").toLowerCase();
  const styles =
    s === "cancelled"
      ? "bg-red-50 text-red-700 border-red-200"
      : s === "completed" || s === "done"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-neutral-50 text-neutral-700 border-neutral-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${styles}`}
    >
      {status || "Completed"}
    </span>
  );
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt)
    ? d
    : dt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

// --- Component -------------------------------------------------------
const MyHistory = () => {
  const { currentUser } = useSelector((state) => state.user);

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [deletingId, setDeletingId] = useState("");

  // Debounce search to reduce requests
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const getAllBookings = async (term) => {
    if (!currentUser?._id) return;
    setErr("");
    setLoading(true);
    setAllBookings([]);
    try {
      const res = await fetch(
        `/api/booking/get-allUserBookings/${
          currentUser._id
        }?searchTerm=${encodeURIComponent(term || "")}`
      );
      const data = await res.json();
      if (data?.success) {
        setAllBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } else {
        setErr(data?.message || "Unable to load history.");
      }
    } catch (e) {
      setErr(e?.message || "Unable to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBookings(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, currentUser?._id]);

  const handleHistoryDelete = async (id) => {
    if (!id || !currentUser?._id) return;
    const ok = window.confirm("Remove this booking from your history?");
    if (!ok) return;
    try {
      setDeletingId(id);
      const res = await fetch(
        `/api/booking/delete-booking-history/${id}/${currentUser._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data?.success) {
        alert(data?.message || "Removed from history");
        getAllBookings(debounced);
      } else {
        alert(data?.message || "Unable to delete");
      }
    } catch {
      alert("Unable to delete");
    } finally {
      setDeletingId("");
    }
  };

  const canDelete = (b) => {
    // Original logic: allow delete if past date OR status === "Cancelled"
    const past = new Date(b?.date).getTime() < Date.now();
    return past || (b?.status || "").toLowerCase() === "cancelled";
    // If you need stricter rules, adjust here.
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-6 space-y-4">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              placeholder="Search past bookings"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ErrorBanner message={err} />

        {/* Content */}
        {loading ? (
          <ListSkeleton rows={4} />
        ) : allBookings.length === 0 ? (
          <EmptyState text="No past bookings found." />
        ) : (
          <div className="space-y-3">
            {allBookings.map((b) => {
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

                  {/* Middle */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/package/${pkg?._id}`}
                        className="font-semibold truncate hover:underline"
                        title={pkg?.packageName}
                      >
                        {pkg?.packageName || "Package"}
                      </Link>
                      <StatusChip status={b?.status} />
                    </div>
                    <div className="text-sm text-neutral-700 truncate">
                      {buyer?.username} • {buyer?.email}
                    </div>
                    <div className="text-sm text-neutral-600">
                      Date: {formatDate(b?.date)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {canDelete(b) && (
                      <button
                        onClick={() => handleHistoryDelete(b?._id)}
                        disabled={deletingId === b?._id}
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        title="Remove from history"
                      >
                        {deletingId === b?._id ? "Deleting…" : "Delete"}
                      </button>
                    )}
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

export default MyHistory;
