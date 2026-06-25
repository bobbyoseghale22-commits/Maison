import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/**
 * Centralised API error handler for Route Handlers.
 *
 * Converts known error types to appropriate HTTP responses. For
 * unknown errors (true 500s) it logs the full error server-side but
 * returns a generic message to the client so internal details
 * (stack traces, file paths, MongoDB error codes) are never leaked.
 *
 * Usage:
 *   } catch (err) {
 *     return handleApiError(err, "[POST /api/checkout]");
 *   }
 */
export function handleApiError(
  err: unknown,
  context: string,
  options: { expose?: boolean } = {},
): NextResponse {
  // Auth errors
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }

  // Known client-safe application errors — safe to surface verbatim.
  // These come from domain logic in the data layer (not Mongoose/Node).
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  // Mongo duplicate key — don't expose the field name or index details.
  if (isDuplicateKeyError(err)) {
    return NextResponse.json(
      { error: "A record with these details already exists." },
      { status: 409 },
    );
  }

  // Unknown 500: log in full, return generic message
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${context}:`, err);

  // Only expose raw message in development; always generic in prod.
  const clientMessage =
    process.env.NODE_ENV === "development"
      ? message
      : "An unexpected error occurred. Please try again.";

  return NextResponse.json({ error: clientMessage }, { status: 500 });
}

/**
 * Application error with a client-safe message and HTTP status code.
 * Throw this from data-layer functions instead of plain `new Error()`
 * when the message is safe to send to the browser.
 *
 * @example
 *   throw new AppError("Coupon has expired.", 409);
 */
export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface MongoError {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is MongoError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as MongoError).code === 11000
  );
}
