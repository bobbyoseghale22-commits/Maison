import { z } from "zod";

/**
 * Auth-related Zod schemas, following the same validate-at-the-boundary
 * pattern as `src/config/env.ts`. These run both in the Credentials
 * provider's `authorize()` callback and in the registration server
 * action, so malformed input is rejected before it ever reaches
 * Mongoose or bcrypt.
 */

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters") // bcrypt's hard limit
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Subset of `registerSchema` actually persisted (no `confirmPassword`). */
export const createUserSchema = registerSchema.innerType().omit({
  confirmPassword: true,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
