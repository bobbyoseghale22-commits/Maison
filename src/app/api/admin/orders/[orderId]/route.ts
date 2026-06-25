import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ORDER_STATUSES } from "@/models/types";
import { adminGetOrder, adminUpdateOrderStatus } from "@/lib/data/orders";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

/** GET /api/admin/orders/[orderId] */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  try {
    const order = await adminGetOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/** PATCH /api/admin/orders/[orderId] — update order status */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status." },
      { status: 422 },
    );
  }

  try {
    await adminUpdateOrderStatus(orderId, parsed.data.status);
    return NextResponse.json({ updated: true });
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
