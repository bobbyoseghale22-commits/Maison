import { NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";
import { getSignedUploadParams } from "@/lib/cloudinary/upload";

/** GET /api/admin/cloudinary/sign — returns a signed Cloudinary upload signature. Admin-only. */
export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
  const params = getSignedUploadParams();
  return NextResponse.json(params);
}
