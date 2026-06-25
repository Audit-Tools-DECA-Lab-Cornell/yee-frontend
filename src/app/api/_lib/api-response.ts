import { NextResponse } from "next/server";

export type ApiError = { error: string; status: number };

/** Returns a JSON error response without leaking internal details. */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
