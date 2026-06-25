import { NextResponse, type NextRequest } from "next/server";
import { adminGetOrders } from "@/lib/data/orders";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/** GET /api/admin/orders?page=1&status=pending */
export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  try {
    const result = await adminGetOrders(page, status);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
