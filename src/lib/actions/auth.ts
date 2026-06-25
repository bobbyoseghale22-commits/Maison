"use server";

import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import {
  createUserSchema,
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";
import { sanitizeText } from "@/lib/security/sanitize";

const SALT_ROUNDS = 12;

export interface RegisterResult {
  success: boolean;
  /** Field-level error messages, keyed by field name (e.g. for form display). */
  errors?: Partial<Record<keyof RegisterInput, string[]>>;
  /** Top-level error not tied to a specific field (e.g. "email taken"). */
  message?: string;
}

/**
 * Registers a new customer account with a locally-hashed password.
 * Returns a discriminated result instead of throwing, so the calling
 * form can render field-level errors without a try/catch.
 *
 * Intentionally does not sign the user in — call `signIn("credentials", ...)`
 * client-side after a successful result, consistent with keeping
 * Auth.js session creation in one place (`src/lib/auth/index.ts`).
 */
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name: rawName, email, password } = createUserSchema.parse(parsed.data);

  // Strip any HTML from the display name before persisting.
  const name = sanitizeText(rawName, 100);

  await connectToDatabase();

  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    return {
      success: false,
      message: "An account with this email already exists.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "customer",
  });

  return { success: true };
}
