import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../config/api";
import PropertyImage from "../components/PropertyImage";
import { useAppSettings } from "../contexts/AppSettingsContext";
import dummyProperties from "../data/dummyProperties";
import { getStoredHostListings } from "../utils/chennaiListings";
import {
  getStoredWishlistItems,
  mergeWishlistItems,
  normalizeWishlistItem,
  removeStoredWishlistItem,
} from "../utils/wishlist";

const getPropertyLocationLabel = (property) =>
  [property.location?.locality, property.location?.city, property.location?.state]
    .filter(Boolean)
    .join(", ") || "Location not available";

const Wishlist = () => {
  const navigate = useNavigate();
  const { theme } = useAppSettings();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      const localCatalog = [...dummyProperties, ...getStoredHostListings()];
      const localItems = getStoredWishlistItems(localCatalog).map((item) => {
        if (item.property) return item;
        const hydratedProperty = localCatalog.find(
          (property) => String(property._id || property.id) === item.propertyId
        );
        return normalizeWishlistItem(item, hydratedProperty || null);
      });

      try {
        const res = await api.get("/api/wishlist");
        const backendItems = Array.isArray(res.data)
          ? res.data.map((item) => normalizeWishlistItem(item, item.property))
          : [];
        setSavedItems(mergeWishlistItems(backendItems, localItems));
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
        setSavedItems(localItems.filter((item) => item.property));
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const totalSaved = savedItems.length;

  const emptyCopy = useMemo(
    () => ({
      title: "No saved properties yet",
      description: "Room card-la heart click pannina inga save ஆகும்.",
    }),
    []
  );

  const handleRemoveFromWishlist = async (item) => {
    removeStoredWishlistItem(item.key);
    setSavedItems((prev) =>
      prev.filter((savedItem) => savedItem.key !== item.key)
    );

    if (!item._id || item._id === item.key) {
      return;
    }

    try {
      await api.delete(`/api/wishlist/item/${item._id}`);
    } catch (error) {
      console.error("Failed to remove from wishlist", error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen py-20 text-center ${theme === "dark" ? "bg-black text-white" : "bg-neutral-50 text-neutral-700"}`}>
        Loading wishlist...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-8 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.12),_transparent_24%),linear-gradient(180deg,_#fff8f1_0%,_#fff4ea_40%,_#ffffff_100%)] text-black"
      }`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`mb-8 rounded-[28px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] ${
            theme === "dark" ? "border-red-400/50 bg-black" : "border-orange-200/70 bg-white/90"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                Saved homes
              </span>
              <h1 className={`mt-3 text-3xl font-bold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>Wishlist</h1>
              <p className={`mt-2 text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                Listing cards-ல save பண்ணின rooms, PGs, hostels இங்க ஒரே இடத்தில் பார்க்கலாம்.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-neutral-700"}`}>
                <p className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-orange-700"}`}>{totalSaved}</p>
                <p>Saved listings</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/listings?location=Chennai")}
                className="rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
              >
                Explore more
              </button>
            </div>
          </div>
        </div>

        {totalSaved === 0 ? (
          <div
            className={`rounded-[28px] border py-16 text-center shadow-[0_24px_60px_-34px_rgba(15,23,42,0.24)] ${
              theme === "dark" ? "border-red-400/50 bg-black text-white" : "border-orange-200/70 bg-white/90 text-black"
            }`}
          >
            <div className={`mb-4 text-5xl ${theme === "dark" ? "text-white" : "text-neutral-300"}`}>
              <i className="far fa-heart" />
            </div>
            <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{emptyCopy.title}</h2>
            <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>{emptyCopy.description}</p>
            <Link
              to="/listings?location=Chennai"
              className="mt-6 inline-flex rounded-2xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
            >
              Browse Chennai listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {savedItems.map((item) => {
              const propertyId = item.propertyId;
              const property = item.property;
              if (!property) return null;

              const propertyImages =
                Array.isArray(property.images) && property.images.length > 0
                  ? property.images
                  : ["/images/default-property.jpg"];

              return (
                <div
                  key={item.key}
                  className={`overflow-hidden rounded-[28px] border shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)] ${
                    theme === "dark" ? "border-red-400/50 bg-black text-white" : "border-orange-200/70 bg-white/90 text-black"
                  }`}
                >
                  <div className="relative h-64 overflow-hidden">
                    <PropertyImage
                      images={propertyImages}
                      alt={property.title}
                      className="h-full w-full object-cover"
                      showGallery={true}
                      id={`wishlist-image-${item.key}`}
                      propertyId={propertyId}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFromWishlist(item)}
                      aria-label="Remove from wishlist"
                      className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
                    >
                      <i className="fas fa-heart" />
                    </button>
                    <span className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-white text-orange-700"}`}>
                      Rs.{item.variant.price || property.price}/month
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>{property.title}</h2>
                        <p className={`mt-1 text-sm ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>{getPropertyLocationLabel(property)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                        <i className="fas fa-star mr-1" />
                        {property.rating || property.averageRating || 4.5}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-100 text-orange-700"}`}>
                        {property.propertyType || property.category || "Room"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-black text-white" : "bg-orange-50 text-neutral-700"}`}>
                        {item.variant.label}
                      </span>
                    </div>
                    {item.variant.description && (
                      <p className={`mb-4 text-sm ${theme === "dark" ? "text-white" : "text-neutral-500"}`}>{item.variant.description}</p>
                    )}

                    <p className={`mb-5 line-clamp-3 text-sm leading-6 ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>{property.description}</p>

                    <div className={`mb-5 grid grid-cols-2 gap-3 text-sm ${theme === "dark" ? "text-white" : "text-neutral-600"}`}>
                      <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black" : "bg-orange-50"}`}>
                        <i className={`fas fa-bed mr-2 ${theme === "dark" ? "text-white" : "text-orange-500"}`} />
                        {property.capacity?.bedrooms || 1} Beds
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${theme === "dark" ? "bg-black" : "bg-orange-50"}`}>
                        <i className={`fas fa-bath mr-2 ${theme === "dark" ? "text-white" : "text-orange-500"}`} />
                        {property.capacity?.bathrooms || 1} Baths
                      </div>
                    </div>

                    <Link
                      to={`/properties/${propertyId}?variant=${encodeURIComponent(item.variant.id)}`}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
