import { NextResponse } from "next/server";
import { getMyOrders } from "@/lib/data/orders";
import { UnauthorizedError } from "@/lib/auth/utils";

/** GET /api/orders — authenticated customer's order history */
export async function GET() {
  try {
    const orders = await getMyOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[GET /api/orders]", err);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
