export const CHENNAI_AREAS = [
  "Adyar",
  "Velachery",
  "Vadapalani",
  "Tambaram",
  "OMR",
  "T Nagar",
  "Anna Nagar",
  "Porur",
  "Chromepet",
  "Guindy",
];

export const CHENNAI_CITY = "Chennai";

export const normalizeListingImage = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      url: image,
      secure_url: image,
      publicId: "normalized-image",
    };
  }

  const url = image.url || image.secure_url || "";

  return {
    ...image,
    url,
    secure_url: image.secure_url || url,
    publicId: image.publicId || image.public_id || "normalized-image",
  };
};

export const normalizeHostListing = (listing) => {
  const images = Array.isArray(listing.images)
    ? listing.images.map(normalizeListingImage).filter(Boolean)
    : [];

  return {
    ...listing,
    _id: String(listing._id || listing.id),
    id: String(listing.id || listing._id),
    source: listing.source || "local-host",
    isApproved: listing.isApproved ?? true,
    isActive: listing.isActive ?? listing.status !== "inactive",
    status: listing.status || "active",
    images,
    location: {
      ...listing.location,
      city: CHENNAI_CITY,
      country: listing.location?.country || "India",
      state: listing.location?.state || "Tamil Nadu",
    },
  };
};

export const getStoredHostListings = () => {
  try {
    const raw = localStorage.getItem("hostListings");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeHostListing) : [];
  } catch (error) {
    console.error("Unable to parse host listings from storage", error);
    return [];
  }
};

export const saveStoredHostListings = (listings) => {
  const normalized = Array.isArray(listings) ? listings.map(normalizeHostListing) : [];
  localStorage.setItem("hostListings", JSON.stringify(normalized));
};

export const isChennaiProperty = (property) => {
  const city = property.location?.city?.toLowerCase() || "";
  return city === CHENNAI_CITY.toLowerCase();
};
