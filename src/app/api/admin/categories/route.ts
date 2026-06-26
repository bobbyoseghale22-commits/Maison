import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
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
      sortOrder: parsed.data.sortOrder,
    });

    return NextResponse.json({ id: category._id.toString(), name: category.name }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/categories]", err);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
