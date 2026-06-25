import { Schema, model, models, type Document, type Model } from "mongoose";
import { USER_ROLES, type Address, type UserRole } from "@/models/types";

/**
 * User document shape (excludes Mongoose's own Document fields).
 * `password` is optional since OAuth-only accounts (e.g. Google) have
 * no local password.
 */
export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  phone?: string;
  addresses: Address[];
  emailVerified?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends IUser, Document {}

const addressSchema = new Schema<Address>(
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
  { _id: true },
);

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    image: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: { values: USER_ROLES, message: "{VALUE} is not a valid role" },
      default: "customer",
    },
    phone: {
      type: String,
      trim: true,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// `unique: true` above already creates an index on email; the schema
// indexes below cover the remaining common query patterns.
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export const User: Model<UserDocument> =
  models.User ?? model<UserDocument>("User", userSchema);

export default User;
