import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

export default function ResetPassword() {
  const [search] = useSearchParams();
  const token = search.get("token");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (pw1 !== pw2) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        newPassword: pw1,
      });
      setStatus({ type: "success", msg: data?.message || "Password updated." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err?.response?.data?.message || "Invalid or expired link.",
      });
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold text-red-600">Invalid link</h1>
        <p className="mt-2">Missing reset token.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 rounded-xl shadow">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          placeholder="New password"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
        />
        <button className="w-full bg-blue-600 text-white rounded-lg py-2">
          Update password
        </button>
      </form>
      {status.msg && (
        <p
          className={`mt-4 ${
            status.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
