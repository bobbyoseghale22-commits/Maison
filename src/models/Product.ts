import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import {
  PRODUCT_SIZES,
  type ProductImage,
  type ProductVariant,
} from "@/models/types";

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: Types.ObjectId;
  images: ProductImage[];
  /** Base price in the smallest currency unit's whole value (e.g. 49.99). */
  price: number;
  /** Optional "was" price to render a strikethrough discount. */
  compareAtPrice?: number;
  variants: ProductVariant[];
  /** Denormalized sum of all variant stock, kept in sync on save. */
  totalStock: number;
  tags: string[];
  /** Denormalized rating aggregate, recalculated when Reviews change. */
  ratingAverage: number;
  ratingCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends IProduct, Document {}

const productImageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
);

const productVariantSchema = new Schema<ProductVariant>(
  {
    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      trim: true,
      uppercase: true,
    },
    size: {
      type: String,
      enum: {
        values: PRODUCT_SIZES,
        message: "{VALUE} is not a valid size",
      },
      required: [true, "Variant size is required"],
    },
    color: {
      type: String,
      required: [true, "Variant color is required"],
      trim: true,
    },
    colorHex: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, "colorHex must be a valid hex color"],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    priceOverride: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: true },
);

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [200, "Product name must be at most 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase, alphanumeric, and hyphen-separated",
      ],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description must be at most 5000 characters"],
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    images: {
      type: [productImageSchema],
      validate: {
        validator: (value: ProductImage[]) => value.length > 0,
        message: "At least one product image is required",
      },
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price cannot be negative"],
    },
    variants: {
      type: [productVariantSchema],
      validate: {
        validator: (value: ProductVariant[]) => value.length > 0,
        message: "At least one product variant is required",
      },
    },
    totalStock: {
      type: Number,
      default: 0,
      min: [0, "Total stock cannot be negative"],
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => tags.map((tag) => tag.trim().toLowerCase()),
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

/** Keeps the denormalized `totalStock` field in sync with variant stock
 * on every save, so listing/filtering by stock doesn't require summing
 * variants at query time. */
productSchema.pre<ProductDocument>("save", function syncTotalStock(next) {
  if (this.isModified("variants")) {
    this.totalStock = this.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );
  }
  next();
});

// `unique: true` above already indexes `slug`.
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ "variants.sku": 1 });
// Support the shop/category page's size and color filters
// (src/lib/data/products.ts) without a full collection scan.
productSchema.index({ "variants.size": 1 });
productSchema.index({ "variants.color": 1 });
productSchema.index({ tags: 1 });
// Weighted so a name match ranks above a description match in
// `$text` relevance scoring (used by src/lib/data/search.ts) — a
// product literally named "Wool Coat" should outrank one that merely
// mentions wool in its description.
productSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 1 } },
);

export const Product: Model<ProductDocument> =
  models.Product ?? model<ProductDocument>("Product", productSchema);

export default Product;
