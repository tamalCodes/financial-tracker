import { NextResponse } from "next/server";

/** 429 response with a Retry-After header. Use when rateLimit() returns !ok. */
export const tooManyRequests = (resetMs: number) =>
  NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
  );

/**
 * Map a thrown error to a JSON response. Re-returns a thrown NextResponse
 * verbatim (e.g. the 401 from requireUser); otherwise 400 with the message.
 * Pass `fallbackStatus: 500` for read endpoints that shouldn't mask server errors as 400.
 */
export const handleError = (error: unknown, fallbackStatus = 400) => {
  if (error instanceof NextResponse) return error;
  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
};
