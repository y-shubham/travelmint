import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Spinner from "../components/Spinner";

export default function AdminRoute() {
  const { currentUser } = useSelector((state) => state.user);
  const [status, setStatus] = useState("loading"); // loading | ok | deny | anon
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setStatus("anon");
      return;
    }

    const authCheck = async () => {
      try {
        const res = await fetch("/api/user/admin-auth", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          // 401/403 if not signed in, not verified, or not admin
          setStatus("deny");
          return;
        }

        const data = await res.json();
        setStatus(data?.check ? "ok" : "deny");
      } catch {
        setStatus("deny");
      }
    };

    authCheck();
  }, [currentUser]);

  if (status === "loading") return <Spinner />;

  if (status === "anon" || status === "deny") {
    // Not logged in, not verified, or not admin → go to login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
