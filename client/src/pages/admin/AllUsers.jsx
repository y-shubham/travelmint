import React, { useEffect, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";

// --- Small UI helpers ------------------------------------------------
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {message}
    </div>
  );
}

function EmptyState({ children = "No users found." }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-neutral-500">
      {children}
    </div>
  );
}

function ListSkeleton({ count = 8 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4"
        >
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-center">
            <div className="h-4 bg-neutral-200 rounded col-span-2 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded col-span-1 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded col-span-1 animate-pulse" />
            <div className="h-4 bg-neutral-200 rounded col-span-1 animate-pulse" />
            <div className="h-8 w-10 bg-neutral-200 rounded justify-self-end animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main component ---------------------------------------------------
const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalUsers = useMemo(() => users?.length || 0, [users]);

  const getUsers = () => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `/api/user/getAllUsers?searchTerm=${encodeURIComponent(q)}`,
          { signal }
        );
        const data = await res.json();
        if (data && data?.success === false) {
          setError(data?.message || "Something went wrong!");
          setUsers([]);
        } else {
          // API returns array directly in your current code
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (e.name !== "AbortError") setError("Unable to load users.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = getUsers();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleUserDelete = async (userId) => {
    const CONFIRM = confirm(
      "Are you sure? The account will be permanently deleted!"
    );
    if (!CONFIRM) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/user/delete-user/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.success === false) {
        alert(data?.message || "Something went wrong!");
        return;
      }
      alert(data?.message || "User deleted.");
      getUsers(); // refresh
    } catch (e) {
      alert("Delete failed.");
    } finally {
      setLoading(false);
    }
  };

  const hasData = users && users.length > 0;

  return (
    <div className="w-full">
      <div className="w-[95%] mx-auto max-w-5xl space-y-4">
        {/* Header / Controls */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">All Users</h2>
              <p className="text-sm text-neutral-600">
                Total Users: {loading ? "…" : totalUsers}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-72 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                placeholder="Search name, email or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* List */}
        {loading ? (
          <ListSkeleton />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {/* Header row (visible on md+) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-4">
              <span className="col-span-2 text-xs font-semibold text-neutral-600">
                User ID
              </span>
              <span className="col-span-2 text-xs font-semibold text-neutral-600">
                Name
              </span>
              <span className="col-span-3 text-xs font-semibold text-neutral-600">
                Email
              </span>
              <span className="col-span-2 text-xs font-semibold text-neutral-600">
                City
              </span>
              <span className="col-span-1 text-xs font-semibold text-neutral-600">
                Phone
              </span>
              <span className="col-span-2 text-right text-xs font-semibold text-neutral-600">
                Actions
              </span>
            </div>

            {users.map((user) => (
              <div
                key={user._id}
                className="rounded-xl border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 py-3 sm:py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* ID */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      User ID
                    </div>
                    <div className="truncate text-sm font-medium">
                      {user._id}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      Name
                    </div>
                    <div className="truncate text-sm">{user.username}</div>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-3 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      Email
                    </div>
                    <div className="truncate text-sm">{user.email}</div>
                  </div>

                  {/* City */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      City
                    </div>
                    <div className="truncate text-sm">{user.address}</div>
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-1 min-w-0">
                    <div className="md:hidden text-xs text-neutral-500">
                      Phone
                    </div>
                    <div className="truncate whitespace-nowrap text-sm">
                      {user.phone}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex md:justify-end">
                    <button
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 w-full md:w-auto"
                      onClick={() => handleUserDelete(user._id)}
                      title="Delete user"
                    >
                      <FaTrash className="text-[10px]" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
