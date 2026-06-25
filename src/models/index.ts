/**
 * Barrel export for all Mongoose models.
 *
 * Importing from this file (instead of individual model files)
 * guarantees every schema is registered before any `populate()` call
 * needs it — Mongoose throws `MissingSchemaError` if e.g. `Order` is
 * populated with `category` before `Category` has been registered.
 *
 * Usage:
 *   import { User, Product, Order } from "@/models";
 */
export { User, type IUser, type UserDocument } from "@/models/User";
export {
  Category,
  type ICategory,
  type CategoryDocument,
} from "@/models/Category";
export {
  Product,
  type IProduct,
  type ProductDocument,
} from "@/models/Product";
export { Order, type IOrder, type OrderDocument } from "@/models/Order";
export { Review, type IReview, type ReviewDocument } from "@/models/Review";
export { Coupon, type ICoupon, type CouponDocument } from "@/models/Coupon";
export {
  Wishlist,
  type IWishlist,
  type IWishlistItem,
  type WishlistDocument,
} from "@/models/Wishlist";
export { Cart, type ICart, type CartDocument } from "@/models/Cart";

export * from "@/models/types";
