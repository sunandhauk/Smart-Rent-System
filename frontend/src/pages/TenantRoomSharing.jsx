import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  createEmptyVacancyForm,
  getStoredTenantVacancies,
  normalizeVacancyListing,
  savePreferenceSnapshot,
  saveStoredTenantVacancies,
} from "../utils/tenantVacancies";

const amenityOptions = [
  { key: "wifi", label: "Wi-Fi", icon: "fa-wifi" },
  { key: "attachedBathroom", label: "Attached bathroom", icon: "fa-bath" },
  { key: "ac", label: "AC", icon: "fa-snowflake" },
  { key: "nonAc", label: "Non-AC", icon: "fa-fan" },
  { key: "food", label: "Food availability", icon: "fa-utensils" },
  { key: "housekeeping", label: "Housekeeping", icon: "fa-broom" },
  { key: "parking", label: "Parking", icon: "fa-square-parking" },
];

const occupationOptions = ["Student", "Working Professional"];

const descriptionTemplate = `I am currently staying in a PG accommodation and looking for additional roommates. At present, one person is occupying the room, and there is availability for up to three members to share the same room.

We are looking for friendly and responsible individuals who are comfortable with shared living. Basic amenities such as Wi-Fi, attached bathroom, and regular housekeeping are available.

Preferences:

Clean and hygienic habits
Non-smoker (preferred)
Working professionals or students
Respectful of shared space and privacy

If you are interested in a comfortable and affordable shared accommodation, please feel free to contact me.`;

