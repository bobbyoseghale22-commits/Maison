"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

/**
 * Isolated client island for the delete action — keeps the edit page
 * server-rendered. Shows a confirm dialog (native `window.confirm`)
 * before firing the DELETE request, then redirects to the products list.
 */
export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete "${productName}"?\n\nThis also removes all Cloudinary images and cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const d = await res.json() as { error?: string };
          toast.error(d.error ?? "Failed to delete product.");
          return;
        }

        toast.success(`"${productName}" deleted.`);
        router.push("/admin/products");
        router.refresh();
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="gap-2 rounded-none text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "Deleting…" : "Delete Product"}
    </Button>
  );
}
