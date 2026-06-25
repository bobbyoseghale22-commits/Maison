import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IReview {
  product: Types.ObjectId;
  user: Types.ObjectId;
  order?: Types.ObjectId | null;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  /** True when the reviewer is confirmed to have purchased the product. */
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDocument extends IReview, Document {}

const reviewSchema = new Schema<ReviewDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title must be at most 120 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [2000, "Comment must be at most 2000 characters"],
    },
    images: {
      type: [String],
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// One review per user per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

// ---------------------------------------------------------------------------
// Denormalization hooks — keep Product.ratingAverage / ratingCount in sync
// ---------------------------------------------------------------------------

/**
 * Recomputes the rating average and count across all approved reviews
 * for `productId` and writes the result back onto the Product document.
 * Called after any review is saved or deleted so the values on the
 * Product are never stale (the shop product card and the product page
 * header both read from these denormalized fields for speed).
 */
async function syncProductRating(productId: Types.ObjectId) {
  // Dynamic import avoids a circular-reference between Review ↔ Product
  // models at module load time. Mongoose caches models, so this is
  // effectively free after the first call.
  const { Product } = await import("@/models/Product");

  const result = await reviewSchema.model("Review").aggregate<{
    count: number;
    avg: number;
  }>([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg: { $avg: "$rating" },
      },
    },
  ]);

  const row = result[0];
  const ratingCount = row?.count ?? 0;
  const ratingAverage = row ? Math.round(row.avg * 10) / 10 : 0;

  await Product.updateOne(
    { _id: productId },
    { ratingAverage, ratingCount },
  );
}

reviewSchema.post("save", async function () {
  await syncProductRating(this.product);
});

// `findOneAndUpdate` is used by admin approve/reject
reviewSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery()).select("product").lean();
  if (doc?.product) {
    await syncProductRating(doc.product as Types.ObjectId);
  }
});

// `findOneAndDelete` is used by admin delete and user self-delete
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc?.product) {
    await syncProductRating(doc.product as Types.ObjectId);
  }
});

export const Review: Model<ReviewDocument> =
  models.Review ?? model<ReviewDocument>("Review", reviewSchema);

export default Review;
