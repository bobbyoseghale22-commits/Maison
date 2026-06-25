import type { Metadata } from "next";
import { getMyOrders } from "@/lib/data/orders";
import { OrderCard } from "@/components/orders/order-card";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const orders = await getMyOrders();

  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-label text-foreground/40">Account</p>
        <h1 className="mt-2 font-display text-4xl italic text-foreground sm:text-5xl">
          My Orders
        </h1>
      </div>

      <div className="mt-10 max-w-3xl">
        {orders.length === 0 ? (
          <div className="border border-dashed border-border py-20 text-center">
            <p className="font-display text-2xl italic text-foreground">No orders yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders you place will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                href={`/orders/${order.orderNumber}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
