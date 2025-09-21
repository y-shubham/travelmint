import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Spinner from "../components/Spinner";

export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);
  const [status, setStatus] = useState("loading"); // loading | ok | deny | anon
  const location = useLocation();

  useEffect(() => {
    // If user isn't in Redux, treat as anonymous and send to login
    if (!currentUser) {
      setStatus("anon");
      return;
    }

    const authCheck = async () => {
      try {
        const res = await fetch("/api/user/user-auth", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          // 401/403 from server (not signed in or not verified)
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

  // redirect anonymous or denied users back to login
  if (status === "anon" || status === "deny") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // ok
  return <Outlet />;
}
