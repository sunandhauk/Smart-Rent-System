//A route to handle the wishList of a user specifically
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Property = require("../models/property");
const { protect } = require("../middleware/authMiddleware");

const buildWishlistKey = (propertyId, variantId = "default") =>
  `${String(propertyId)}::${String(variantId || "default")}`;

const normalizeVariantInput = (property, variant = {}) => {
  const basePrice = Number(property?.price) || 0;
  const variantId = String(variant?.id || variant?.variantId || "default").trim() || "default";
  const variantLabel =
    String(variant?.label || variant?.name || property?.propertyType || property?.category || "Standard stay").trim();
  const variantPrice = Number.isFinite(Number(variant?.price))
    ? Number(variant.price)
    : basePrice;
  const variantDescription = String(variant?.description || "").trim();
  const variantMeta =
    variant && typeof variant.meta === "object" && !Array.isArray(variant.meta)
      ? variant.meta
      : {};

  return {
    variantId,
    variantLabel,
    variantPrice,
    variantDescription,
    variantMeta,
  };
};

const migrateLegacyWishlist = async (user) => {
  if (!user) return;

  const legacyWishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
  const hasMigratedItems = Array.isArray(user.wishlistItems) && user.wishlistItems.length > 0;

  if (!legacyWishlist.length || hasMigratedItems) {
    return;
  }

  user.wishlistItems = legacyWishlist.map((propertyId) => ({
    property: propertyId,
    variantId: "default",
    variantLabel: "Standard stay",
    variantPrice: 0,
    variantDescription: "",
    variantMeta: {},
  }));
  user.wishlist = [];
  await user.save();
};

const serializeWishlistItem = (item) => {
  const property = item?.property;
  const propertyId =
    property?._id || item?.property?._id || item?.propertyId || item?.property || "";
  const variantId = item?.variantId || "default";

  return {
    _id: item?._id ? String(item._id) : buildWishlistKey(propertyId, variantId),
    key: buildWishlistKey(propertyId, variantId),
    propertyId: String(propertyId || ""),
    property,
    variant: {
      id: variantId,
      label: item?.variantLabel || "Standard stay",
      price: Number(item?.variantPrice) || Number(property?.price) || 0,
      description: item?.variantDescription || "",
      meta: item?.variantMeta || {},
    },
    savedAt: item?.updatedAt || item?.createdAt || null,
  };
};

router.post("/:propertyId", protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await migrateLegacyWishlist(user);

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const normalizedVariant = normalizeVariantInput(property, req.body?.variant);
    const itemKey = buildWishlistKey(propertyId, normalizedVariant.variantId);
    const index = user.wishlistItems.findIndex((item) => {
      const savedPropertyId =
        item?.property?._id || item?.property || item?.propertyId || "";
      return buildWishlistKey(savedPropertyId, item?.variantId) === itemKey;
    });

    if (index === -1) {
      user.wishlistItems.push({
        property: property._id,
        ...normalizedVariant,
      });
    } else {
      user.wishlistItems.splice(index, 1);
    }

    await user.save();
    await user.populate("wishlistItems.property");

    const matchedItem = user.wishlistItems.find((item) => {
      const savedPropertyId =
        item?.property?._id || item?.property || item?.propertyId || "";
      return buildWishlistKey(savedPropertyId, item?.variantId) === itemKey;
    });

    res.json({
      message: index === -1 ? "Wishlist item added" : "Wishlist item removed",
      action: index === -1 ? "added" : "removed",
      item: matchedItem ? serializeWishlistItem(matchedItem) : null,
      wishlist: user.wishlistItems.map(serializeWishlistItem),
    });
  } catch (err) {
    res.status(500).json({ message: "Wishlist update failed" });
  }
});

router.delete("/item/:wishlistItemId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { wishlistItemId } = req.params;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await migrateLegacyWishlist(user);

    const initialCount = user.wishlistItems.length;
    user.wishlistItems = user.wishlistItems.filter(
      (item) => String(item._id) !== String(wishlistItemId)
    );

    if (user.wishlistItems.length === initialCount) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    await user.save();
    res.json({ message: "Wishlist item removed" });
  } catch (err) {
    res.status(500).json({ message: "Wishlist removal failed" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlistItems.property");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await migrateLegacyWishlist(user);
    await user.populate("wishlistItems.property");

    res.json(user.wishlistItems.map(serializeWishlistItem));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

module.exports = router;
