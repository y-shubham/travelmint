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
} from "../../redux/user/userSlice";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../../firebase";
import AllBookings from "./AllBookings";
import AdminUpdateProfile from "./AdminUpdateProfile";
import AddPackages from "./AddPackages";
import "./styles/DashboardStyle.css";
import AllPackages from "./AllPackages";
import AllUsers from "./AllUsers";
import Payments from "./Payments";
import RatingsReviews from "./RatingsReviews";
import History from "./History";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const { currentUser, loading } = useSelector((state) => state.user);

  const [profilePhoto, setProfilePhoto] = useState(undefined);
  const [photoPercentage, setPhotoPercentage] = useState(0);
  const [activePanelId, setActivePanelId] = useState(1);
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
      dispatch(updateUserStart());
      const storage = getStorage(app);
      const photoname = new Date().getTime() + photo.name.replace(/\s/g, "");
      const storageRef = ref(storage, `profile-photos/${photoname}`);
      const uploadTask = uploadBytesResumable(storageRef, photo);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.floor(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setPhotoPercentage(progress);
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadUrl) => {
            const res = await fetch(
              `/api/user/update-profile-photo/${currentUser._id}`,
              {
                method: "POST",
                headers: { "Content-Type": " application/json" },
                body: JSON.stringify({ avatar: downloadUrl }),
              }
            );
            const data = await res.json();
            if (data?.success) {
              alert(data?.message);
              setFormData((p) => ({ ...p, avatar: downloadUrl }));
              dispatch(updateUserSuccess(data?.user));
              setProfilePhoto(null);
            } else {
              dispatch(updateUserFailure(data?.message));
              alert(data?.message);
            }
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(logOutStart());
      const res = await fetch("/api/auth/logout");
      const data = await res.json();
      if (data?.success !== true) {
        dispatch(logOutFailure(data?.message));
        return;
      }
      dispatch(logOutSuccess());
      navigate("/login");
      alert(data?.message);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const CONFIRM = confirm(
      "Are you sure? The account will be permanently deleted!"
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
        alert("Something went wrong!");
        return;
      }
      dispatch(deleteUserAccountSuccess());
      alert(data?.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-neutral-50 text-neutral-900 w-full">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentUser ? (
          <div className="flex w-full gap-6 max-lg:flex-col">
            {/* Left column: profile card */}
            <div className="w-full lg:w-[38%]">
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
                {/* Avatar */}
                <div className="relative w-full flex flex-col items-center gap-3">
                  <img
                    src={
                      (profilePhoto && URL.createObjectURL(profilePhoto)) ||
                      formData.avatar
                    }
                    alt="Profile photo"
                    className="w-56 h-56 object-cover rounded-2xl border border-neutral-200 shadow-sm cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                  />
                  <input
                    type="file"
                    name="photo"
                    id="photo"
                    hidden
                    ref={fileRef}
                    accept="image/*"
                    onChange={(e) => setProfilePhoto(e.target.files[0])}
                  />
                  {profilePhoto && (
                    <button
                      onClick={() => handleProfilePhoto(profilePhoto)}
                      className="w-full rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
                    >
                      {loading
                        ? `Uploading… (${photoPercentage}%)`
                        : "Upload new photo"}
                    </button>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center rounded-xl border border-red-500 text-red-600 px-3 py-1.5 text-sm font-semibold hover:bg-red-500 hover:text-white"
                    >
                      Log out
                    </button>
                    <button
                      onClick={() => setActivePanelId(8)}
                      className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-3 py-1.5 text-sm font-semibold hover:opacity-90"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Details card */}
                  <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1">
                    <p className="text-xl font-semibold">
                      Hi {currentUser.username}!
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Email:</span>{" "}
                      {currentUser.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Phone:</span>{" "}
                      {currentUser.phone}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">City:</span>{" "}
                      {currentUser.address}
                    </p>
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    className="text-sm text-red-600 underline underline-offset-4"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>

            {/* Right column: tabs + content */}
            <div className="w-full lg:flex-1">
              <nav className="mb-3 w-full overflow-x-auto">
                <div className="inline-flex gap-2 rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm">
                  {[
                    [1, "Bookings"],
                    [2, "Add Packages"],
                    [3, "All Packages"],
                    [4, "Users"],
                    [5, "Payments"],
                    [6, "Ratings/Reviews"],
                    [7, "History"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setActivePanelId(id)}
                      className={`text-sm font-medium px-3 py-2 rounded-xl whitespace-nowrap ${
                        activePanelId === id
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {/* Edit Profile tab access (same id=8 as before) */}
                  <button
                    onClick={() => setActivePanelId(8)}
                    className={`text-sm font-medium px-3 py-2 rounded-xl whitespace-nowrap ${
                      activePanelId === 8
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    Update Profile
                  </button>
                </div>
              </nav>

              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-3 sm:p-4">
                {activePanelId === 1 ? (
                  <AllBookings />
                ) : activePanelId === 2 ? (
                  <AddPackages />
                ) : activePanelId === 3 ? (
                  <AllPackages />
                ) : activePanelId === 4 ? (
                  <AllUsers />
                ) : activePanelId === 5 ? (
                  <Payments />
                ) : activePanelId === 6 ? (
                  <RatingsReviews />
                ) : activePanelId === 7 ? (
                  <History />
                ) : activePanelId === 8 ? (
                  <AdminUpdateProfile />
                ) : (
                  <div className="p-6 text-center text-neutral-600">
                    Page Not Found!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 text-center">
            <p className="text-red-700 font-medium">Login First</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
