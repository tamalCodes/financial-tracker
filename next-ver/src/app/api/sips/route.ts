import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { sipCreateSchema, sipUpdateSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// Portfolio reference — Active SIPs. Manual, static (not cumulative), display-only;
// no money-model effect (DECISIONS D15). Conventions: CONVENTIONS §1–§7.
const SELECT = "id, name, monthly, due_date, paid_total, created_at";

export async function GET(request: Request) {
  const limit = rateLimit(request, "sips:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data, error } = await supabase
      .from("sips")
      .select(SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return handleError(error, 500);
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(request, "sips:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { name, monthly, due_date, paid_total } = validate(
      sipCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("sips")
      .insert({
        user_id: userId,
        name,
        monthly,
        due_date: due_date ?? null,
        paid_total: paid_total ?? 0,
      })
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: inserted });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  const limit = rateLimit(request, "sips:put", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { id, ...fields } = validate(sipUpdateSchema, await request.json());

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: updated, error } = await supabase
      .from("sips")
      .update(fields)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!updated) {
      return NextResponse.json({ error: "SIP not found." }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimit(request, "sips:delete", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { error } = await supabase
      .from("sips")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
