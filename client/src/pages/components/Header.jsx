import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBars, FaTimes } from "react-icons/fa";
import defaultProfileImg from "../../assets/images/profile.png";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Packages", to: "/search" },
  { label: "About", to: "/about" },
];

const Header = () => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);

  // Elevate header on scroll
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const profileHref = currentUser
    ? `/profile/${currentUser.user_role === 1 ? "admin" : "user"}`
    : "/login";

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        elevated ? "shadow-sm" : ""
      }`}
    >
      <div className="bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex flex-col leading-none">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                TravelMint <span className="sr-only">Travel</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive(item.to)
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                aria-current={isActive(item.to) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Profile / Login */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <Link
                to={profileHref}
                className="flex items-center gap-2 rounded-full hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                title={currentUser.username || "Profile"}
              >
                <img
                  src={currentUser.avatar || defaultProfileImg}
                  alt={currentUser.username || "Profile"}
                  className="w-9 h-9 rounded-full border border-neutral-300 object-cover"
                />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-neutral-900 text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden border-t bg-white/90 backdrop-blur">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`block w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive(item.to)
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}
                      aria-current={isActive(item.to) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  {currentUser ? (
                    <Link
                      to={profileHref}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 transition"
                    >
                      <img
                        src={currentUser.avatar || defaultProfileImg}
                        alt={currentUser.username || "Profile"}
                        className="w-8 h-8 rounded-full border border-neutral-300 object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900">
                          {currentUser.username || "Profile"}
                        </span>
                        <span className="text-xs text-neutral-500">
                          View profile
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full text-center px-3 py-2 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:opacity-90"
                    >
                      Login
                    </Link>
                  )}
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