const TenantRoomSharing = () => {
  const { currentUser } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [formData, setFormData] = useState(() => createEmptyVacancyForm(currentUser));

  useEffect(() => {
    const storedVacancies = getStoredTenantVacancies();
    setVacancies(storedVacancies);
    if (storedVacancies[0]?.preferences) {
      savePreferenceSnapshot(storedVacancies[0].preferences);
    } else {
      savePreferenceSnapshot(formData.preferences);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentUser && !editingId) {
      setFormData((prev) => ({
        ...prev,
        contactNumber: prev.contactNumber || currentUser.phone || "",
      }));
    }
  }, [currentUser, editingId]);

  useEffect(() => {
    if (isLoaded) {
      savePreferenceSnapshot(formData.preferences);
    }
  }, [formData.preferences, isLoaded]);

  const stats = useMemo(() => {
    const openListings = vacancies.filter((listing) => listing.listingStatus === "Open");
    return {
      total: vacancies.length,
      open: openListings.length,
      full: vacancies.filter((listing) => listing.listingStatus === "Full").length,
      availableSlots: openListings.reduce(
        (sum, listing) => sum + Number(listing.availableSlots || 0),
        0
      ),
    };
  }, [vacancies]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "currentOccupants" || name === "totalCapacity") {
        const currentOccupants =
          name === "currentOccupants" ? Number(value) : Number(prev.currentOccupants);
        const totalCapacity =
          name === "totalCapacity" ? Number(value) : Number(prev.totalCapacity);
        next.availableSlots = Math.max(totalCapacity - currentOccupants, 0);
      }

      if (name === "availableSlots") {
        next.availableSlots = Math.max(Number(value), 0);
      }

      return next;
    });
  };

  const handleAmenityToggle = (key) => {
    setFormData((prev) => {
      const nextAmenities = {
        ...prev.amenities,
        [key]: !prev.amenities[key],
      };

      if (key === "ac" && !prev.amenities[key]) {
        nextAmenities.nonAc = false;
      }

      if (key === "nonAc" && !prev.amenities[key]) {
        nextAmenities.ac = false;
      }

      return {
        ...prev,
        amenities: nextAmenities,
      };
    });
  };

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: value,
      },
    }));
  };

  const toggleOccupation = (value) => {
    setFormData((prev) => {
      const current = prev.preferences.occupation || [];
      const nextOccupation = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          occupation: nextOccupation,
        },
      };
    });
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const readers = files.map(
      (file, index) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${index}`,
              name: file.name,
              url: reader.result,
            });
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((uploadedPhotos) => {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos].slice(0, 6),
      }));
    });
  };

  const removePhoto = (photoId) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId),
    }));
  };

  const resetForm = (options = {}) => {
    const { preserveFeedback = false } = options;
    setEditingId(null);
    if (!preserveFeedback) {
      setFeedback("");
    }
    setFormData(createEmptyVacancyForm(currentUser));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedListing = normalizeVacancyListing({
      ...formData,
      id: editingId || Date.now(),
      listingStatus: Number(formData.availableSlots) > 0 ? formData.listingStatus : "Full",
      createdAt:
        vacancies.find((listing) => listing.id === editingId)?.createdAt ||
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedVacancies = editingId
      ? vacancies.map((listing) =>
          listing.id === editingId ? normalizedListing : listing
        )
      : [normalizedListing, ...vacancies];

    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
    savePreferenceSnapshot(normalizedListing.preferences);
    setFeedback(
      editingId
        ? "Vacancy listing updated successfully."
        : "Vacancy listing posted successfully."
    );
    resetForm({ preserveFeedback: true });
  };

  const handleEdit = (listing) => {
    setEditingId(listing.id);
    setFeedback("");
    setFormData(normalizeVacancyListing(listing));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    const updatedVacancies = vacancies.filter((listing) => listing.id !== id);
    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
    if (updatedVacancies[0]?.preferences) {
      savePreferenceSnapshot(updatedVacancies[0].preferences);
    } else {
      savePreferenceSnapshot(createEmptyVacancyForm(currentUser).preferences);
    }
  };

  const handleStatusToggle = (id) => {
    const updatedVacancies = vacancies.map((listing) => {
      if (listing.id !== id) {
        return listing;
      }

      const nextStatus = listing.listingStatus === "Full" ? "Open" : "Full";
      return normalizeVacancyListing({
        ...listing,
        listingStatus: nextStatus,
        availableSlots: nextStatus === "Full" ? 0 : Math.max(listing.availableSlots, 1),
        updatedAt: new Date().toISOString(),
      });
    });

    setVacancies(updatedVacancies);
    saveStoredTenantVacancies(updatedVacancies);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.12),_transparent_28%),linear-gradient(180deg,_#fffaf5_0%,_#f8fbff_45%,_#ffffff_100%)] py-8">
      <div className="container mx-auto px-4">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)]">
          <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div>
              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Tenant room sharing
              </span>
              <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
                Post room vacancies from your current stay and find the right roommate faster.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base">
                Create a listing from your PG, hostel, or apartment, share available spots,
                and highlight the lifestyle preferences that matter for shared living.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
                  Current occupancy + open slots
                </span>
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
                  Roommate preferences
                </span>
                <span className="rounded-full bg-neutral-100 px-4 py-2 text-neutral-700">
                  Photos, contact controls, and status management
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/messages"
                  className="inline-flex items-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  <i className="fas fa-comments mr-2" />
                  Open Messages
                </Link>
                <Link
                  to="/account"
                  className="inline-flex items-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  <i className="fas fa-user-circle mr-2" />
                  My Stay Settings
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-neutral-950 p-5 text-white shadow-lg sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live summary</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-3xl font-semibold">{stats.total}</p>
                    <p className="text-sm text-white/70">Total listings</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.open}</p>
                    <p className="text-sm text-white/70">Open now</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.full}</p>
                    <p className="text-sm text-white/70">Marked full</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{stats.availableSlots}</p>
                    <p className="text-sm text-white/70">Available slots</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-sky-100 bg-sky-50/70 p-5">
                <p className="text-sm font-semibold text-neutral-900">User flow</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Login, create a vacancy listing, review preferences from the top menu,
                  and manage everything from one place.
                </p>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-amber-50/80 p-5">
                <p className="text-sm font-semibold text-neutral-900">Best match details</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Share cleanliness, lifestyle, and occupation preferences so interested
                  roommates can self-qualify before reaching out.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)] md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingId ? "Edit vacancy listing" : "Create vacancy listing"}
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Add room details, amenities, preferences, and contact visibility for your current stay.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    description: descriptionTemplate,
                  }))
                }
                className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
              >
                Use sample description
              </button>
            </div>

            {feedback && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Basic details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Property type
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>PG</option>
                      <option>Apartment</option>
                      <option>Hostel</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Room type
                    <select
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>Single</option>
                      <option>Double Sharing</option>
                      <option>Triple Sharing</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                    Location
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFieldChange}
                      placeholder="Area, city, landmark"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                      required
                    />
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Rent per person
                    <input
                      type="number"
                      min="0"
                      name="rentPerPerson"
                      value={formData.rentPerPerson}
                      onChange={handleFieldChange}
                      placeholder="5000"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                      required
                    />
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Listing status
                    <select
                      name="listingStatus"
                      value={formData.listingStatus}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>Open</option>
                      <option>Full</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Occupancy details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-medium text-neutral-700">
                    Current occupants
                    <input
                      type="number"
                      min="0"
                      name="currentOccupants"
                      value={formData.currentOccupants}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Total room capacity
                    <input
                      type="number"
                      min="1"
                      name="totalCapacity"
                      value={formData.totalCapacity}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Available slots
                    <input
                      type="number"
                      min="0"
                      name="availableSlots"
                      value={formData.availableSlots}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Amenities</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity.key}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity.key)}
                      className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                        formData.amenities[amenity.key]
                          ? "border-primary-200 bg-primary-50 text-primary-700"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <i className={`fas ${amenity.icon} text-base`} />
                        <span className="text-sm font-medium">{amenity.label}</span>
                      </span>
                      <i
                        className={`fas ${
                          formData.amenities[amenity.key] ? "fa-check-circle" : "fa-circle"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Preferences</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      These details power the top-menu Preferences view.
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    Hidden by default in navbar
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Gender preference
                    <select
                      name="gender"
                      value={formData.preferences.gender}
                      onChange={handlePreferenceChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Any</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Sleep schedule
                    <input
                      type="text"
                      name="sleepSchedule"
                      value={formData.preferences.sleepSchedule}
                      onChange={handlePreferenceChange}
                      placeholder="Early sleeper, night owl, flexible"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Smoking habits
                    <select
                      name="smoking"
                      value={formData.preferences.smoking}
                      onChange={handlePreferenceChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>Non-smoker preferred</option>
                      <option>No preference</option>
                      <option>Smoker okay</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-neutral-700">
                    Drinking habits
                    <select
                      name="drinking"
                      value={formData.preferences.drinking}
                      onChange={handlePreferenceChange}
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    >
                      <option>No preference</option>
                      <option>Non-drinker preferred</option>
                      <option>Social drinking okay</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                    Cleanliness expectations
                    <input
                      type="text"
                      name="cleanliness"
                      value={formData.preferences.cleanliness}
                      onChange={handlePreferenceChange}
                      placeholder="Clean and hygienic habits"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-neutral-700">Occupation preference</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {occupationOptions.map((option) => {
                        const isSelected = formData.preferences.occupation.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOccupation(option)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "bg-sky-600 text-white"
                                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                    Other roommate preferences
                    <textarea
                      name="other"
                      value={formData.preferences.other}
                      onChange={handlePreferenceChange}
                      rows="3"
                      placeholder="Respectful of shared space, quiet calls after 10 PM, etc."
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Description</h3>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  rows="8"
                  className="mt-4 w-full rounded-[24px] border border-neutral-200 px-4 py-4 text-sm leading-7 text-neutral-700 focus:border-primary-300 focus:outline-none"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Media upload</h3>
                <div className="mt-4 rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-neutral-200 bg-white px-4 py-8 text-center transition hover:border-primary-200">
                    <i className="fas fa-images text-2xl text-primary-500" />
                    <span className="mt-3 text-sm font-semibold text-neutral-800">
                      Upload room or property photos
                    </span>
                    <span className="mt-1 text-xs text-neutral-500">
                      Up to 6 images. Stored locally for now.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  {formData.photos.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white"
                        >
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="h-40 w-full object-cover"
                          />
                          <div className="flex items-center justify-between p-3">
                            <p className="truncate pr-2 text-xs text-neutral-500">{photo.name}</p>
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="text-xs font-semibold text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Contact and visibility</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                    Contact number
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleFieldChange}
                      placeholder="Enter your contact number"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 focus:border-primary-300 focus:outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        showContactNumber: !prev.showContactNumber,
                      }))
                    }
                    className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                      formData.showContactNumber
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <span>
                      <p className="text-sm font-semibold">Show contact number</p>
                      <p className="mt-1 text-xs">Let viewers call directly from the listing.</p>
                    </span>
                    <i className={`fas ${formData.showContactNumber ? "fa-eye" : "fa-eye-slash"}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        enableInAppChat: !prev.enableInAppChat,
                      }))
                    }
                    className={`flex items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${
                      formData.enableInAppChat
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <span>
                      <p className="text-sm font-semibold">Enable in-app messaging</p>
                      <p className="mt-1 text-xs">Keep first conversations inside the platform.</p>
                    </span>
                    <i className={`fas ${formData.enableInAppChat ? "fa-comment-dots" : "fa-comment-slash"}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300"
                >
                  Clear form
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {editingId ? "Update vacancy" : "Post vacancy"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Manage listings</h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    Edit, mark full, or remove your current vacancy posts anytime.
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {vacancies.length} saved
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {vacancies.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-neutral-800">No vacancy listings yet</p>
                    <p className="mt-2 text-sm text-neutral-500">
                      Your first room-sharing post will appear here as soon as you publish it.
                    </p>
                  </div>
                ) : (
                  vacancies.map((listing) => (
                    <article
                      key={listing.id}
                      className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white"
                    >
                      {listing.photos[0] && (
                        <img
                          src={listing.photos[0].url}
                          alt={listing.location}
                          className="h-44 w-full object-cover"
                        />
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-neutral-900">
                              {listing.propertyType} | {listing.roomType}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">{listing.location}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              listing.listingStatus === "Full"
                                ? "bg-neutral-100 text-neutral-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {listing.listingStatus}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-600">
                          <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-400">Rent</p>
                            <p className="mt-1 font-semibold text-neutral-900">
                              Rs. {listing.rentPerPerson}/person
                            </p>
                          </div>
                          <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-400">Vacancies</p>
                            <p className="mt-1 font-semibold text-neutral-900">
                              {listing.availableSlots} open slots
                            </p>
                          </div>
                          <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-400">Occupancy</p>
                            <p className="mt-1 font-semibold text-neutral-900">
                              {listing.currentOccupants}/{listing.totalCapacity}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-neutral-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-400">Occupations</p>
                            <p className="mt-1 font-semibold text-neutral-900">
                              {listing.preferences.occupation.length
                                ? listing.preferences.occupation.join(", ")
                                : "Any"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {amenityOptions
                            .filter((amenity) => listing.amenities[amenity.key])
                            .slice(0, 4)
                            .map((amenity) => (
                              <span
                                key={amenity.key}
                                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                              >
                                {amenity.label}
                              </span>
                            ))}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(listing)}
                            className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(listing.id)}
                            className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                          >
                            {listing.listingStatus === "Full" ? "Reopen" : "Mark full"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(listing.id)}
                            className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/70 bg-neutral-950 p-6 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]">
              <h3 className="text-lg font-semibold">What the Preferences menu shows</h3>
              <div className="mt-4 space-y-3 text-sm text-white/75">
                <p>Gender preference: {formData.preferences.gender}</p>
                <p>
                  Occupation:{" "}
                  {formData.preferences.occupation.length
                    ? formData.preferences.occupation.join(", ")
                    : "Any"}
                </p>
                <p>Smoking: {formData.preferences.smoking}</p>
                <p>Drinking: {formData.preferences.drinking}</p>
                <p>Cleanliness: {formData.preferences.cleanliness}</p>
                <p>
                  Sleep schedule: {formData.preferences.sleepSchedule || "Not specified"}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TenantRoomSharing;
