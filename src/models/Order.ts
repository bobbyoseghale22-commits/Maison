import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PRODUCT_SIZES,
  type Address,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
} from "@/models/types";

export interface IOrder {
  orderNumber: string;
  /** Set for authenticated orders. Null for guest orders. */
  user?: Types.ObjectId | null;
  /** Email for guest order receipts. Required when user is null. */
  guestEmail?: string | null;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  coupon?: Types.ObjectId | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Stripe PaymentIntent id, set once checkout creates a payment. */
  stripePaymentIntentId?: string;
  /** Stripe Checkout Session id, if Checkout Sessions are used instead. */
  stripeCheckoutSessionId?: string;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDocument extends IOrder, Document {}

const addressSubSchema = new Schema<Address>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderItemSchema = new Schema<OrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    size: {
      type: String,
      enum: { values: PRODUCT_SIZES, message: "{VALUE} is not a valid size" },
      required: true,
    },
    color: { type: String, required: true, trim: true },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // sparse so guest orders (user: null) don't collide on the
      // unique index — each real user can only appear once in the
      // non-null set, while nulls are ignored by the index.
      index: { sparse: true },
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (value: OrderItem[]) => value.length > 0,
        message: "Order must contain at least one item",
      },
    },
    shippingAddress: { type: addressSubSchema, required: true },
    billingAddress: { type: addressSubSchema, required: true },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Shipping cost cannot be negative"],
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: "{VALUE} is not a valid status" },
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: "{VALUE} is not a valid payment status",
      },
      default: "unpaid",
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes must be at most 1000 characters"],
    },
  },
  { timestamps: true },
);

// `unique: true` above already indexes `orderNumber`.
orderSchema.pre("validate", function (next) {
  const hasUser = Boolean(this.user);
  const hasGuestEmail = Boolean(this.guestEmail);
  if (!hasUser && !hasGuestEmail) {
    next(new Error("Order must have either a user or a guestEmail."));
    return;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ stripePaymentIntentId: 1 });

export const Order: Model<OrderDocument> =
  models.Order ?? model<OrderDocument>("Order", orderSchema);

export default Order;
