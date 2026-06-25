"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import type { CartView } from "@/lib/data/cart";
import type { CouponView, CheckoutTotals } from "@/lib/checkout-utils";
import { computeTotals } from "@/lib/checkout-utils";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/checkout/address-fields";
import { CouponField } from "@/components/checkout/coupon-field";
import { OrderSummary } from "@/components/checkout/order-summary";

interface CheckoutFormProps {
  cart: CartView;
  userEmail: string | null;
}

/**
 * Main checkout client component.
 *
 * On submit: POST /api/checkout → receives Stripe Checkout Session
 * URL → redirects the browser to Stripe-hosted payment page.
 *
 * After payment Stripe redirects to /checkout/success (success) or
 * /checkout/cancel (abandoned/failed).
 */
export function CheckoutForm({ cart, userEmail }: CheckoutFormProps) {
  const router = useRouter();
  const isGuest = !userEmail;

  const [sameAsShipping, setSameAsShipping] = React.useState(true);
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponView | null>(null);

  const baseTotals: CheckoutTotals = computeTotals(cart.subtotal, appliedCoupon);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "" },
      billingAddress: { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "" },
      guestEmail: "",
      couponCode: "",
      notes: "",
    },
  });

  const shippingAddress = watch("shippingAddress");

  React.useEffect(() => {
    if (sameAsShipping) {
      setValue("billingAddress", shippingAddress, { shouldValidate: false });
    }
  }, [sameAsShipping, shippingAddress, setValue]);

  async function onSubmit(values: CheckoutInput) {
    const payload: CheckoutInput = {
      ...values,
      couponCode: appliedCoupon?.code ?? "",
      guestEmail: isGuest ? values.guestEmail : "",
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { sessionUrl?: string; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed. Please try again.");
        return;
      }

      if (data.sessionUrl) {
        // Redirect to Stripe-hosted payment page
        router.push(data.sessionUrl);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          {isGuest && (
            <section>
              <h2 className="font-display text-xl italic text-foreground">Contact</h2>
              <div className="mt-6">
                <label htmlFor="guestEmail" className="text-label block text-foreground/60">
                  Email address
                </label>
                <input
                  id="guestEmail"
                  type="email"
                  {...register("guestEmail")}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                />
                {errors.guestEmail && (
                  <p className="mt-1 text-xs text-destructive">{errors.guestEmail.message}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Your order confirmation will be sent here.
                </p>
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl italic text-foreground">Shipping Address</h2>
            <div className="mt-6">
              <AddressFields prefix="shippingAddress" register={register} errors={errors} />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl italic text-foreground">Billing Address</h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="h-4 w-4 border-input accent-foreground"
                />
                Same as shipping
              </label>
            </div>
            {!sameAsShipping && (
              <div className="mt-6">
                <AddressFields prefix="billingAddress" register={register} errors={errors} />
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl italic text-foreground">Coupon</h2>
            <div className="mt-6">
              <CouponField
                subtotal={cart.subtotal}
                appliedCoupon={appliedCoupon}
                onApply={(coupon) => {
                  setAppliedCoupon(coupon);
                  setValue("couponCode", coupon.code);
                }}
                onRemove={() => {
                  setAppliedCoupon(null);
                  setValue("couponCode", "");
                }}
              />
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl italic text-foreground">
              Order Notes{" "}
              <span className="text-base font-normal not-italic text-foreground/40">(optional)</span>
            </h2>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Special instructions, gift messages…"
              className="mt-6 w-full resize-none border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </section>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-none">
            {isSubmitting ? "Redirecting to Payment…" : "Continue to Payment"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You will be redirected to Stripe to complete your payment securely.
          </p>
        </div>

        <OrderSummary cart={cart} totals={baseTotals} />
      </div>
    </form>
  );
}
