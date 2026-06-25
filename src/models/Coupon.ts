import { Schema, model, models, type Document, type Model } from "mongoose";
import { COUPON_TYPES, type CouponType } from "@/models/types";

export interface ICoupon {
  code: string;
  description?: string;
  type: CouponType;
  /** Percentage (0-100) when type is "percentage", currency amount when "fixed". */
  value: number;
  /** Optional cap on discount amount for percentage-type coupons. */
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  /** Total number of times this coupon can be redeemed across all users. */
  usageLimit?: number;
  usageCount: number;
  /** Per-user redemption cap, enforced against Order history at checkout. */
  perUserLimit?: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponDocument extends ICoupon, Document {}

const couponSchema = new Schema<CouponDocument>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [32, "Coupon code must be at most 32 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description must be at most 300 characters"],
    },
    type: {
      type: String,
      enum: { values: COUPON_TYPES, message: "{VALUE} is not a valid type" },
      required: true,
    },
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [0, "Value cannot be negative"],
      validate: {
        validator: function (this: CouponDocument, value: number) {
          return this.type !== "percentage" || value <= 100;
        },
        message: "Percentage coupon value cannot exceed 100",
      },
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, "Max discount amount cannot be negative"],
    },
    minOrderAmount: {
      type: Number,
      min: [0, "Minimum order amount cannot be negative"],
      default: 0,
    },
    usageLimit: {
      type: Number,
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count cannot be negative"],
    },
    perUserLimit: {
      type: Number,
      min: [1, "Per-user limit must be at least 1"],
    },
    startsAt: {
      type: Date,
      required: [true, "Coupon start date is required"],
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Coupon expiry date is required"],
      validate: {
        validator: function (this: CouponDocument, value: Date) {
          return value > this.startsAt;
        },
        message: "expiresAt must be after startsAt",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// `unique: true` above already indexes `code`.
couponSchema.index({ isActive: 1, expiresAt: 1 });

export const Coupon: Model<CouponDocument> =
  models.Coupon ?? model<CouponDocument>("Coupon", couponSchema);

export default Coupon;
