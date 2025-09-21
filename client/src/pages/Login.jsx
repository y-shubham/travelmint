import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../redux/user/userSlice.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const initialForm = { email: "", password: "" };

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.user);

  const [formData, setFormData] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  const errors = useMemo(() => validate(formData), [formData]);
  const isValid = Object.keys(errors).length === 0;

  function validate(values) {
    const e = {};
    if (!values.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = "Enter a valid email.";
    if (!values.password) e.password = "Password is required.";
    else if (values.password.length < 6)
      e.password = "Must be at least 6 characters.";
    return e;
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
    setServerMsg("");
  };

  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.id]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    try {
      dispatch(loginStart());
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 403) {
        // Blocked because email not verified
        dispatch(
          loginFailure(data?.message || "Please verify your email first.")
        );
        setServerMsg(
          data?.message ||
            "Please verify your email before logging in. Check your inbox for the verification link."
        );
        return;
      }

      if (!res.ok || !data?.success) {
        dispatch(loginFailure(data?.message || "Invalid credentials"));
        return;
      }

      // Success
      dispatch(loginSuccess(data?.user));
      setServerMsg("Welcome back!");

      // Go back to where user tried to go, or home
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      dispatch(loginFailure(err?.message || "Unable to login right now."));
    }
  };

  return (
    <div
      className="
        bg-neutral-50 text-neutral-900
        h-[calc(100svh-4rem)]
        overflow-hidden
        flex items-center justify-center px-4
      "
    >
      <div
        className="
          w-full max-w-5xl h-full md:h-[min(620px,calc(100svh-6rem))]
          rounded-2xl border border-neutral-200 bg-white shadow-lg
          grid md:grid-cols-2 overflow-hidden
        "
      >
        <aside className="hidden md:flex flex-col justify-center gap-6 p-10 bg-neutral-25">
          <span className="self-start inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-neutral-700">
            • Secure • Fast • Minimal
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back
            </h1>
            <p className="text-neutral-600">
              Pick up right where you left off. Your trips, preferences, and
              saved packages are synced.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Feature title="Quick access" desc="Jump into today’s plans." />
            <Feature title="Secure auth" desc="Your data stays safe." />
            <Feature title="Smart search" desc="Find packages faster." />
            <Feature title="Lightweight UI" desc="Fast and responsive." />
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="login-title"
          className="h-full flex flex-col p-6 sm:p-8 gap-4"
        >
          <div className="md:hidden">
            <h2 id="login-title" className="text-xl font-semibold">
              Welcome back
            </h2>
            <p className="text-sm text-neutral-600">
              Please enter your details.
            </p>
          </div>

          {serverMsg && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                serverMsg.toLowerCase().includes("verify")
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
              role="status"
              aria-live="polite"
            >
              {serverMsg}
            </div>
          )}

          {error && !serverMsg && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <Field
            id="email"
            label="Email address"
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
                autoComplete="current-password"
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
                placeholder="Enter your password"
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
              {loading ? "Signing in…" : "Login"}
            </button>

            <p className="text-center text-sm text-neutral-700">
              <Link
                to="/forgot-password"
                className="font-semibold underline underline-offset-4 hover:opacity-90"
              >
                Forgot password?
              </Link>
            </p>

            <p className="text-center text-sm text-neutral-700">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold underline underline-offset-4 hover:opacity-90"
              >
                Register
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

export default Login;
