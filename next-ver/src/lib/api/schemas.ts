import { z } from "zod";
import { NextResponse } from "next/server";

// Request schemas for API routes. Keep the 400 error shape from CONVENTIONS §6.

const month = z.string().min(1); // 'YYYY-MM-01'
const amount = z.coerce
  .number()
  .refine((n) => Number.isFinite(n), { message: "amount must be a number" });

// Free-form labels (expenses only, legacy). The form trims/dedupes/caps; the schema
// just bounds count + length so a bad client can't blow up a row.
const tags = z.array(z.string().trim().min(1).max(32)).max(20).optional();

/** Expense category enum (mobile redesign). Optional on the wire; defaults to 'other'. */
export const expenseCategory = z.enum([
  "food",
  "shopping",
  "transport",
  "health",
  "groceries",
  "other",
]);

/** POST body for credits / expenses / investments. `category` used by expenses only. */
export const mutationCreateSchema = z.object({
  currentMonth: month,
  description: z.string().min(1),
  amount,
  category: expenseCategory.optional(),
  tags,
});

/** PUT body for credits / expenses. */
export const mutationUpdateSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  amount,
  category: expenseCategory.optional(),
  tags,
});

/**
 * Parse `data` against `schema`. On failure, throws a 400 NextResponse
 * (caught by handleError, keeping the standard error shape). On success,
 * returns the typed, coerced data. Call inside the route's try block.
 */
export function validate<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }
  return result.data;
}
