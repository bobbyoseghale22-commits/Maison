"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminCategoryRow } from "@/lib/data/admin";

interface CategoryFormProps {
  categories: AdminCategoryRow[];
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryForm({ categories }: CategoryFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parent, setParent] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [error, setError] = React.useState("");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    setSlug(toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          parent: parent || undefined,
          isActive,
          sortOrder,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create category.");
        return;
      }

      toast.success(`Category "${data.name}" created.`);
      setOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      setParent("");
      setSortOrder(0);
      setIsActive(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-none";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        + New Category
      </button>
    );
  }

  return (
    <div className="border border-border p-6 max-w-lg">
      <h2 className="font-display text-xl italic mb-6">New Category</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Outerwear"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Slug <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. outerwear"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Parent Category
          </label>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className={inputCls}
          >
            <option value="">None (top-level)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description…"
            rows={3}
            maxLength={500}
            className={inputCls}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-foreground/60 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputCls}
            />
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Category"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
