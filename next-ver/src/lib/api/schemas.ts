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

// Single free-form tag (expenses only, mobile edit modal). Empty string clears it.
const tag = z.string().trim().max(32).nullish();

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
  tag,
});

/** PUT body for credits / expenses. */
export const mutationUpdateSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  amount,
  category: expenseCategory.optional(),
  tags,
  tag,
});

/** POST body for bills. `due_date` is a display string (e.g. '25 Jun'). */
export const billCreateSchema = z.object({
  currentMonth: month,
  name: z.string().min(1),
  amount,
  due_date: z.string().trim().max(32).optional(),
});

/** PATCH body for bills — toggle paid. */
export const billPatchSchema = z.object({
  id: z.string().min(1),
  paid: z.boolean(),
});

/**
 * POST body for an EMI. Expands into `months` installment rows on the bills ledger
 * (one per month from `currentMonth`), each of value `monthly`. `total` is the whole
 * loan amount, kept for display only (monthly × months may exceed it due to interest).
 */
export const emiCreateSchema = z.object({
  currentMonth: month,
  name: z.string().min(1),
  monthly: amount, // installment paid each month
  total: amount, // total loan amount (display only)
  months: z.coerce.number().int().min(1).max(120),
});

// Portfolio panel — manual reference data (no money-model effect; DECISIONS D15).
export const holdingKind = z.enum(["fd", "mutual_fund"]);

export const holdingCreateSchema = z.object({
  kind: holdingKind,
  name: z.string().min(1),
  current_value: amount,
  rate: amount.optional(),
  maturity_date: z.string().trim().max(32).optional(),
});

export const holdingUpdateSchema = holdingCreateSchema
  .partial()
  .extend({ id: z.string().min(1) });

export const sipCreateSchema = z.object({
  name: z.string().min(1),
  monthly: amount,
  due_date: z.string().trim().max(32).optional(),
  paid_total: amount.optional(),
});

export const sipUpdateSchema = sipCreateSchema
  .partial()
  .extend({ id: z.string().min(1) });

/** PUT body for the manual portfolio total. */
export const portfolioTotalSchema = z.object({ value: amount });

/**
 * POST body for signup. `openingBalance` is the one-time bank balance the user sets
 * at signup (D-A); optional + clamped ≥ 0, defaults to 0 if absent.
 */
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  openingBalance: amount
    .refine((n) => n >= 0, { message: "openingBalance must be ≥ 0" })
    .optional()
    .default(0),
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
