"use client";

import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { PRODUCT_SIZES } from "@/models/types";
import type { ProductFormInput } from "@/lib/validations/product-admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VariantBuilderProps {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
}

const EMPTY_VARIANT: ProductFormInput["variants"][0] = {
  sku: "",
  size: "M",
  color: "",
  colorHex: "",
  stock: 0,
  priceOverride: undefined,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function inputCls(hasError?: boolean) {
  return cn(
    "h-9 w-full border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-foreground",
    hasError ? "border-destructive" : "border-input",
  );
}

/**
 * Dynamic variant rows using react-hook-form's `useFieldArray`.
 * Each row maps to one `ProductVariant` — the admin can add, remove,
 * and reorder variants without a server round-trip.
 *
 * `control` and `errors` come from the parent `ProductForm` so the
 * whole form validates as one unit with one submit.
 */
export function VariantBuilder({ control, errors }: VariantBuilderProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground border border-dashed border-border py-6 text-center">
          No variants yet. Add at least one size/colour combination.
        </p>
      )}

      {fields.map((field, index) => {
        const e = errors.variants?.[index] ?? {};
        return (
          <div
            key={field.id}
            className="relative grid grid-cols-2 gap-3 border border-border p-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            {/* SKU */}
            <div className="col-span-2 sm:col-span-1">
              <label className="text-label block text-foreground/60 mb-1">
                SKU *
              </label>
              <input
                {...control.register(`variants.${index}.sku`)}
                placeholder="COAT-BLK-M"
                className={inputCls(!!e.sku)}
              />
              <FieldError message={e.sku?.message} />
            </div>

            {/* Size */}
            <div>
              <label className="text-label block text-foreground/60 mb-1">
                Size *
              </label>
              <select
                {...control.register(`variants.${index}.size`)}
                className={inputCls(!!e.size)}
              >
                {PRODUCT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <FieldError message={e.size?.message} />
            </div>

            {/* Color */}
            <div>
              <label className="text-label block text-foreground/60 mb-1">
                Color *
              </label>
              <input
                {...control.register(`variants.${index}.color`)}
                placeholder="Black"
                className={inputCls(!!e.color)}
              />
              <FieldError message={e.color?.message} />
            </div>

            {/* Hex */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-label block text-foreground/60 mb-1">
                  Hex
                </label>
                <input
                  {...control.register(`variants.${index}.colorHex`)}
                  placeholder="#1F2937"
                  className={inputCls(!!e.colorHex)}
                />
                <FieldError message={e.colorHex?.message} />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="text-label block text-foreground/60 mb-1">
                Stock *
              </label>
              <input
                type="number"
                min={0}
                {...control.register(`variants.${index}.stock`)}
                className={inputCls(!!e.stock)}
              />
              <FieldError message={e.stock?.message} />
            </div>

            {/* Price override */}
            <div>
              <label className="text-label block text-foreground/60 mb-1">
                Price Override
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="—"
                {...control.register(`variants.${index}.priceOverride`)}
                className={inputCls(!!e.priceOverride)}
              />
              <FieldError message={e.priceOverride?.message} />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove variant"
              className="absolute right-2 top-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {errors.variants?.root && (
        <p className="text-xs text-destructive">
          {errors.variants.root.message}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ ...EMPTY_VARIANT })}
        className="gap-2 rounded-none"
      >
        <Plus className="h-4 w-4" />
        Add Variant
      </Button>
    </div>
  );
}
