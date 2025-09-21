import React, { useEffect, useMemo, useState } from "react";
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

function EmptyState({ children = "No packages found." }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-500">
      {children}
    </div>
  );
}

function ListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-16 w-16 rounded-lg bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-neutral-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            id={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition ${
              active
                ? "bg-white shadow border border-neutral-200"
                : "text-neutral-700 hover:bg-white/50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Main component ---------------------------------------------------
const AllPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "offer" | "latest" | "top"
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced
  const [showMoreBtn, setShowMoreBtn] = useState(false);
  const [error, setError] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const buildUrl = (startIndex) => {
    const base = new URLSearchParams();
    if (q) base.set("searchTerm", q);
    if (typeof startIndex === "number")
      base.set("startIndex", String(startIndex));

    if (filter === "offer") base.set("offer", "true");
    else if (filter === "latest") base.set("sort", "createdAt");
    else if (filter === "top") base.set("sort", "packageRating");

    return `/api/package/get-packages?${base.toString()}`;
  };

  const getPackages = () => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setPackages([]);
      setShowMoreBtn(false);
      setError("");
      setLoading(true);
      try {
        const res = await fetch(buildUrl(), { signal });
        const data = await res.json();
        if (data?.success) {
          setPackages(data?.packages || []);
          setShowMoreBtn(
            Array.isArray(data?.packages) && data.packages.length > 8
          );
        } else {
          setError(data?.message || "Something went wrong!");
        }
      } catch (e) {
        if (e.name !== "AbortError") setError("Unable to load packages.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = getPackages();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q]);

  const onShowMoreClick = async () => {
    try {
      const startIndex = packages.length;
      const res = await fetch(buildUrl(startIndex));
      const data = await res.json();
      const next = data?.packages || [];
      setPackages((p) => [...p, ...next]);
      if (next.length < 9) setShowMoreBtn(false);
    } catch (e) {
      // silent fail
      setShowMoreBtn(false);
    }
  };

  const handleDelete = async (packageId) => {
    const ok = confirm("Delete this package? This cannot be undone.");
    if (!ok) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/package/delete-package/${packageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      alert(data?.message || "Done");
      getPackages();
    } catch (error) {
      alert("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "offer", label: "Offer" },
      { value: "latest", label: "Latest" },
      { value: "top", label: "Top" },
    ],
    []
  );

  const hasData = packages && packages.length > 0;

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto max-w-5xl space-y-4">
        {/* Controls */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">All Packages</h2>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                className="w-full sm:w-72 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                type="text"
                placeholder="Search packages"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Segmented
                value={filter}
                onChange={setFilter}
                options={filterOptions}
              />
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* List */}
        {loading ? (
          <ListSkeleton count={6} />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-2">
              {packages.map((pack) => (
                <div
                  key={pack._id}
                  className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4 hover:shadow transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Link to={`/package/${pack._id}`} className="shrink-0">
                      <img
                        src={pack?.packageImages?.[0]}
                        alt={pack?.packageName || "Package image"}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-neutral-200"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/package/${pack._id}`}
                        className="block font-medium text-sm sm:text-base text-neutral-900 hover:underline truncate"
                        title={pack?.packageName}
                      >
                        {pack?.packageName}
                      </Link>
                      <p className="text-xs text-neutral-600 truncate">
                        {pack?.packageDestination}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Link
                        to={`/profile/admin/update-package/${pack._id}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(pack?._id)}
                        className="text-red-600 hover:underline text-sm font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showMoreBtn && (
              <div className="pt-2">
                <button
                  onClick={onShowMoreClick}
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:bg-neutral-400"
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Show More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllPackages;
