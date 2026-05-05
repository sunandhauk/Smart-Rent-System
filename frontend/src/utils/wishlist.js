import {
  getDefaultPropertyVariant,
  getWishlistVariantForProperty,
} from "./propertyVariants";

const LOCAL_WISHLIST_STORAGE_KEY = "smartRentWishlistItems";
const LEGACY_WISHLIST_STORAGE_KEY = "smartRentWishlistIds";

export const getPropertyWishlistId = (property) => {
  const id = property?._id || property?.id;
  return id ? String(id) : "";
};

export const isMongoObjectId = (value) =>
  /^[a-f\d]{24}$/i.test(String(value || "").trim());

export const getWishlistItemKey = (propertyId, variantId = "default") =>
  `${String(propertyId || "")}::${String(variantId || "default")}`;

const normalizeWishlistVariant = (property, variant) => {
  const propertyVariantId = variant?.id || variant?.variantId;
  const resolvedVariant = property
    ? getWishlistVariantForProperty(property, propertyVariantId)
    : null;

  return {
    id: String(
      variant?.id || variant?.variantId || resolvedVariant?.id || "default"
    ),
    label: String(
      variant?.label || resolvedVariant?.label || "Standard stay"
    ),
    price: Number.isFinite(Number(variant?.price))
      ? Number(variant.price)
      : Number(resolvedVariant?.price) || Number(property?.price) || 0,
    description: String(
      variant?.description || resolvedVariant?.description || ""
    ),
    meta:
      variant?.meta && typeof variant.meta === "object" && !Array.isArray(variant.meta)
        ? variant.meta
        : resolvedVariant?.meta || {},
  };
};

export const normalizeWishlistItem = (item, propertyOverride = null) => {
  const property = propertyOverride || item?.property || null;
  const propertyId = String(
    item?.propertyId || getPropertyWishlistId(property) || ""
  );
  const variant = normalizeWishlistVariant(
    property,
    item?.variant || item?.selectedVariant || item
  );
  const key = String(item?.key || getWishlistItemKey(propertyId, variant.id));

  return {
    _id: item?._id ? String(item._id) : key,
    key,
    propertyId,
    property: property || null,
    variant,
    savedAt: item?.savedAt || item?.updatedAt || item?.createdAt || null,
  };
};

const readLegacyWishlistIds = () => {
  try {
    const raw = localStorage.getItem(LEGACY_WISHLIST_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.map((id) => String(id)).filter(Boolean))]
      : [];
  } catch (error) {
    console.error("Unable to parse local wishlist ids", error);
    return [];
  }
};

const migrateLegacyWishlistIds = (catalog = []) => {
  const legacyIds = readLegacyWishlistIds();
  if (!legacyIds.length) return [];

  const catalogMap = new Map(
    (Array.isArray(catalog) ? catalog : []).map((property) => [
      getPropertyWishlistId(property),
      property,
    ])
  );
  const migratedItems = legacyIds.map((propertyId) => {
    const property = catalogMap.get(propertyId) || null;
    return normalizeWishlistItem({
      propertyId,
      property,
      variant: getDefaultPropertyVariant(property || {}),
    });
  });

  saveStoredWishlistItems(migratedItems);
  localStorage.removeItem(LEGACY_WISHLIST_STORAGE_KEY);
  return migratedItems;
};

export const getStoredWishlistItems = (catalog = []) => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_STORAGE_KEY);
    if (!raw) {
      return migrateLegacyWishlistIds(catalog);
    }

    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) {
      return migrateLegacyWishlistIds(catalog);
    }

    return mergeWishlistItems(parsed.map((item) => normalizeWishlistItem(item)));
  } catch (error) {
    console.error("Unable to parse local wishlist items", error);
    return migrateLegacyWishlistIds(catalog);
  }
};

export const saveStoredWishlistItems = (items) => {
  if (typeof window === "undefined") return;

  const normalized = mergeWishlistItems(items);
  localStorage.setItem(LOCAL_WISHLIST_STORAGE_KEY, JSON.stringify(normalized));
};

export const addStoredWishlistItem = (item) => {
  const normalizedItem = normalizeWishlistItem(item, item?.property || null);
  const nextItems = mergeWishlistItems([
    ...getStoredWishlistItems(),
    normalizedItem,
  ]);
  saveStoredWishlistItems(nextItems);
  return nextItems;
};

export const removeStoredWishlistItem = (key) => {
  const targetKey = String(key || "");
  const nextItems = getStoredWishlistItems().filter(
    (item) => item.key !== targetKey
  );
  saveStoredWishlistItems(nextItems);
  return nextItems;
};

export const getStoredWishlistKeys = (catalog = []) =>
  getStoredWishlistItems(catalog).map((item) => item.key);

export const mergeWishlistItems = (...collections) => {
  const merged = [];
  const seen = new Set();

  collections
    .flat()
    .filter(Boolean)
    .forEach((item) => {
      const normalized = normalizeWishlistItem(item, item?.property || null);
      if (!normalized.propertyId || seen.has(normalized.key)) return;

      seen.add(normalized.key);
      merged.push(normalized);
    });

  return merged;
};
