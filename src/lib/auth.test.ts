import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  isPinValid,
  serializeSessionCookie,
  verifySessionToken
} from "./auth";

const secret = "s".repeat(32);

describe("auth helpers", () => {
  it("validates matching PINs and rejects wrong PINs", () => {
    expect(isPinValid("123456", "123456")).toBe(true);
    expect(isPinValid("000000", "123456")).toBe(false);
  });

  it("creates and verifies signed session tokens", () => {
    const token = createSessionToken(secret, 1_000);

    expect(verifySessionToken(token, secret, 1_000)).toBe(true);
  });

  it("rejects tampered or expired session tokens", () => {
    const token = createSessionToken(secret, 1_000);
    const tampered = token.replace("v1.", "v1x.");

    expect(verifySessionToken(tampered, secret, 1_000)).toBe(false);
    expect(verifySessionToken(token, secret, 1_000 + 31 * 24 * 60 * 60 * 1000)).toBe(
      false
    );
  });

  it("serializes secure production cookies", () => {
    const token = createSessionToken(secret, 1_000);

    expect(serializeSessionCookie(token, true)).toContain("Secure");
    expect(serializeSessionCookie(token, true)).toContain("HttpOnly");
    expect(serializeSessionCookie(token, true)).toContain("SameSite=Lax");
    expect(serializeSessionCookie(token, false)).not.toContain("Secure");
  });
});
