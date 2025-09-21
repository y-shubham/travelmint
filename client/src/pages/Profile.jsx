import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  logOutStart,
  logOutSuccess,
  logOutFailure,
  deleteUserAccountStart,
  deleteUserAccountSuccess,
  deleteUserAccountFailure,
} from "../redux/user/userSlice";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import MyBookings from "./user/MyBookings";
import UpdateProfile from "./user/UpdateProfile";
import MyHistory from "./user/MyHistory";

const TABS = [
  { id: 1, key: "bookings", label: "Bookings" },
  { id: 2, key: "history", label: "History" },
  { id: 3, key: "edit", label: "Edit Profile" },
];

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
let _activeUpload = null; 

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);

  const [profilePhoto, setProfilePhoto] = useState(undefined);
  const [photoPercentage, setPhotoPercentage] = useState(0);
  const [activePanelId, setActivePanelId] = useState(1);
  const [serverMsg, setServerMsg] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    address: "",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    if (currentUser !== null) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        address: currentUser.address,
        phone: currentUser.phone,
        avatar: currentUser.avatar,
      });
    }
  }, [currentUser]);

 const handleProfilePhoto = (photo) => {
   try {
     if (!photo) {
       setServerMsg("Please choose an image file.");
       return;
     }
     if (_activeUpload) {
       setServerMsg("An upload is already in progress.");
       return;
     }
     if (!ALLOWED.includes(photo.type)) {
       setServerMsg("Only JPG, PNG or WEBP images are allowed.");
       return;
     }
     if (photo.size > MAX_MB * 1024 * 1024) {
       setServerMsg(`Image must be ≤ ${MAX_MB} MB.`);
       return;
     }

     setServerMsg("");
     setPhotoPercentage(0);
     dispatch(updateUserStart());

     const storage = getStorage(app);
     // unique, whitespace-free, safe name
     const safeName = photo.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
     const photoname = `${Date.now()}-${safeName}`;
     const storageRef = ref(storage, `profile-photos/${photoname}`);

     // include contentType metadata (useful for rules & serving)
     const metadata = { contentType: photo.type };

     const uploadTask = uploadBytesResumable(storageRef, photo, metadata);
     _activeUpload = uploadTask; // mark busy

     uploadTask.on(
       "state_changed",
       (snap) => {
         const progress = Math.floor(
           (snap.bytesTransferred / snap.totalBytes) * 100
         );
         setPhotoPercentage(progress);
       },
       (err) => {
         _activeUpload = null;
         dispatch(updateUserFailure(err?.message || "Upload failed"));
         setServerMsg("Upload failed. Please try again.");
       },
       async () => {
         try {
           const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

           // Save URL to backend
           const res = await fetch(
             `/api/user/update-profile-photo/${currentUser._id}`,
             {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ avatar: downloadUrl }),
               credentials: "include",
             }
           );
           const data = await res.json();

           if (data?.success) {
             dispatch(updateUserSuccess(data.user));
             setFormData((f) => ({ ...f, avatar: downloadUrl }));
             setProfilePhoto(undefined);
             setPhotoPercentage(0);
             setServerMsg("Profile photo updated.");
           } else {
             dispatch(updateUserFailure(data?.message || "Update failed."));
             setServerMsg(data?.message || "Update failed.");
           }
         } catch (e) {
           dispatch(updateUserFailure(e?.message || "Update failed."));
           setServerMsg("Update failed.");
         } finally {
           _activeUpload = null;
         }
       }
     );
   } catch (error) {
     _activeUpload = null;
     dispatch(updateUserFailure(error?.message || "Unexpected error"));
     setServerMsg("Unexpected error. Please try again.");
   }
 };

  const handleLogout = async () => {
    try {
      dispatch(logOutStart());
      const res = await fetch("/api/auth/logout");
      const data = await res.json();
      if (data?.success !== true) {
        dispatch(logOutFailure(data?.message));
        setServerMsg(data?.message || "Could not log out.");
        return;
      }
      dispatch(logOutSuccess());
      navigate("/login");
    } catch (error) {
      dispatch(logOutFailure(error?.message));
      setServerMsg("Could not log out right now.");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const CONFIRM = confirm(
      "Are you sure? The account will be permanently deleted."
    );
    if (!CONFIRM) return;

    try {
      dispatch(deleteUserAccountStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.success === false) {
        dispatch(deleteUserAccountFailure(data?.message));
        setServerMsg(data?.message || "Something went wrong.");
        return;
      }
      dispatch(deleteUserAccountSuccess());
      setServerMsg("Account deleted.");
      navigate("/signup");
    } catch (error) {
      dispatch(deleteUserAccountFailure(error?.message));
      setServerMsg("Unable to delete account right now.");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100svh-4rem)] bg-neutral-50 text-neutral-900 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-lg p-6 text-center space-y-3">
          <p className="text-sm text-neutral-700">
            You need to be logged in to view your profile.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 text-neutral-900">
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Message banner */}
        {serverMsg && (
          <div className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">
            {serverMsg}
          </div>
        )}

        <div className="grid lg:grid-cols-[360px,1fr] gap-6">
          {/* LEFT: Profile card */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={
                    (profilePhoto && URL.createObjectURL(profilePhoto)) ||
                    formData.avatar
                  }
                  alt={`${formData.username}'s avatar`}
                  className="h-40 w-40 rounded-xl object-cover border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="
                    absolute bottom-2 left-1/2 -translate-x-1/2
                    inline-flex items-center gap-2
                    rounded-full border border-neutral-300 bg-white/95 px-3 py-1.5
                    text-xs font-semibold text-neutral-900 shadow hover:bg-white
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300
                  "
                >
                  Change photo
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setProfilePhoto(e.target.files?.[0])}
              />

              {profilePhoto && (
                <div className="w-full pt-3 space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded bg-neutral-200">
                    <div
                      className="h-full bg-neutral-900 transition-all"
                      style={{ width: `${photoPercentage}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProfilePhoto(profilePhoto)}
                      className="flex-1 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:bg-neutral-400"
                      disabled={loading}
                    >
                      {loading ? `Uploading… (${photoPercentage}%)` : "Upload"}
                    </button>
                    <button
                      onClick={() => {
                        setProfilePhoto(undefined);
                        setPhotoPercentage(0);
                      }}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1">
              <p className="text-xl font-semibold">
                Hi {currentUser.username}!
              </p>
              <p className="text-sm text-neutral-600">
                Manage your bookings and account details.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <Row label="Email" value={currentUser.email} />
              <Row label="Phone" value={currentUser.phone || "—"} />
              <Row label="City" value={currentUser.address || "—"} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActivePanelId(3)}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Log out
              </button>
            </div>

            <button
              onClick={handleDeleteAccount}
              className="text-sm text-red-700 underline underline-offset-4 hover:opacity-80"
            >
              Delete account
            </button>
          </section>

          {/* RIGHT: Tabs + Panels */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {/* Tabs */}
            <nav className="flex flex-wrap gap-2 border-b border-neutral-200 p-3">
              {TABS.map((t) => {
                const active = activePanelId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActivePanelId(t.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-300 bg-white hover:bg-neutral-100"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {/* Panels */}
            <div className="p-4 sm:p-6">
              {activePanelId === 1 && <MyBookings />}
              {activePanelId === 2 && <MyHistory />}
              {activePanelId === 3 && <UpdateProfile />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium break-words text-right max-w-[70%]">
        {value}
      </span>
    </div>
  );
}

export default Profile;
