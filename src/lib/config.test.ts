import { afterEach, describe, expect, it } from "vitest";
import { getConfig } from "./config";

const originalEnv = { ...process.env };

describe("getConfig", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns required runtime settings without redaction", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@host:5432/paybook";
    process.env.PAYBOOK_PIN = "123456";
    process.env.PAYBOOK_SESSION_SECRET = "a".repeat(32);

    expect(getConfig()).toEqual({
      databaseUrl: "postgresql://user:pass@host:5432/paybook",
      paybookPin: "123456",
      sessionSecret: "a".repeat(32),
      isProduction: false
    });
  });

  it("requires database URL, PIN, and a strong session secret", () => {
    delete process.env.DATABASE_URL;
    process.env.PAYBOOK_PIN = "123456";
    process.env.PAYBOOK_SESSION_SECRET = "a".repeat(32);

    expect(() => getConfig()).toThrow("DATABASE_URL 환경변수가 필요합니다.");

    process.env.DATABASE_URL = "postgresql://user:pass@host:5432/paybook";
    process.env.PAYBOOK_PIN = "";

    expect(() => getConfig()).toThrow("PAYBOOK_PIN 환경변수가 필요합니다.");

    process.env.PAYBOOK_PIN = "123456";
    process.env.PAYBOOK_SESSION_SECRET = "short";

    expect(() => getConfig()).toThrow(
      "PAYBOOK_SESSION_SECRET은 32자 이상이어야 합니다."
    );
  });
});
