import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD", // change to "INR" if needed
  maximumFractionDigits: 2,
});

const Payments = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const getAllBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/booking/get-allBookings?searchTerm=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      if (data?.success) {
        setAllBookings(data?.bookings || []);
        setError("");
      } else {
        setError(data?.message || "Something went wrong!");
      }
    } catch (e) {
      setError(e?.message || "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  const totalAmount = useMemo(
    () => allBookings.reduce((sum, b) => sum + (Number(b?.totalPrice) || 0), 0),
    [allBookings]
  );

  return (
    <div className="w-full flex justify-center">
      <div className="w-[95%] rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
        {/* Header + Search */}
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Payments
            </h1>
            <p className="text-sm text-neutral-500">
              {loading ? "…" : `${allBookings.length} records`}
              {allBookings.length > 0 && (
                <> · Total {currency.format(totalAmount)}</>
              )}
            </p>
          </div>

          <div className="w-full max-w-xs">
            <input
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              type="text"
              placeholder="Search username or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <p className="text-center text-sm sm:text-base font-medium">
            Loading…
          </p>
        )}
        {!!error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Column headers (md+) */}
        {!loading && !error && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-4">
            <span className="col-span-4 text-xs font-semibold text-neutral-600">
              Package
            </span>
            <span className="col-span-2 text-xs font-semibold text-neutral-600">
              User
            </span>
            <span className="col-span-3 text-xs font-semibold text-neutral-600">
              Email
            </span>
            <span className="col-span-2 text-xs font-semibold text-neutral-600">
              Date
            </span>
            <span className="col-span-1 text-right text-xs font-semibold text-neutral-600">
              Amount
            </span>
          </div>
        )}

        {/* Rows */}
        {!loading &&
          !error &&
          allBookings.map((booking) => {
            const pkg = booking?.packageDetails;
            const buyer = booking?.buyer;
            return (
              <div
                key={booking?._id}
                className="rounded-xl border border-neutral-200 bg-white shadow-xs px-3 sm:px-4 py-3 sm:py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Package */}
                  <div className="md:col-span-4 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500 mb-1">
                      Package
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <Link to={`/package/${pkg?._id}`} className="shrink-0">
                        <img
                          className="w-12 h-12 rounded object-cover border border-neutral-200"
                          src={pkg?.packageImages?.[0]}
                          alt="Package"
                        />
                      </Link>
                      <Link
                        to={`/package/${pkg?._id}`}
                        className="truncate text-sm font-medium hover:underline"
                        title={pkg?.packageName}
                      >
                        {pkg?.packageName || "—"}
                      </Link>
                    </div>
                  </div>

                  {/* User */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      User
                    </div>
                    <div className="truncate text-sm">
                      {buyer?.username || "—"}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-3 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      Email
                    </div>
                    <div className="truncate text-sm">
                      {buyer?.email || "—"}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      Date
                    </div>
                    <div className="truncate whitespace-nowrap text-sm">
                      {fmtDate(booking?.date)}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-1 flex md:justify-end">
                    <div className="text-sm font-semibold">
                      {currency.format(Number(booking?.totalPrice) || 0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && !error && allBookings.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-10 text-neutral-500">
            No payments found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
