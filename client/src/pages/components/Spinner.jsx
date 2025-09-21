import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Spinner = ({ path = "login", seconds = 3, message = "Please wait…" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [count, setCount] = useState(() => Math.max(1, Number(seconds) || 3));
  const total = useMemo(() => Math.max(1, Number(seconds) || 3), [seconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (count <= 0) {
      navigate(`/${path}`, { state: location.pathname });
    }
  }, [count, navigate, location, path]);

  const pct = Math.min(
    100,
    Math.max(0, Math.round(((total - count) / total) * 100))
  );

  return (
    <div className="min-h-dvh w-full bg-neutral-50 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 space-y-4 text-center">
        {/* Spinner */}
        <div className="mx-auto h-12 w-12 relative">
          <svg
            className="h-12 w-12 text-neutral-200"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
          <svg
            className="absolute inset-0 h-12 w-12 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22 12a10 10 0 0 0-10-10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-neutral-900"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
            {message}
          </h1>
          <p
            className="text-sm text-neutral-600"
            aria-live="polite"
            aria-atomic="true"
          >
            Redirecting in <span className="font-semibold">{count}</span>…
          </p>
        </div>

        {/* Progress */}
        <div className="w-full">
          <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-neutral-900 transition-all duration-300"
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">{pct}%</p>
        </div>

        {/* Fallback action (optional) */}
        <div className="pt-2">
          <button
            onClick={() => navigate(`/${path}`, { state: location.pathname })}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Go now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
