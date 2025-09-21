import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

export default function VerifyEmail() {
  const [search] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = search.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        setStatus("success");
        setMessage(data?.message || "Email verified. You can log in now.");
        // optional: redirect after a moment
        const t = setTimeout(() => navigate("/login"), 1800);
        return () => clearTimeout(t);
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.response?.data?.message ||
            "Invalid or expired verification link."
        );
      }
    })();
  }, [search, navigate]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 rounded-xl shadow">
      {status === "loading" && <p>Verifying your email…</p>}
      {status !== "loading" && (
        <>
          <h1
            className={`text-2xl font-semibold ${
              status === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status === "success" ? "Email Verified" : "Verification Failed"}
          </h1>
          <p className="mt-2 text-gray-700">{message}</p>
          <button
            onClick={() =>
              navigate(status === "success" ? "/login" : "/signup")
            }
            className="mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            {status === "success" ? "Go to Login" : "Back to Signup"}
          </button>
        </>
      )}
    </div>
  );
}
