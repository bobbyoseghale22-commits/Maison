import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import { PRODUCT_SIZES, type CartItem } from "@/models/types";

/**
 * One Cart document per user OR per guest — never both. Exactly one
 * of `user` / `guestId` is set, enforced by the validator below:
 *   - Authenticated shoppers: `user` is set, `guestId` is null.
 *   - Guests: `guestId` is set (a random id stored in an httpOnly
 *     cookie — see `src/lib/cart/guest-id.ts`), `user` is null.
 *
 * On sign-in, `mergeGuestCartIntoUserCart` (in `src/lib/data/cart.ts`)
 * folds a guest cart's items into the user's cart and deletes the
 * guest document, so a shopper never loses items by logging in
 * mid-session.
 */
export interface ICart {
  user?: Types.ObjectId | null;
  guestId?: string | null;
  items: CartItem[];
  coupon?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartDocument extends ICart, Document {}

const cartItemSchema = new Schema<CartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    size: {
      type: String,
      enum: { values: PRODUCT_SIZES, message: "{VALUE} is not a valid size" },
      required: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    priceAtAdd: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: true },
);

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // `unique` + `sparse` so any number of documents with
      // `user: null` (guest carts) can coexist, while two documents
      // can never share the same real user id.
      unique: true,
      sparse: true,
    },
    guestId: {
      type: String,
      default: null,
      trim: true,
      unique: true,
      sparse: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true },
);

cartSchema.pre("validate", function enforceExactlyOneOwner(next) {
  const hasUser = Boolean(this.user);
  const hasGuestId = Boolean(this.guestId);

  if (hasUser === hasGuestId) {
    next(
      new Error(
        hasUser
          ? "A cart cannot have both a user and a guestId."
          : "A cart must have either a user or a guestId.",
      ),
    );
    return;
  }

  next();
});

// `unique: true` + `sparse: true` above already index `user` and `guestId`.
cartSchema.index({ "items.product": 1 });

export const Cart: Model<CartDocument> =
  models.Cart ?? model<CartDocument>("Cart", cartSchema);

export default Cart;
