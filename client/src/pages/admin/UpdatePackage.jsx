import React, { useEffect, useState, useMemo } from "react";
import { app } from "../../firebase";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { useNavigate, useParams } from "react-router";

const MAX_IMAGES = 5;

function Field({ id, label, children, hint }) {
  return (
    <div className="space-y-1 w-full">
      <label htmlFor={id} className="text-sm font-medium text-neutral-800">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function Banner({ type = "info", message = "" }) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-neutral-200 bg-neutral-50 text-neutral-700";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}

const UpdatePackage = () => {
  const params = useParams();
  const navigate = useNavigate();

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
  const [msg, setMsg] = useState({ type: "", text: "" });

  const getPackageData = async () => {
    try {
      const res = await fetch(`/api/package/get-package-data/${params?.id}`);
      const data = await res.json();
      if (data?.success) {
        setFormData({
          packageName: data?.packageData?.packageName ?? "",
          packageDescription: data?.packageData?.packageDescription ?? "",
          packageDestination: data?.packageData?.packageDestination ?? "",
          packageDays: data?.packageData?.packageDays ?? 1,
          packageNights: data?.packageData?.packageNights ?? 1,
          packageAccommodation: data?.packageData?.packageAccommodation ?? "",
          packageTransportation: data?.packageData?.packageTransportation ?? "",
          packageMeals: data?.packageData?.packageMeals ?? "",
          packageActivities: data?.packageData?.packageActivities ?? "",
          packagePrice: data?.packageData?.packagePrice ?? 500,
          packageDiscountPrice: data?.packageData?.packageDiscountPrice ?? 0,
          packageOffer: !!data?.packageData?.packageOffer,
          packageImages: Array.isArray(data?.packageData?.packageImages)
            ? data.packageData.packageImages
            : [],
        });
      } else {
        alert(data?.message || "Something went wrong!");
      }
    } catch (error) {
      console.log(error);
      alert("Unable to load package.");
    }
  };

  useEffect(() => {
    if (params.id) getPackageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;
    setMsg({ type: "", text: "" });
    if (type === "checkbox") {
      setFormData((p) => ({ ...p, [id]: checked }));
    } else {
      setFormData((p) => ({ ...p, [id]: value }));
    }
  };

  const storeImage = (file) =>
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
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => resolve(downloadURL))
            .catch(reject);
        }
      );
    });

  const handleImageSubmit = async () => {
    const remainingSlots =
      MAX_IMAGES -
      (Array.isArray(formData.packageImages)
        ? formData.packageImages.length
        : 0);
    if (!images?.length) {
      setImageUploadError("Please choose images first.");
      return;
    }
    if (images.length > remainingSlots) {
      setImageUploadError(
        `You can upload up to ${MAX_IMAGES} images. Available slots: ${remainingSlots}.`
      );
      return;
    }

    try {
      setUploading(true);
      setImageUploadError("");
      const urls = await Promise.all(Array.from(images).map(storeImage));
      setFormData((p) => ({
        ...p,
        packageImages: [...p.packageImages, ...urls],
      }));
      setImages([]);
    } catch (err) {
      console.log(err);
      setImageUploadError("Image upload failed (2MB max per image).");
    } finally {
      setUploading(false);
      setImageUploadPercent(0);
    }
  };

  const handleDeleteImage = (index) => {
    setFormData((p) => ({
      ...p,
      packageImages: p.packageImages.filter((_, i) => i !== index),
    }));
  };

  const validationError = useMemo(() => {
    if (!formData.packageName.trim()) return "Name is required.";
    if (!formData.packageDescription.trim()) return "Description is required.";
    if (!formData.packageDestination.trim()) return "Destination is required.";
    if (!formData.packageAccommodation.trim())
      return "Accommodation is required.";
    if (!formData.packageTransportation.trim())
      return "Transportation is required.";
    if (!formData.packageMeals.trim()) return "Meals are required.";
    if (!formData.packageActivities.trim()) return "Activities are required.";
    if (
      !Array.isArray(formData.packageImages) ||
      formData.packageImages.length === 0
    )
      return "You must upload at least 1 image.";
    if (Number(formData.packagePrice) < 500)
      return "Price should be at least 500.";
    if (
      formData.packageOffer &&
      Number(formData.packageDiscountPrice) >= Number(formData.packagePrice)
    )
      return "Regular price must be greater than discount price.";
    return "";
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (validationError) {
      setMsg({ type: "error", text: validationError });
      return;
    }

    try {
      setLoading(true);

      // Build payload explicitly (avoid async setState pitfalls)
      const payload = {
        ...formData,
        packageDiscountPrice: formData.packageOffer
          ? Number(formData.packageDiscountPrice || 0)
          : 0,
      };

      const res = await fetch(`/api/package/update-package/${params?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();

      if (data?.success === false) {
        setMsg({ type: "error", text: data?.message || "Update failed." });
      } else {
        setMsg({ type: "success", text: data?.message || "Package updated." });
        alert(data?.message || "Package updated.");
        navigate(`/package/${params?.id}`);
      }
    } catch (err) {
      console.log(err);
      setMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-3 sm:px-4 py-6 justify-center">
      {/* Left: form */}
      <form
        onSubmit={handleSubmit}
        className="w-full lg:w-[60%] rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5 space-y-4"
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
          Update Package
        </h1>

        <Banner type={msg.type} message={msg.text} />

        <Field id="packageName" label="Name">
          <input
            id="packageName"
            type="text"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageName}
            onChange={handleChange}
          />
        </Field>

        <Field id="packageDescription" label="Description">
          <textarea
            id="packageDescription"
            rows={4}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageDescription}
            onChange={handleChange}
          />
        </Field>

        <Field id="packageDestination" label="Destination">
          <input
            id="packageDestination"
            type="text"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageDestination}
            onChange={handleChange}
          />
        </Field>

        {/* Days / Nights */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Field id="packageDays" label="Days">
            <input
              id="packageDays"
              type="number"
              min={0}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageDays}
              onChange={handleChange}
            />
          </Field>
          <Field id="packageNights" label="Nights">
            <input
              id="packageNights"
              type="number"
              min={0}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageNights}
              onChange={handleChange}
            />
          </Field>
        </div>

        <Field id="packageAccommodation" label="Accommodation">
          <textarea
            id="packageAccommodation"
            rows={3}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageAccommodation}
            onChange={handleChange}
          />
        </Field>

        <Field id="packageTransportation" label="Transportation">
          <select
            id="packageTransportation"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageTransportation}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option>Flight</option>
            <option>Train</option>
            <option>Boat</option>
            <option>Other</option>
          </select>
        </Field>

        <Field id="packageMeals" label="Meals">
          <textarea
            id="packageMeals"
            rows={3}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageMeals}
            onChange={handleChange}
          />
        </Field>

        <Field id="packageActivities" label="Activities">
          <textarea
            id="packageActivities"
            rows={3}
            className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packageActivities}
            onChange={handleChange}
          />
        </Field>

        <Field id="packagePrice" label="Price">
          <input
            id="packagePrice"
            type="number"
            min={0}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            value={formData.packagePrice}
            onChange={handleChange}
          />
        </Field>

        <div className="flex items-center gap-2">
          <input
            id="packageOffer"
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300"
            checked={formData.packageOffer}
            onChange={handleChange}
          />
          <label htmlFor="packageOffer" className="text-sm font-medium">
            Offer
          </label>
        </div>

        {formData.packageOffer && (
          <Field id="packageDiscountPrice" label="Discount Price">
            <input
              id="packageDiscountPrice"
              type="number"
              min={0}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              value={formData.packageDiscountPrice}
              onChange={handleChange}
            />
          </Field>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              loading
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-neutral-900 hover:opacity-90 focus-visible:ring-neutral-300"
            }`}
          >
            {loading ? "Updating…" : "Update Package"}
          </button>
        </div>
      </form>

      {/* Right: image uploader / preview */}
      <div className="w-full lg:w-[32%] rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 sm:p-5 space-y-4 h-max">
        <Field
          id="packageImages"
          label="Images"
          hint={`Max ${MAX_IMAGES} images · < 2MB each`}
        >
          <input
            id="packageImages"
            type="file"
            multiple
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            onChange={(e) => setImages(e.target.files)}
          />
        </Field>

        {imageUploadError && <Banner type="error" message={imageUploadError} />}

        <button
          type="button"
          onClick={handleImageSubmit}
          disabled={uploading || !images?.length}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            uploading || !images?.length
              ? "bg-neutral-400 cursor-not-allowed"
              : "bg-neutral-900 hover:opacity-90 focus-visible:ring-neutral-300"
          }`}
        >
          {uploading ? `Uploading… (${imageUploadPercent}%)` : "Upload Images"}
        </button>

        {Array.isArray(formData.packageImages) &&
          formData.packageImages.length > 0 && (
            <div className="space-y-2">
              {formData.packageImages.map((image, i) => (
                <div
                  key={i}
                  className="
                    group flex items-center justify-between gap-3
                    rounded-xl border border-neutral-200 bg-white px-3 py-2
                    transition hover:shadow-sm
                  "
                >
                  <img
                    src={image}
                    alt={`Package ${i + 1}`}
                    className="h-16 w-16 rounded object-cover border border-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(i)}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default UpdatePackage;
