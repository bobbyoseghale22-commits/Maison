"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HomepageToggleProps {
  id: string;
  showOnHomepage: boolean;
}

export function HomepageToggle({ id, showOnHomepage: initial }: HomepageToggleProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  async function toggle() {
    setLoading(true);
    const next = !value;
    setValue(next); // optimistic

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, showOnHomepage: next }),
      });

      if (!res.ok) {
        setValue(!next); // roll back
        toast.error("Failed to update homepage visibility.");
      } else {
        router.refresh();
      }
    } catch {
      setValue(!next);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={value}
      aria-label={value ? "Remove from homepage" : "Show on homepage"}
      className={`text-label transition-colors disabled:opacity-40 ${
        value ? "text-foreground" : "text-foreground/30 hover:text-foreground/60"
      }`}
    >
      {value ? "Visible" : "Hidden"}
    </button>
  );
}
