import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../utils/api";

const initialForm = {
  username: "",
  email: "",
  password: "",
  address: "", // holds City
  phone: "",
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState({ type: "", text: "" });

  const errors = useMemo(() => validate(formData), [formData]);
  const isValid = Object.keys(errors).length === 0;

  function validate(values) {
    const e = {};
    if (!values.username.trim()) e.username = "Username is required.";
    if (!values.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      e.email = "Enter a valid email.";
    }
    if (!values.password) {
      e.password = "Password is required.";
    } else if (values.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    // City (address) is optional
    if (!values.phone.trim()) {
      e.phone = "Phone is required.";
    } else if (!/^[0-9+\-() ]{7,15}$/.test(values.phone.trim())) {
      e.phone = "Enter a valid phone number.";
    }
    return e;
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setServerMsg({ type: "", text: "" });
  };

  const handleBlur = (e) => {
    const { id } = e.target;
    setTouched((t) => ({ ...t, [id]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, phone: true });
    if (!isValid) return;

    try {
      setLoading(true);
      setServerMsg({ type: "", text: "" });
      const res = await api.post(`/auth/signup`, formData);
      if (res?.data?.success) {
        setServerMsg({
          type: "success",
          text: res?.data?.message || "Signup successful.",
        });
        navigate("/login");
      } else {
        setServerMsg({
          type: "error",
          text: res?.data?.message || "Something went wrong.",
        });
      }
    } catch (error) {
      const text =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to sign up right now.";
      setServerMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        bg-neutral-50 text-neutral-900
        h-[calc(100svh-4rem)]           /* viewport minus sticky header (h-16) */
        overflow-hidden                 /* ensure no page scroll on md+ */
        flex items-center justify-center px-4
      "
    >
      <div
        className="
          w-full max-w-5xl h-full md:h-[min(720px,calc(100svh-6rem))]  /* comfortable height cap */
          rounded-2xl border border-neutral-200 bg-white shadow-lg
          grid md:grid-cols-2 overflow-hidden
        "
      >
        {/* LEFT: Brand / messaging */}
        <aside className="hidden md:flex flex-col justify-center gap-6 p-10 bg-neutral-25">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Create your account
            </h1>
            <p className="text-neutral-600">
              Join TravelMint{" "}
              to
              plan trips smarter. Save preferences, compare packages, and pick
              up where you left off.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Feature title="Quick access" desc="Jump into today’s plans." />
            <Feature title="Secure auth" desc="Your data stays safe." />
            <Feature title="Smart search" desc="Find packages faster." />
            <Feature title="Lightweight UI" desc="Fast and responsive." />
          </div>
        </aside>

        {/* RIGHT: Form */}
        <form
          onSubmit={handleSubmit}
          className="
            h-full flex flex-col
            p-6 sm:p-8 gap-4
          "
          noValidate
          aria-labelledby="signup-side-title"
        >
          <div className="md:hidden">
            <h2 id="signup-side-title" className="text-xl font-semibold">
              Create your account
            </h2>
            <p className="text-sm text-neutral-600">
              Welcome! Please enter your details.
            </p>
          </div>

          {serverMsg.text ? (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                serverMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
              role="status"
              aria-live="polite"
            >
              {serverMsg.text}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4">
            <Field
              id="username"
              label="Username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.username && errors.username}
              placeholder="e.g., travelbuddy27"
              autoComplete="username"
            />

            <Field
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  aria-invalid={!!(touched.password && errors.password)}
                  aria-describedby={
                    touched.password && errors.password
                      ? "password-error"
                      : undefined
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                    touched.password && errors.password
                      ? "border-red-300 focus:ring-red-200"
                      : "border-neutral-300 focus:ring-neutral-300"
                  }`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* City (optional) → stored as address */}
            <Field
              id="address"
              label="City (optional)"
              type="text"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={false}
              placeholder="e.g., Mumbai"
              autoComplete="address-level2"
            />

            <Field
              id="phone"
              label="Phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && errors.phone}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div className="mt-auto space-y-3">
            <button
              type="submit"
              disabled={loading || !isValid}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                loading || !isValid
                  ? "bg-neutral-400 cursor-not-allowed"
                  : "bg-neutral-900 hover:opacity-90 focus-visible:ring-neutral-300"
              }`}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>

            <p className="text-center text-sm text-neutral-700">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold underline underline-offset-4 hover:opacity-90"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Reusable input */
function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
}) {
  const invalid = !!error;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
          invalid
            ? "border-red-300 focus:ring-red-200"
            : "border-neutral-300 focus:ring-neutral-300"
        }`}
      />
      {invalid && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-neutral-600">{desc}</p>
    </div>
  );
}

export default Signup;
