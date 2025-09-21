import React, { useState } from "react";
import { app } from "../../firebase";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const MAX_IMAGES = 5;

const AddPackages = () => {
  const [formData, setFormData] = useState({
    packageName: "",
    packageDescription: "",
    packageDestination: "",
    packageDays: 1,
    packageNights: 1,
    packageAccommodation: "",
    packageTransportation: "",
    packageMeals: "",
    packageActivities: "",
    packagePrice: 500,
    packageDiscountPrice: 0,
    packageOffer: false,
    packageImages: [],
  });

  const [images, setImages] = useState([]);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUploadPercent, setImageUploadPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;

    // number inputs: coerce to number, else keep as text
    const nextValue =
      type === "checkbox" ? checked : type === "number" ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [id]: nextValue,
      // if offer unchecked, ensure discount price is zeroed in UI immediately
      ...(id === "packageOffer" && !checked ? { packageDiscountPrice: 0 } : {}),
    }));
  };

  const handleImageSubmit = () => {
    const already = formData.packageImages.length;
    const chosen = images?.length ?? 0;

    if (!chosen) {
      setImageUploadError("Please choose 1–5 images to upload.");
      return;
    }

    if (already + chosen > MAX_IMAGES) {
      setImageUploadError(`You can only upload up to ${MAX_IMAGES} images.`);
      return;
    }

    setUploading(true);
    setImageUploadError("");

    const promises = [];
    for (let i = 0; i < chosen; i++) promises.push(storeImage(images[i]));

    Promise.all(promises)
      .then((urls) => {
        setFormData((prev) => ({
          ...prev,
          packageImages: prev.packageImages.concat(urls),
        }));
      })
      .catch(() =>
        setImageUploadError("Image upload failed (max ~2MB per image).")
      )
      .finally(() => {
        setUploading(false);
        setImages([]);
        setImageUploadPercent(0);
      });
  };

  const storeImage = async (file) =>
    new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name.replace(/\s/g, "");
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageUploadPercent(Math.floor(progress));
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
            resolve(downloadURL)
          );
        }
      );
    });

  const handleDeleteImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      packageImages: prev.packageImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation (clear, friendly)
    if (formData.packageImages.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    const requiredText = [
      "packageName",
      "packageDescription",
      "packageDestination",
      "packageAccommodation",
      "packageMeals",
      "packageActivities",
    ];
    for (const key of requiredText) {
      if (!String(formData[key]).trim()) {
        setError("All fields are required.");
        return;
      }
    }
    if (!formData.packageTransportation) {
      setError("Please select a Transportation mode.");
      return;
    }
    if (Number(formData.packagePrice) < 500) {
      setError("Price should be at least ₹500.");
      return;
    }
    if (
      formData.packageOffer &&
      Number(formData.packageDiscountPrice) >= Number(formData.packagePrice)
    ) {
      setError("Discount Price must be less than Regular Price.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/package/create-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data?.success === false) {
        setError(data?.message || "Failed to create package.");
        setLoading(false);
        return;
      }

      alert(data?.message || "Package added.");
      // Reset form
      setFormData({
        packageName: "",
        packageDescription: "",
        packageDestination: "",
        packageDays: 1,
        packageNights: 1,
        packageAccommodation: "",
        packageTransportation: "",
        packageMeals: "",
        packageActivities: "",
        packagePrice: 500,
        packageDiscountPrice: 0,
        packageOffer: false,
        packageImages: [],
      });
      setImages([]);
    } catch (err) {
      console.log(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="w-full flex justify-center px-3 py-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 sm:p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold">Add Package</h1>

        {/* Name */}
        <div>
          <label htmlFor="packageName" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="packageName"
            type="text"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageName}
            onChange={handleChange}
            placeholder="e.g., Exploring the Fjords of Norway"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="packageDescription"
            className="block text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="packageDescription"
            rows={4}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageDescription}
            onChange={handleChange}
            placeholder="Short overview of the package…"
          />
        </div>

        {/* Destination */}
        <div>
          <label
            htmlFor="packageDestination"
            className="block text-sm font-medium"
          >
            Destination
          </label>
          <input
            id="packageDestination"
            type="text"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageDestination}
            onChange={handleChange}
            placeholder="e.g., Norway"
          />
        </div>

        {/* Days & Nights */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="packageDays" className="block text-sm font-medium">
              Days
            </label>
            <input
              id="packageDays"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageDays}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              htmlFor="packageNights"
              className="block text-sm font-medium"
            >
              Nights
            </label>
            <input
              id="packageNights"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageNights}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Accommodation */}
        <div>
          <label
            htmlFor="packageAccommodation"
            className="block text-sm font-medium"
          >
            Accommodation
          </label>
          <textarea
            id="packageAccommodation"
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageAccommodation}
            onChange={handleChange}
            placeholder="Hotel with Fjord View, etc."
          />
        </div>

        {/* Transportation */}
        <div>
          <label
            htmlFor="packageTransportation"
            className="block text-sm font-medium"
          >
            Transportation
          </label>
          <select
            id="packageTransportation"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageTransportation}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option>Flight</option>
            <option>Train</option>
            <option>Boat</option>
            <option>Other</option>
          </select>
        </div>

        {/* Meals */}
        <div>
          <label htmlFor="packageMeals" className="block text-sm font-medium">
            Meals
          </label>
          <textarea
            id="packageMeals"
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageMeals}
            onChange={handleChange}
            placeholder="Breakfast Included, etc."
          />
        </div>

        {/* Activities */}
        <div>
          <label
            htmlFor="packageActivities"
            className="block text-sm font-medium"
          >
            Activities
          </label>
          <textarea
            id="packageActivities"
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageActivities}
            onChange={handleChange}
            placeholder="Hiking, Sightseeing, etc."
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="packagePrice" className="block text-sm font-medium">
              Price (₹)
            </label>
            <input
              id="packagePrice"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packagePrice}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-end gap-2">
            <label
              htmlFor="packageOffer"
              className="text-sm font-medium select-none"
            >
              Offer
            </label>
            <input
              id="packageOffer"
              type="checkbox"
              className="h-5 w-5 rounded border-neutral-400"
              checked={formData.packageOffer}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Discount price (conditional) */}
        {formData.packageOffer && (
          <div>
            <label
              htmlFor="packageDiscountPrice"
              className="block text-sm font-medium"
            >
              Discount Price (₹)
            </label>
            <input
              id="packageDiscountPrice"
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageDiscountPrice}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Images */}
        <div>
          <label htmlFor="packageImages" className="block text-sm font-medium">
            Images{" "}
            <span className="text-neutral-500">
              (up to {MAX_IMAGES}, ~2MB each)
            </span>
          </label>
          <input
            id="packageImages"
            type="file"
            multiple
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm bg-white"
            onChange={(e) => setImages(e.target.files)}
          />
          {(imageUploadError || error) && (
            <p className="mt-2 text-sm text-red-600">
              {imageUploadError || error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {formData.packageImages.map((url, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200"
              >
                <img
                  src={url}
                  alt={`upload-${i}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(i)}
                  className="absolute top-1 right-1 rounded bg-neutral-900/80 text-white text-[10px] px-1.5 py-0.5"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {images.length > 0 && (
          <button
            type="button"
            onClick={handleImageSubmit}
            disabled={uploading || loading}
            className="w-full rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {uploading
              ? `Uploading… (${imageUploadPercent}%)`
              : `Upload ${images.length} image${images.length > 1 ? "s" : ""}`}
          </button>
        )}

        <button
          disabled={uploading || loading}
          className="w-full rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : loading ? "Saving…" : "Add Package"}
        </button>
      </form>
    </div>
  );
};

export default AddPackages;
