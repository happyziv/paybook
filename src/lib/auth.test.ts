import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  isPinValid,
  serializeSessionCookie,
  shouldUseSecureCookie,
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

  it("does not require secure cookies for direct HTTP production access", () => {
    const request = new Request("http://192.168.50.102:3000/api/auth/pin");

    expect(shouldUseSecureCookie(request, true)).toBe(false);
  });

  it("does not require secure cookies for direct HTTP LAN hostnames", () => {
    expect(
      shouldUseSecureCookie(
        new Request("http://paybook.local:3000/api/auth/pin"),
        true
      )
    ).toBe(false);
    expect(
      shouldUseSecureCookie(new Request("http://paybook:3000/api/auth/pin"), true)
    ).toBe(false);
  });

  it("uses secure cookies for HTTPS production access", () => {
    const request = new Request("https://paybook.example.com/api/auth/pin");

    expect(shouldUseSecureCookie(request, true)).toBe(true);
  });

  it("keeps secure cookies for production proxy hosts without forwarded proto", () => {
    const request = new Request("http://paybook.example.com/api/auth/pin");

    expect(shouldUseSecureCookie(request, true)).toBe(true);
  });

  it("uses secure cookies when a reverse proxy forwards HTTPS", () => {
    const request = new Request("http://paybook:3000/api/auth/pin", {
      headers: { "x-forwarded-proto": "https" }
    });

    expect(shouldUseSecureCookie(request, true)).toBe(true);
  });

  it("keeps secure cookies for public hosts that forward HTTP", () => {
    const request = new Request("http://paybook.example.com/api/auth/pin", {
      headers: { "x-forwarded-proto": "http" }
    });

    expect(shouldUseSecureCookie(request, true)).toBe(true);
  });
});
