import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FaCalendar, FaSearch, FaStar } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { LuBadgePercent } from "react-icons/lu";
import PackageCard from "./PackageCard";
import "./styles/Home.css";

// --- Small UI helpers ---
function Section({ title, cta, loading, items = [], children }) {
  const showEmpty = !loading && items.length === 0;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {cta}
      </div>

      {loading ? <GridSkeleton /> : showEmpty ? <EmptyState /> : children}
    </section>
  );
}

function Grid({ children }) {
  return (
    <div className="grid 2xl:grid-cols-5 xlplus:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid 2xl:grid-cols-5 xlplus:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-4">
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
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-500">
      No packages found.
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-start justify-between gap-4">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// --- Main component ---
const Home = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [topPackages, setTopPackages] = useState([]);
  const [latestPackages, setLatestPackages] = useState([]);
  const [offerPackages, setOfferPackages] = useState([]);

  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [error, setError] = useState("");

  const isGloballyLoading = loadingTop || loadingLatest || loadingOffers;

  const runFetch = async (url, signal) => {
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (!data?.success) {
      throw new Error(data?.message || "Something went wrong!");
    }
    return data?.packages ?? [];
  };

  const loadAll = () => {
    const controller = new AbortController();
    const { signal } = controller;

    setError("");
    setLoadingTop(true);
    setLoadingLatest(true);
    setLoadingOffers(true);

    Promise.all([
      runFetch("/api/package/get-packages?sort=packageRating&limit=8", signal)
        .then(setTopPackages)
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => setLoadingTop(false)),

      runFetch("/api/package/get-packages?sort=createdAt&limit=8", signal)
        .then(setLatestPackages)
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => setLoadingLatest(false)),

      runFetch(
        "/api/package/get-packages?sort=createdAt&offer=true&limit=6",
        signal
      )
        .then(setOfferPackages)
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => setLoadingOffers(false)),
    ]);

    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = loadAll();
    return cleanup;
  }, []);

  const viewAllCTAs = useMemo(
    () => ({
      top: (
        <button
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline underline-offset-4"
          onClick={() => navigate("/search?sort=packageRating")}
        >
          View all
        </button>
      ),
      latest: (
        <button
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline underline-offset-4"
          onClick={() => navigate("/search?sort=createdAt")}
        >
          View all
        </button>
      ),
      offers: (
        <button
          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline underline-offset-4"
          onClick={() => navigate("/search?offer=true")}
        >
          View all
        </button>
      ),
    }),
    [navigate]
  );

  const onSubmitSearch = (e) => {
    e.preventDefault();
    navigate(`/search?searchTerm=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-dvh w-full bg-neutral-50 text-neutral-900 flex flex-col">
      {/* Hero */}
      <div className="relative w-full">
        <div className="backaground_image w-full h-[320px] sm:h-[420px] md:h-[520px]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="mx-auto max-w-4xl text-center space-y-3">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Discover TravelMint
            </h1>
            <p className="text-white/90 text-sm sm:text-base font-medium">
              Make your travel dream come true with our curated packages
            </p>

            <form
              onSubmit={onSubmitSearch}
              className="mt-6 w-full flex items-center justify-center gap-2"
              role="search"
              aria-label="Search packages"
            >
              <label htmlFor="home-search" className="sr-only">
                Search packages
              </label>
              <input
                id="home-search"
                type="text"
                className="rounded-xl outline-none w-[240px] sm:w-[420px] md:w-[560px] px-4 py-2.5 border border-white/30 bg-white/15 text-white placeholder:text-white/70 backdrop-blur focus:ring-2 focus:ring-white/60 focus:border-white/60"
                placeholder="Search destinations, themes, or cities"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-white/95 text-neutral-900 px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
              >
                <FaSearch aria-hidden className="text-xs" />
                Search
              </button>
            </form>

            {/* Quick Filters */}
            <div className="mt-6 w-full max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => navigate("/search?offer=true")}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 text-white border border-white/30 px-3 py-2 text-xs sm:text-sm hover:bg-white/20 transition"
              >
                Best Offers <LuBadgePercent className="text-base sm:text-lg" />
              </button>
              <button
                onClick={() => navigate("/search?sort=packageRating")}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 text-white border border-white/30 px-3 py-2 text-xs sm:text-sm hover:bg-white/20 transition"
              >
                Top Rated <FaStar className="text-base sm:text-lg" />
              </button>
              <button
                onClick={() => navigate("/search?sort=createdAt")}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 text-white border border-white/30 px-3 py-2 text-xs sm:text-sm hover:bg-white/20 transition"
              >
                Latest <FaCalendar className="text-sm sm:text-base" />
              </button>
              <button
                onClick={() => navigate("/search?sort=packageTotalRatings")}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 text-white border border-white/30 px-3 py-2 text-xs sm:text-sm hover:bg-white/20 transition"
              >
                Most Rated <FaRankingStar className="text-base sm:text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <ErrorBanner
          message={error}
          onRetry={isGloballyLoading ? undefined : loadAll}
        />

        {/* Top Packages */}
        <Section
          title="Top Packages"
          cta={viewAllCTAs.top}
          loading={loadingTop}
          items={topPackages}
        >
          <Grid>
            {topPackages.map((pkg, i) => (
              <PackageCard key={pkg?._id || i} packageData={pkg} />
            ))}
          </Grid>
        </Section>

        {/* Latest Packages */}
        <Section
          title="Latest Packages"
          cta={viewAllCTAs.latest}
          loading={loadingLatest}
          items={latestPackages}
        >
          <Grid>
            {latestPackages.map((pkg, i) => (
              <PackageCard key={pkg?._id || i} packageData={pkg} />
            ))}
          </Grid>
        </Section>

        {/* Offers */}
        <div className="offers_img rounded-2xl overflow-hidden border border-neutral-200 shadow-sm" />
        <Section
          title="Best Offers"
          cta={viewAllCTAs.offers}
          loading={loadingOffers}
          items={offerPackages}
        >
          <Grid>
            {offerPackages.map((pkg, i) => (
              <PackageCard key={pkg?._id || i} packageData={pkg} />
            ))}
          </Grid>
        </Section>
      </main>
    </div>
  );
};

export default Home;
