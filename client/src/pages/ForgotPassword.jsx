import { useState } from "react";
import api from "../utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ type: "info", msg: "Sending reset link..." });
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setStatus({
        type: "success",
        msg: data?.message || "If that email exists, you'll receive a link.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err?.response?.data?.message || "Could not send reset link.",
      });
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 rounded-xl shadow">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="text-gray-600 mt-1">
        Enter your account email. We’ll email you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="w-full bg-blue-600 text-white rounded-lg py-2">
          Send reset link
        </button>
      </form>

      {status.msg && (
        <p
          className={`mt-4 ${
            status.type === "error"
              ? "text-red-600"
              : status.type === "success"
              ? "text-green-600"
              : "text-gray-700"
          }`}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
