import React, { useEffect, useMemo, useState } from "react";
import { FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import { formatINR } from "../../utils/formatCurrency"

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Small helpers
const getTomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const Booking = () => {
  const { currentUser } = useSelector((state) => state.user);
  const params = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [persons, setPersons] = useState(1);
  const [date, setDate] = useState("");
  const [rzpKey, setRzpKey] = useState("");

  // Load package
  const getPackageData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(
        `/api/package/get-package-data/${params?.packageId}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data?.success) {
        setPkg(data.packageData);
      } else {
        setErr(data?.message || "Something went wrong!");
      }
    } catch (e) {
      setErr(e?.message || "Unable to load package.");
    } finally {
      setLoading(false);
    }
  };

  // Razorpay key
  const initRazorpay = async () => {
    try {
      const ok = await loadRazorpay();
      if (!ok) return;
      const { data } = await axios.get(`/api/package/razorpay/key`);
      if (data?.success) setRzpKey(data.key);
    } catch (e) {
      // non-blocking
    }
  };

  useEffect(() => {
    if (params?.packageId) getPackageData();
    initRazorpay();
    setDate(getTomorrowISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.packageId]);

  // Derived amounts
  const pricePerPerson = useMemo(() => {
    if (!pkg) return 0;
    return pkg.packageOffer && pkg.packageDiscountPrice > 0
      ? Number(pkg.packageDiscountPrice) || 0
      : Number(pkg.packagePrice) || 0;
  }, [pkg]);

  const discountPct = useMemo(() => {
    if (!pkg?.packageOffer) return 0;
    const p = Number(pkg.packagePrice) || 0;
    const d = Number(pkg.packageDiscountPrice) || 0;
    if (p <= 0 || d <= 0 || d >= p) return 0;
    return Math.floor(((p - d) / p) * 100);
  }, [pkg]);

  const totalPrice = useMemo(
    () => pricePerPerson * persons,
    [pricePerPerson, persons]
  );

  const handleBookPackage = async () => {
    if (!currentUser?._id) {
      alert("Please log in to continue.");
      navigate("/login");
      return;
    }
    if (!date || persons <= 0 || !pkg?._id) {
      alert("Please select a date and number of travelers.");
      return;
    }

    try {
      setLoading(true);

      // Create Razorpay order in paise
      const amountPaise = Math.round(totalPrice * 100);
      const { data } = await axios.post(
        `/api/package/razorpay/create-order`,
        { amount: amountPaise },
        { withCredentials: true }
      );

      if (!data?.success) {
        alert("Failed to create payment order");
        return;
      }

      const options = {
        key: rzpKey,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "TravelMint",
        description: pkg.packageName,
        order_id: data.order.id,

        handler: async (rzpResp) => {
          try {
            const bookingPayload = {
              packageDetails: params?.packageId,
              buyer: currentUser?._id,
              totalPrice,
              persons,
              date,
            };

            const verifyRes = await fetch("/api/booking/verify-and-book", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: rzpResp.razorpay_order_id,
                razorpay_payment_id: rzpResp.razorpay_payment_id,
                razorpay_signature: rzpResp.razorpay_signature,
                booking: bookingPayload,
              }),
            });

            const data = await verifyRes.json();

            if (data?.success) {
              alert(data?.message || "Booking successful!");
              navigate(
                `/profile/${currentUser?.user_role === 1 ? "admin" : "user"}`
              );
            } else {
              alert(data?.message || "Booking failed");
            }
          } catch {
            alert("Booking failed");
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert("Payment init failed");
      setLoading(false);
    }
  };

  // UI
  return (
    <div className="bg-neutral-50 text-neutral-900">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Book Package</h1>
        </header>

        {/* Content card */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6">
          {loading && (
            <p className="text-center text-sm sm:text-base font-medium">
              Loading…
            </p>
          )}

          {err && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {err}
            </div>
          )}

          {pkg && !loading && !err && (
            <div className="grid lg:grid-cols-[1fr,420px] gap-6">
              {/* Left: Traveler info (read-only from profile) */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4">
                <h2 className="text-lg font-semibold">Your Details</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Username" value={currentUser?.username || ""} />
                  <Field label="Email" value={currentUser?.email || ""} />
                  <Field label="Phone" value={currentUser?.phone || ""} />
                  <Field label="City" value={currentUser?.address || ""} />
                </div>

                <p className="text-xs text-neutral-600">
                  To edit your details, go to{" "}
                  <button
                    className="underline underline-offset-4 font-medium hover:opacity-80"
                    onClick={() =>
                      navigate(
                        `/profile/${
                          currentUser?.user_role === 1 ? "admin" : "user"
                        }`
                      )
                    }
                  >
                    Profile
                  </button>
                  .
                </p>
              </div>

              {/* Right: Package summary & booking controls */}
              <aside className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4">
                {/* Package summary */}
                <div className="flex items-start gap-3">
                  <img
                    src={pkg.packageImages?.[0]}
                    alt={pkg.packageName}
                    className="h-20 w-28 rounded-lg object-cover border border-neutral-200"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-lg capitalize truncate">
                      {pkg.packageName}
                    </p>
                    <p className="flex items-center gap-2 text-green-700 font-medium capitalize">
                      <FaMapMarkerAlt /> {pkg.packageDestination}
                    </p>
                    {(+pkg.packageDays > 0 || +pkg.packageNights > 0) && (
                      <p className="flex items-center gap-2 text-sm text-neutral-700">
                        <FaClock />
                        {+pkg.packageDays > 0 &&
                          `${pkg.packageDays} ${
                            +pkg.packageDays > 1 ? "Days" : "Day"
                          }`}
                        {+pkg.packageDays > 0 && +pkg.packageNights > 0
                          ? " · "
                          : ""}
                        {+pkg.packageNights > 0 &&
                          `${pkg.packageNights} ${
                            +pkg.packageNights > 1 ? "Nights" : "Night"
                          }`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price block */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 inline-flex items-center gap-3">
                  {pkg.packageOffer ? (
                    <>
                      <span className="line-through text-neutral-500">
                        {formatINR(pkg.packagePrice)}
                      </span>
                      <span className="text-xl font-semibold">
                        {formatINR(pkg.packageDiscountPrice)}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-xs font-semibold bg-emerald-600 text-white px-2 py-1 rounded">
                          {discountPct}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xl font-semibold">
                      {formatINR(pkg.packagePrice)}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label
                    htmlFor="date"
                    className="text-sm font-medium text-neutral-800"
                  >
                    Select date
                  </label>
                  <input
                    id="date"
                    type="date"
                    min={getTomorrowISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-max rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  />
                </div>

                {/* Persons selector */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-neutral-800">
                    Travelers
                  </label>
                  <div className="inline-flex items-center rounded-xl border border-neutral-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPersons((n) => Math.max(1, n - 1))}
                      className="px-3 py-2 text-sm font-semibold hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      value={persons}
                      readOnly
                      className="w-12 text-center text-sm border-x border-neutral-300 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setPersons((n) => Math.min(10, n + 1))}
                      className="px-3 py-2 text-sm font-semibold hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {persons} × {formatINR(pricePerPerson)}
                    </span>
                    <span className="font-semibold">
                      {formatINR(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Payment status + CTA */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-neutral-600">
                    Payment: {rzpKey ? "Ready" : "Loading…"}
                  </p>
                  <button
                    className="w-full inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:bg-neutral-400"
                    onClick={handleBookPackage}
                    disabled={
                      loading ||
                      !rzpKey ||
                      !currentUser?._id ||
                      !date ||
                      persons < 1
                    }
                  >
                    {loading ? "Processing…" : "Pay & Book"}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-neutral-800">{label}</label>
      <input
        type="text"
        value={value}
        disabled
        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
      />
    </div>
  );
}

export default Booking;
