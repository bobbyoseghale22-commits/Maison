"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  productFormSchema,
  type ProductFormInput,
} from "@/lib/validations/product-admin";
import { slugify } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { VariantBuilder } from "@/components/admin/variant-builder";
import { cn } from "@/lib/utils";
import type { AdminCategoryRow } from "@/lib/data/admin";
import type { AdminProductDetail } from "@/lib/data/admin-products";

interface ProductFormProps {
  /** Present on edit; absent on create. */
  product?: AdminProductDetail;
  categories: AdminCategoryRow[];
}

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-label block text-foreground/60">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function inputCls(hasError?: boolean) {
  return cn(
    "h-10 w-full border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-foreground",
    hasError ? "border-destructive" : "border-input",
  );
}

/**
 * Shared create/edit form. Driven by `productFormSchema` via
 * react-hook-form + zodResolver, matching the pattern used in
 * `ReviewForm` and `CheckoutForm`.
 *
 * On create: POST /api/admin/products → redirect to edit page.
 * On edit:   PATCH /api/admin/products/[id] → stay on page, toast.
 */
export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          brand: product.brand ?? "",
          category: product.category,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? undefined,
          tags: product.tags.join(", ") as unknown as string[],
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          images: product.images,
          variants: product.variants.map((v) => ({
            _id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex ?? "",
            stock: v.stock,
            priceOverride: v.priceOverride,
          })),
        }
      : {
          name: "",
          slug: "",
          description: "",
          brand: "",
          category: "",
          price: 0,
          compareAtPrice: undefined,
          tags: [] as unknown as string[],
          isActive: true,
          isFeatured: false,
          images: [],
          variants: [],
        },
  });

  // Auto-generate slug from name on create (not on edit — slug changes break URLs)
  const nameValue = watch("name");
  React.useEffect(() => {
    if (!isEdit) {
      setValue("slug", slugify(nameValue ?? ""), { shouldValidate: false });
    }
  }, [nameValue, isEdit, setValue]);

  async function onSubmit(values: ProductFormInput) {
    const url = isEdit
      ? `/api/admin/products/${product!.id}`
      : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json() as {
        id?: string;
        slug?: string;
        error?: string;
        fieldErrors?: Record<string, string[]>;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        return;
      }

      if (isEdit) {
        toast.success("Product saved.");
        router.refresh();
      } else {
        toast.success("Product created.");
        router.push(`/admin/products/${data.id}/edit`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* ── Core details ───────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="font-display text-xl italic text-foreground border-b border-border pb-3">
          Details
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Product Name" required error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="e.g. Merino Wool Overcoat"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Slug" required error={errors.slug?.message}>
            <input
              {...register("slug")}
              placeholder="merino-wool-overcoat"
              className={inputCls(!!errors.slug)}
            />
          </Field>

          <Field label="Brand" error={errors.brand?.message}>
            <input
              {...register("brand")}
              placeholder="Maison Noir"
              className={inputCls(!!errors.brand)}
            />
          </Field>

          <Field label="Category" required error={errors.category?.message}>
            <select
              {...register("category")}
              className={inputCls(!!errors.category)}
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentName ? `${cat.parentName} → ` : ""}
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" required error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={6}
            placeholder="Describe the product in detail — materials, fit, care instructions…"
            className={cn(
              "w-full resize-y border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground",
              errors.description ? "border-destructive" : "border-input",
            )}
          />
        </Field>

        <Field label="Tags" error={errors.tags?.message}>
          <input
            {...register("tags")}
            placeholder="wool, outerwear, winter (comma-separated)"
            className={inputCls(!!errors.tags)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate tags with commas. They are lowercased automatically.
          </p>
        </Field>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section className="space-y-6">
        <h2 className="font-display text-xl italic text-foreground border-b border-border pb-3">
          Pricing
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Base Price (USD)" required error={errors.price?.message}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min={0}
                {...register("price")}
                className={cn(inputCls(!!errors.price), "pl-7")}
              />
            </div>
          </Field>

          <Field
            label="Compare-at Price (USD)"
            error={errors.compareAtPrice?.message}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Optional — shows as strikethrough"
                {...register("compareAtPrice")}
                className={cn(inputCls(!!errors.compareAtPrice), "pl-7")}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* ── Visibility ───────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-display text-xl italic text-foreground border-b border-border pb-3">
          Visibility
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register("isActive")}
              className="h-4 w-4 accent-foreground"
            />
            <span className="text-sm text-foreground">
              Active{" "}
              <span className="text-muted-foreground">
                (visible in the shop)
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              {...register("isFeatured")}
              className="h-4 w-4 accent-foreground"
            />
            <span className="text-sm text-foreground">
              Featured{" "}
              <span className="text-muted-foreground">
                (shown in Featured rail)
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* ── Images ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-display text-xl italic text-foreground border-b border-border pb-3">
          Images
        </h2>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader
              value={field.value.map((img) => ({
                url: img.url,
                alt: img.alt,
                publicId: img.publicId,
              }))}
              onChange={(imgs) =>
                field.onChange(
                  imgs.map((img) => ({
                    url: img.url,
                    publicId: img.publicId ?? "",
                    alt: img.alt ?? "",
                  })),
                )
              }
              maxImages={8}
            />
          )}
        />
        {errors.images && (
          <p className="text-xs text-destructive">
            {errors.images.message ?? errors.images.root?.message}
          </p>
        )}
      </section>

      {/* ── Variants ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-display text-xl italic text-foreground border-b border-border pb-3">
          Variants
        </h2>
        <p className="text-sm text-muted-foreground">
          Each variant is a unique size/colour combination with its own
          SKU and stock level.
        </p>
        <VariantBuilder control={control} errors={errors} />
      </section>

      {/* ── Submit ───────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button
          type="submit"
          disabled={isSubmitting || (isEdit && !isDirty)}
          className="rounded-none min-w-[140px]"
        >
          {isSubmitting
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save Changes"
              : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
          className="rounded-none"
        >
          Cancel
        </Button>
        {isEdit && (
          <span className="text-xs text-muted-foreground ml-auto">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
        )}
      </div>
    </form>
  );
}
