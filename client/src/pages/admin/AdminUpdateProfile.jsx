import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  updatePassStart,
  updatePassSuccess,
  updatePassFailure,
} from "../../redux/user/userSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// ---------- Small helpers (same as user UI) ----------
function Banner({ type = "info", message = "" }) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-neutral-200 bg-neutral-50 text-neutral-700";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}

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
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
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
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
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

// ---------- Main component ----------
const AdminUpdateProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  const [tab, setTab] = useState("profile"); // "profile" | "password"

  // Profile form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    address: "",
    phone: "",
    avatar: "",
  });
  const [touched, setTouched] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  // Password form
  const [pwd, setPwd] = useState({ oldpassword: "", newpassword: "" });
  const [pwdTouched, setPwdTouched] = useState({});
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || "",
        email: currentUser.email || "",
        address: currentUser.address || "",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || "",
      });
    }
  }, [currentUser]);

  // ---- validators (same rules as user form) ----
  const profileErrors = useMemo(() => {
    const e = {};
    if (!formData.username.trim()) e.username = "Username is required.";
    if (!formData.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Enter a valid email.";
    }
    if (formData.phone && !/^[0-9+\-() ]{7,15}$/.test(formData.phone.trim())) {
      e.phone = "Enter a valid phone number.";
    }
    // City (address) is optional
    return e;
  }, [formData]);

  const pwdErrors = useMemo(() => {
    const e = {};
    if (!pwd.oldpassword) e.oldpassword = "Enter your current password.";
    if (!pwd.newpassword) e.newpassword = "Enter a new password.";
    else if (pwd.newpassword.length < 6)
      e.newpassword = "New password must be at least 6 characters.";
    if (
      pwd.oldpassword &&
      pwd.newpassword &&
      pwd.oldpassword === pwd.newpassword
    ) {
      e.newpassword = "New password must be different from old password.";
    }
    return e;
  }, [pwd]);

  const isProfileValid = Object.keys(profileErrors).length === 0;
  const isPwdValid = Object.keys(pwdErrors).length === 0;

  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.id]: true }));
  const onPwdBlur = (e) =>
    setPwdTouched((t) => ({ ...t, [e.target.id]: true }));

  // ---- submit handlers ----
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, phone: true, address: true });
    setMsg({ type: "", text: "" });
    if (!isProfileValid) return;

    // Prevent no-op
    if (
      currentUser &&
      currentUser.username === formData.username &&
      currentUser.email === formData.email &&
      (currentUser.address || "") === (formData.address || "") &&
      (currentUser.phone || "") === (formData.phone || "")
    ) {
      setMsg({ type: "info", text: "No changes detected." });
      return;
    }

    try {
      setLoading(true);
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();

      if (data.success && (res.status === 201 || res.status === 200)) {
        dispatch(updateUserSuccess(data?.user));
        setMsg({ type: "success", text: data?.message || "Profile updated." });
      } else if (
        data.success === false &&
        res.status !== 201 &&
        res.status !== 200
      ) {
        dispatch(updateUserSuccess()); // keeps store consistent
        dispatch(updateUserFailure(data?.message));
        alert("Session ended! Please log in again.");
        navigate("/login");
      } else {
        dispatch(updateUserFailure(data?.message));
        setMsg({ type: "error", text: data?.message || "Update failed." });
      }
    } catch (err) {
      dispatch(updateUserFailure(err?.message));
      setMsg({
        type: "error",
        text: err?.message || "Unable to update right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdTouched({ oldpassword: true, newpassword: true });
    setPwdMsg({ type: "", text: "" });
    if (!isPwdValid) return;

    try {
      setPwdLoading(true);
      dispatch(updatePassStart());
      const res = await fetch(`/api/user/update-password/${currentUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwd),
        credentials: "include",
      });
      const data = await res.json();

      if (data.success === false && res.status !== 201 && res.status !== 200) {
        dispatch(updateUserSuccess());
        dispatch(updatePassFailure(data?.message));
        alert("Session ended! Please log in again.");
        navigate("/login");
        return;
      }

      dispatch(updatePassSuccess());
      setPwdMsg({
        type: "success",
        text: data?.message || "Password updated.",
      });
      setPwd({ oldpassword: "", newpassword: "" });
      setPwdTouched({});
    } catch (err) {
      dispatch(updatePassFailure(err?.message));
      setPwdMsg({
        type: "error",
        text: err?.message || "Unable to update password.",
      });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center px-2">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6">
        {/* Tabs (same as user) */}
        <div className="inline-flex rounded-xl border border-neutral-200 p-1 bg-neutral-50 mb-5">
          <button
            onClick={() => setTab("profile")}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg ${
              tab === "profile"
                ? "bg-white shadow border border-neutral-200"
                : "text-neutral-700"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setTab("password")}
            className={`ml-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg ${
              tab === "password"
                ? "bg-white shadow border border-neutral-200"
                : "text-neutral-700"
            }`}
          >
            Password
          </button>
        </div>

        {tab === "profile" ? (
          <form className="space-y-4" onSubmit={handleProfileSubmit} noValidate>
            <h2 className="text-lg font-semibold">Update Profile</h2>

            <Banner type={msg.type} message={msg.text} />

            <Field
              id="username"
              label="Username"
              value={formData.username}
              onChange={(e) => {
                setFormData((p) => ({ ...p, username: e.target.value }));
                setMsg({ type: "", text: "" });
              }}
              onBlur={onBlur}
              error={touched.username && profileErrors.username}
              placeholder="Your display name"
              autoComplete="username"
            />

            <Field
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData((p) => ({ ...p, email: e.target.value }));
                setMsg({ type: "", text: "" });
              }}
              onBlur={onBlur}
              error={touched.email && profileErrors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {/* City (optional) but stored in 'address' for API compatibility */}
            <div className="space-y-1">
              <label
                htmlFor="address"
                className="text-sm font-medium text-neutral-800"
              >
                City (optional)
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, address: e.target.value }));
                  setMsg({ type: "", text: "" });
                }}
                onBlur={onBlur}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="e.g., Mumbai"
                autoComplete="address-level2"
              />
            </div>

            <Field
              id="phone"
              label="Phone (optional)"
              value={formData.phone}
              onChange={(e) => {
                setFormData((p) => ({ ...p, phone: e.target.value }));
                setMsg({ type: "", text: "" });
              }}
              onBlur={onBlur}
              error={touched.phone && profileErrors.phone}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isProfileValid}
                className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  loading || !isProfileValid
                    ? "bg-neutral-400 cursor-not-allowed"
                    : "bg-neutral-900 hover:opacity-90 focus-visible:ring-neutral-300"
                }`}
              >
                {loading ? "Updating…" : "Update"}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <h2 className="text-lg font-semibold">Change Password</h2>

            <Banner type={pwdMsg.type} message={pwdMsg.text} />

            {/* Old password */}
            <div className="space-y-1">
              <label
                htmlFor="oldpassword"
                className="text-sm font-medium text-neutral-800"
              >
                Current password
              </label>
              <div className="relative">
                <input
                  id="oldpassword"
                  type={showOld ? "text" : "password"}
                  value={pwd.oldpassword}
                  onChange={(e) => {
                    setPwd((p) => ({ ...p, oldpassword: e.target.value }));
                    setPwdMsg({ type: "", text: "" });
                  }}
                  onBlur={onPwdBlur}
                  aria-invalid={
                    !!(pwdTouched.oldpassword && pwdErrors.oldpassword)
                  }
                  aria-describedby={
                    pwdTouched.oldpassword && pwdErrors.oldpassword
                      ? "oldpassword-error"
                      : undefined
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                    pwdTouched.oldpassword && pwdErrors.oldpassword
                      ? "border-red-300 focus:ring-red-200"
                      : "border-neutral-300 focus:ring-neutral-300"
                  }`}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  aria-label={showOld ? "Hide password" : "Show password"}
                >
                  {showOld ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {pwdTouched.oldpassword && pwdErrors.oldpassword && (
                <p id="oldpassword-error" className="text-xs text-red-600">
                  {pwdErrors.oldpassword}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1">
              <label
                htmlFor="newpassword"
                className="text-sm font-medium text-neutral-800"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="newpassword"
                  type={showNew ? "text" : "password"}
                  value={pwd.newpassword}
                  onChange={(e) => {
                    setPwd((p) => ({ ...p, newpassword: e.target.value }));
                    setPwdMsg({ type: "", text: "" });
                  }}
                  onBlur={onPwdBlur}
                  aria-invalid={
                    !!(pwdTouched.newpassword && pwdErrors.newpassword)
                  }
                  aria-describedby={
                    pwdTouched.newpassword && pwdErrors.newpassword
                      ? "newpassword-error"
                      : undefined
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                    pwdTouched.newpassword && pwdErrors.newpassword
                      ? "border-red-300 focus:ring-red-200"
                      : "border-neutral-300 focus:ring-neutral-300"
                  }`}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {pwdTouched.newpassword && pwdErrors.newpassword && (
                <p id="newpassword-error" className="text-xs text-red-600">
                  {pwdErrors.newpassword}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={pwdLoading || !isPwdValid}
                className={`flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  pwdLoading || !isPwdValid
                    ? "bg-neutral-400 cursor-not-allowed"
                    : "bg-neutral-900 hover:opacity-90 focus-visible:ring-neutral-300"
                }`}
              >
                {pwdLoading ? "Updating…" : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("profile");
                  setPwd({ oldpassword: "", newpassword: "" });
                  setPwdTouched({});
                  setPwdMsg({ type: "", text: "" });
                }}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminUpdateProfile;
