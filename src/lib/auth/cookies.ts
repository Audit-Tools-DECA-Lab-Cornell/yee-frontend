import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "yee-session";

/** Max-age of 7 days in seconds. */
const SESSION_MAX_AGE = 86400 * 7;

/**
 * Sets the HttpOnly session cookie on a NextResponse.
 * HttpOnly prevents client-side JS from reading the token (XSS protection).
 * Secure ensures it only travels over HTTPS in production.
 * SameSite=Lax blocks cross-site POST requests (CSRF mitigation).
 */
export function setSessionCookie(response: NextResponse, accessToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Expires the session cookie immediately. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Reads the session token from an incoming request.
 * Works in both middleware (NextRequest.cookies) and route handlers.
 */
export function getSessionToken(request: NextRequest | Request): string | null {
  // NextRequest exposes a typed .cookies API — use it when available.
  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    return (request as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
  // Fallback: parse the raw Cookie header for plain Request objects.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`).exec(cookieHeader);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
