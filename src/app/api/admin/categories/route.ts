import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models";
import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth/utils";

const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  description: z.string().max(500).optional(),
  parent: z.string().optional(),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    await connectToDatabase();

    const existing = await Category.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    }

    const category = await Category.create({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? undefined,
      parent: parsed.data.parent || null,
      isActive: parsed.data.isActive,
      showOnHomepage: parsed.data.showOnHomepage,
      sortOrder: parsed.data.sortOrder,
    });

    revalidatePath("/", "layout");

    return NextResponse.json({ id: (category._id as { toString(): string }).toString(), name: category.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/categories]", err);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}

const updateCategorySchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const { id, ...updates } = parsed.data;
    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ id: (category._id as { toString(): string }).toString() });
  } catch (err) {
    console.error("[PATCH /api/admin/categories]", err);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

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
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = z.object({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Category ID is required." }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const deleted = await Category.findByIdAndDelete(parsed.data.id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/categories]", err);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
