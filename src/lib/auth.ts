import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getConfig } from "./config";

export const SESSION_COOKIE_NAME = "paybook_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqualText(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function isPinValid(inputPin: string, expectedPin: string): boolean {
  return timingSafeEqualText(inputPin, expectedPin);
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const signature = sign(payload, secret);

  return `v1.${payload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now()
): boolean {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return false;
  }

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  return timingSafeEqualText(parts[2], sign(parts[1], secret));
}

export function serializeSessionCookie(
  token: string,
  isProduction: boolean
): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ];

  if (isProduction) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export async function hasValidSession(): Promise<boolean> {
  const config = getConfig();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token, config.sessionSecret);
}
