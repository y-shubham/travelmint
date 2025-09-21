import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PackageCard from "./PackageCard";

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    searchTerm: "",
    offer: false,
    sort: "createdAt",
    order: "desc",
  });

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [err, setErr] = useState("");

  // Parse URL -> state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm") || "";
    const offerFromUrl = urlParams.get("offer");
    const sortFromUrl = urlParams.get("sort") || "createdAt";
    const orderFromUrl = urlParams.get("order") || "desc";

    setFilters({
      searchTerm: searchTermFromUrl,
      offer: offerFromUrl === "true",
      sort: sortFromUrl,
      order: orderFromUrl,
    });

    const fetchAll = async () => {
      try {
        setLoading(true);
        setErr("");
        setShowMore(false);

        // backend likely paginates to 8 by default
        const res = await fetch(
          `/api/package/get-packages?${urlParams.toString()}`
        );
        const data = await res.json();
        setPackages(Array.isArray(data?.packages) ? data.packages : []);
        setShowMore((data?.packages?.length || 0) > 8);
      } catch (e) {
        setErr(e?.message || "Unable to load packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [location.search]);

  // Events
  const handleChange = (e) => {
    const { id, value, checked, type } = e.target;

    if (id === "searchTerm") {
      setFilters((f) => ({ ...f, searchTerm: value }));
    } else if (id === "offer") {
      setFilters((f) => ({ ...f, offer: !!checked }));
    } else if (id === "sort_order") {
      const [sort, order] = (value || "createdAt_desc").split("_");
      setFilters((f) => ({
        ...f,
        sort: sort || "createdAt",
        order: order || "desc",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    if (filters.searchTerm) urlParams.set("searchTerm", filters.searchTerm);
    urlParams.set("offer", String(filters.offer));
    urlParams.set("sort", filters.sort);
    urlParams.set("order", filters.order);
    navigate(`/search?${urlParams.toString()}`);
  };

  const onShowMoreClick = async () => {
    const startIndex = packages.length;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", String(startIndex));

    const res = await fetch(
      `/api/package/get-packages?${urlParams.toString()}`
    );
    const data = await res.json();
    const next = Array.isArray(data?.packages) ? data.packages : [];
    setPackages((prev) => [...prev, ...next]);
    if (next.length < 9) setShowMore(false);
  };

  // Helpers
  const defaultSortValue = useMemo(
    () => `${filters.sort || "createdAt"}_${filters.order || "desc"}`,
    [filters.sort, filters.order]
  );

  return (
    <div className="bg-neutral-50 text-neutral-900">
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Sidebar */}
          <aside className="md:sticky md:top-4 h-max rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="searchTerm"
                  className="text-sm font-medium text-neutral-800"
                >
                  Search
                </label>
                <input
                  id="searchTerm"
                  type="text"
                  placeholder="Destinations, themes, cities…"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  value={filters.searchTerm}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">
                  Type
                </span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="offer"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={filters.offer}
                    onChange={handleChange}
                  />
                  <span>Offer</span>
                </label>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="sort_order"
                  className="text-sm font-medium text-neutral-800"
                >
                  Sort
                </label>
                <select
                  id="sort_order"
                  onChange={handleChange}
                  value={defaultSortValue}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                >
                  <option value="packagePrice_desc">Price: high to low</option>
                  <option value="packagePrice_asc">Price: low to high</option>
                  <option value="packageRating_desc">Top rated</option>
                  <option value="packageTotalRatings_desc">Most rated</option>
                  <option value="createdAt_desc">Latest</option>
                  <option value="createdAt_asc">Oldest</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
              >
                Search
              </button>
            </form>
          </aside>

          {/* Results */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6 py-3">
              <h1 className="text-lg sm:text-xl font-semibold">
                Package Results
              </h1>
              {loading && (
                <span className="text-sm text-neutral-600">Loading…</span>
              )}
            </header>

            <div className="p-4 sm:p-6">
              {/* Error */}
              {err && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                  {err}
                </div>
              )}

              {/* Loading */}
              {loading && <GridSkeleton count={8} />}

              {/* Empty */}
              {!loading && !err && packages.length === 0 && <EmptyState />}

              {/* Grid */}
              {!loading && !err && packages.length > 0 && (
                <>
                  <div className="grid gap-4 2xl:grid-cols-4 xlplus:grid-cols-3 lg:grid-cols-2">
                    {packages.map((pkg, i) => (
                      <PackageCard key={pkg?._id || i} packageData={pkg} />
                    ))}
                  </div>

                  {showMore && (
                    <div className="pt-6">
                      <button
                        onClick={onShowMoreClick}
                        className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Show more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

/* --- Small UI helpers --- */
function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-4 xlplus:grid-cols-3 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-64 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="h-36 w-full bg-neutral-200 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-neutral-600">
      No packages found. Try changing filters or keywords.
    </div>
  );
}

export default Search;
