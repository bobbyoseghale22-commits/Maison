import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";
import { deleteProductImage } from "@/lib/cloudinary/upload";

/** DELETE /api/admin/cloudinary/delete — deletes a Cloudinary image by publicId. Admin-only. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = z.object({ publicId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "publicId is required." }, { status: 422 });
  }

  try {
    await deleteProductImage(parsed.data.publicId);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete image." }, { status: 500 });
  }
}
