import Stripe from "stripe";
import { env } from "@/config/env";

/**
 * Shared Stripe server client. Import this anywhere business logic
 * needs to talk to Stripe — never instantiate `new Stripe()` elsewhere,
 * so the API version stays consistent across the codebase.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  appInfo: {
    name: "ecommerce-app",
    version: "0.1.0",
  },
});

export default stripe;
