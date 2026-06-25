import { NextResponse } from "next/server";
import { getMyOrder } from "@/lib/data/orders";
import { UnauthorizedError } from "@/lib/auth/utils";

/** GET /api/orders/[orderNumber] — single order for authenticated customer */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  try {
    const order = await getMyOrder(orderNumber);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}
