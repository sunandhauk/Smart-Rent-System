const roundPrice = (value) => Math.max(0, Math.round(Number(value) || 0));

const buildGeneratedVariants = (property) => {
  const propertyType = String(
    property?.propertyType || property?.category || "Room"
  ).toLowerCase();
  const basePrice = roundPrice(property?.price);

  if (propertyType === "pg") {
    return [
      {
        id: "single-sharing",
        label: "Single Sharing",
        price: roundPrice(basePrice + 600),
        description: "Private sleeping space with extra privacy.",
        meta: { occupancy: 1, category: "sharing" },
      },
      {
        id: "double-sharing",
        label: "Double Sharing",
        price: basePrice,
        description: "Balanced price and comfort for two occupants.",
        meta: { occupancy: 2, category: "sharing" },
      },
      {
        id: "triple-sharing",
        label: "Triple Sharing",
        price: roundPrice(Math.max(basePrice - 450, 0)),
        description: "Lower monthly rent in a shared PG setup.",
        meta: { occupancy: 3, category: "sharing" },
      },
    ];
  }

  if (propertyType === "hostel") {
    return [
      {
        id: "two-sharing",
        label: "Two Sharing",
        price: roundPrice(basePrice + 300),
        description: "Shared hostel room with fewer occupants.",
        meta: { occupancy: 2, category: "sharing" },
      },
      {
        id: "three-sharing",
        label: "Three Sharing",
        price: basePrice,
        description: "Standard hostel option for everyday stays.",
        meta: { occupancy: 3, category: "sharing" },
      },
      {
        id: "four-sharing",
        label: "Four Sharing",
        price: roundPrice(Math.max(basePrice - 300, 0)),
        description: "Most affordable shared hostel option.",
        meta: { occupancy: 4, category: "sharing" },
      },
    ];
  }

  return [
    {
      id: "private-room",
      label: "Private Room",
      price: basePrice,
      description: "Standard booking option for this room.",
      meta: { occupancy: 1, category: "private" },
    },
    {
      id: "couple-stay",
      label: "Couple Stay",
      price: roundPrice(basePrice + 500),
      description: "Extra space and higher occupancy allowance.",
      meta: { occupancy: 2, category: "private" },
    },
    {
      id: "compact-share",
      label: "Compact Share",
      price: roundPrice(Math.max(basePrice - 350, 0)),
      description: "Budget-friendly shared stay option.",
      meta: { occupancy: 2, category: "sharing" },
    },
  ];
};

const normalizeVariant = (property, variant, index = 0) => {
  const basePrice = roundPrice(property?.price);
  const fallbackId = index === 0 ? "default" : `variant-${index + 1}`;

  return {
    id: String(variant?.id || variant?.variantId || fallbackId),
    label: String(
      variant?.label ||
        variant?.name ||
        variant?.title ||
        property?.propertyType ||
        property?.category ||
        "Standard stay"
    ),
    price: Number.isFinite(Number(variant?.price))
      ? roundPrice(variant.price)
      : basePrice,
    description: String(variant?.description || ""),
    meta:
      variant?.meta && typeof variant.meta === "object" && !Array.isArray(variant.meta)
        ? variant.meta
        : {},
  };
};

export const getPropertyVariants = (property) => {
  if (!property) return [];

  const sourceVariants = Array.isArray(property?.variants) && property.variants.length
    ? property.variants
    : buildGeneratedVariants(property);

  return sourceVariants.map((variant, index) => normalizeVariant(property, variant, index));
};

export const getDefaultPropertyVariant = (property) =>
  getPropertyVariants(property)[0] || {
    id: "default",
    label: String(property?.propertyType || property?.category || "Standard stay"),
    price: roundPrice(property?.price),
    description: "",
    meta: {},
  };

export const getWishlistVariantForProperty = (property, variantId) => {
  const variants = getPropertyVariants(property);
  if (!variants.length) return getDefaultPropertyVariant(property);

  return (
    variants.find((variant) => String(variant.id) === String(variantId)) ||
    variants[0]
  );
};
