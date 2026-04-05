import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStoredHostListings, saveStoredHostListings } from "../utils/chennaiListings";

const HostListings = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setListings(getStoredHostListings());
    setLoading(false);
  }, []);

  const filteredListings =
    activeTab === "all" ? listings : listings.filter((listing) => listing.status === activeTab);

  const toggleListingStatus = (id) => {
    const updated = listings.map((listing) =>
      listing.id === id
        ? {
            ...listing,
            status: listing.status === "active" ? "inactive" : "active",
          }
        : listing
    );

    setListings(updated);
    saveStoredHostListings(updated);
  };

  const deleteListing = (id) => {
    const updated = listings.filter((listing) => listing.id !== id);
    setListings(updated);
    saveStoredHostListings(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-primary-600 text-xl font-semibold">Loading your Chennai listings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.14),_transparent_30%),linear-gradient(180deg,_#fff7f8_0%,_#f8fafc_44%,_#ffffff_100%)] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Manage Chennai Listings</h1>
            <p className="text-sm text-neutral-500">Publish panna rooms inga manage pannalaam.</p>
          </div>

          <Link
            to="/host/become-a-host"
            className="inline-flex items-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            <i className="fas fa-plus mr-2" />
            Add new listing
          </Link>
        </div>

        <div className="mb-6 flex gap-3">
          {["all", "active", "inactive"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-primary-600 text-white"
                  : "bg-white text-neutral-700 shadow-sm"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)]">
            <h3 className="text-lg font-semibold text-neutral-900">No host listings yet</h3>
            <p className="mt-2 text-sm text-neutral-500">Create a Chennai room listing and it will appear instantly.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.24)]"
              >
                <div className="md:flex">
                  <div className="md:w-72">
                    <img
                      src={listing.images?.[0]?.url || listing.images?.[0]?.secure_url}
                      alt={listing.title}
                      className="h-56 w-full object-cover md:h-full"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-neutral-900">{listing.title}</h2>
                        <p className="mt-1 text-sm text-neutral-500">
                          {listing.location?.locality}, {listing.location?.city}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-neutral-600">{listing.description}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          listing.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-neutral-100 px-3 py-1">{listing.category}</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">{listing.capacity?.bedrooms} bedrooms</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">{listing.capacity?.bathrooms} bathrooms</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">Rs.{listing.price}/month</span>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => toggleListingStatus(listing.id)}
                        className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
                      >
                        {listing.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
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

export default HostListings;
