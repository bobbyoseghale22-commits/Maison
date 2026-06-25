"use client";

import type { UseFormRegister, FieldErrors, FieldPath } from "react-hook-form";
import type { CheckoutInput } from "@/lib/validations/checkout";
import { cn } from "@/lib/utils";

interface AddressFieldsProps {
  /** "shippingAddress" or "billingAddress" */
  prefix: "shippingAddress" | "billingAddress";
  register: UseFormRegister<CheckoutInput>;
  errors: FieldErrors<CheckoutInput>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function inputClass(hasError?: boolean) {
  return cn(
    "h-10 w-full border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-foreground",
    hasError ? "border-destructive" : "border-input",
  );
}

/**
 * Reusable address fieldset. Accepts a `prefix` so the same component
 * drives both the shipping and billing address sections. Wired into
 * react-hook-form via `register` passed down from `CheckoutForm`.
 */
export function AddressFields({
  prefix,
  register,
  errors,
}: AddressFieldsProps) {
  const e = (errors[prefix] ?? {}) as Record<string, { message?: string }>;

  function field(name: string): FieldPath<CheckoutInput> {
    return `${prefix}.${name}` as FieldPath<CheckoutInput>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label
          htmlFor={`${prefix}-fullName`}
          className="text-label block text-foreground/60"
        >
          Full Name
        </label>
        <input
          id={`${prefix}-fullName`}
          {...register(field("fullName"))}
          autoComplete="name"
          className={cn(inputClass(!!e.fullName), "mt-2")}
        />
        <FieldError message={e.fullName?.message} />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${prefix}-phone`}
          className="text-label block text-foreground/60"
        >
          Phone
        </label>
        <input
          id={`${prefix}-phone`}
          type="tel"
          {...register(field("phone"))}
          autoComplete="tel"
          className={cn(inputClass(!!e.phone), "mt-2")}
        />
        <FieldError message={e.phone?.message} />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${prefix}-line1`}
          className="text-label block text-foreground/60"
        >
          Address Line 1
        </label>
        <input
          id={`${prefix}-line1`}
          {...register(field("line1"))}
          autoComplete="address-line1"
          className={cn(inputClass(!!e.line1), "mt-2")}
        />
        <FieldError message={e.line1?.message} />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${prefix}-line2`}
          className="text-label block text-foreground/60"
        >
          Address Line 2{" "}
          <span className="text-foreground/40">(optional)</span>
        </label>
        <input
          id={`${prefix}-line2`}
          {...register(field("line2"))}
          autoComplete="address-line2"
          className={cn(inputClass(false), "mt-2")}
        />
      </div>

      <div>
        <label
          htmlFor={`${prefix}-city`}
          className="text-label block text-foreground/60"
        >
          City
        </label>
        <input
          id={`${prefix}-city`}
          {...register(field("city"))}
          autoComplete="address-level2"
          className={cn(inputClass(!!e.city), "mt-2")}
        />
        <FieldError message={e.city?.message} />
      </div>

      <div>
        <label
          htmlFor={`${prefix}-state`}
          className="text-label block text-foreground/60"
        >
          State / Province
        </label>
        <input
          id={`${prefix}-state`}
          {...register(field("state"))}
          autoComplete="address-level1"
          className={cn(inputClass(!!e.state), "mt-2")}
        />
        <FieldError message={e.state?.message} />
      </div>

      <div>
        <label
          htmlFor={`${prefix}-postalCode`}
          className="text-label block text-foreground/60"
        >
          Postal Code
        </label>
        <input
          id={`${prefix}-postalCode`}
          {...register(field("postalCode"))}
          autoComplete="postal-code"
          className={cn(inputClass(!!e.postalCode), "mt-2")}
        />
        <FieldError message={e.postalCode?.message} />
      </div>

      <div>
        <label
          htmlFor={`${prefix}-country`}
          className="text-label block text-foreground/60"
        >
          Country
        </label>
        <input
          id={`${prefix}-country`}
          {...register(field("country"))}
          autoComplete="country-name"
          className={cn(inputClass(!!e.country), "mt-2")}
        />
        <FieldError message={e.country?.message} />
      </div>
    </div>
  );
}
