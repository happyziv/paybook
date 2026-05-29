import { describe, expect, it, vi } from "vitest";
import type { Queryable } from "./db";

class FlakyClient implements Queryable {
  calls = 0;

  async query<T = Record<string, unknown>>(): Promise<{ rows: T[] }> {
    this.calls += 1;

    if (this.calls === 1) {
      throw new Error("temporary database failure");
    }

    return { rows: [] as T[] };
  }
}

describe("ensureSchema", () => {
  it("retries schema creation after a transient failure", async () => {
    vi.resetModules();
    const { ensureSchema } = await import("./db");
    const client = new FlakyClient();

    await expect(ensureSchema(client)).rejects.toThrow(
      "temporary database failure"
    );
    await expect(ensureSchema(client)).resolves.toBeUndefined();
    expect(client.calls).toBe(5);
  });
});
