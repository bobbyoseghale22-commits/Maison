import {
  Schema,
  model,
  models,
  type Document,
  type Model,
  type Types,
} from "mongoose";

/**
 * Category supports a self-referencing parent for nested menus, e.g.
 * "Clothing" -> "Outerwear" -> "Jackets". `parent` is undefined for
 * top-level categories.
 */
export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | null;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [80, "Category name must be at most 80 characters"],
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
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
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// `unique: true` above already indexes `slug`.
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
// Supports product search matching by category name/description
// (src/lib/data/search.ts) — mirrors the text index already on
// Product (name + description) so "search by category" can run a
// real text query instead of a slow regex scan.
categorySchema.index({ name: "text", description: "text" });

export const Category: Model<CategoryDocument> =
  models.Category ?? model<CategoryDocument>("Category", categorySchema);

export default Category;
