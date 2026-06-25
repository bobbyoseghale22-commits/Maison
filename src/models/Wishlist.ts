import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IWishlistItem {
  product: Types.ObjectId;
  addedAt: Date;
}

/**
 * One Wishlist document per user (enforced via the unique index below)
 * containing an array of saved products, rather than one document per
 * saved item — keeps "is this in my wishlist" and "show my wishlist"
 * both single-document reads.
 */
export interface IWishlist {
  user: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistDocument extends IWishlist, Document {}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const wishlistSchema = new Schema<WishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Wishlist must belong to a user"],
      unique: true,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// `unique: true` above already indexes `user`.
wishlistSchema.index({ "items.product": 1 });

export const Wishlist: Model<WishlistDocument> =
  models.Wishlist ?? model<WishlistDocument>("Wishlist", wishlistSchema);

export default Wishlist;
