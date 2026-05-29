import { describe, expect, it } from "vitest";
import type { Queryable } from "./db";
import { createRepository } from "./repository";

type QueryCall = { text: string; values: unknown[] };

class FakeClient implements Queryable {
  calls: QueryCall[] = [];

  async query<T = Record<string, unknown>>(
    text: string,
    values: unknown[] = []
  ): Promise<{ rows: T[] }> {
    this.calls.push({ text, values });

    if (text.includes("FROM household")) {
      return {
        rows: [
          {
            person_a_name: "보근",
            person_b_name: "배우자",
            created_at: "2026-05-01T00:00:00.000Z"
          }
        ] as T[]
      };
    }

    if (text.includes("FROM expense") && text.includes("spent_on >=")) {
      return {
        rows: [
          {
            id: "1",
            spender: "보근",
            spent_on: new Date(2026, 4, 30),
            amount: 72000,
            purpose: "주유",
            created_at: "2026-05-30T09:00:00.000Z"
          },
          {
            id: "2",
            spender: "배우자",
            spent_on: "2026-05-29",
            amount: 38000,
            purpose: "장보기",
            created_at: "2026-05-29T09:00:00.000Z"
          }
        ] as T[]
      };
    }

    if (text.includes("GROUP BY purpose")) {
      return {
        rows: [
          { purpose: "장보기" },
          { purpose: "점심" },
          { purpose: "주유" },
          { purpose: "카페" },
          { purpose: "병원" },
          { purpose: "간식" }
        ] as T[]
      };
    }

    return { rows: [] as T[] };
  }
}

describe("repository", () => {
  it("loads monthly data with inclusive start and exclusive end", async () => {
    const client = new FakeClient();
    const repository = createRepository(client);

    const data = await repository.getMonthlyData("2026-05");

    const expenseCall = client.calls.find(
      (call) => call.text.includes("FROM expense") && call.text.includes("spent_on >=")
    );

    expect(expenseCall?.values).toEqual(["2026-05-01", "2026-06-01"]);
    expect(data.totals).toEqual({
      total: 110000,
      byPerson: {
        "보근": 72000,
        "배우자": 38000
      }
    });
    expect(data.expenses).toHaveLength(2);
    expect(data.expenses[0]?.spentOn).toBe("2026-05-30");
  });

  it("caps purpose suggestions at five", async () => {
    const client = new FakeClient();
    const repository = createRepository(client);

    await expect(repository.getPurposeSuggestions()).resolves.toEqual([
      "장보기",
      "점심",
      "주유",
      "카페",
      "병원"
    ]);

    const suggestionCall = client.calls.find((call) =>
      call.text.includes("GROUP BY purpose")
    );

    expect(suggestionCall?.text).toContain("ORDER BY usage_count DESC");
    expect(suggestionCall?.text).toContain("last_used DESC");
    expect(suggestionCall?.text).toContain("LIMIT 5");
  });
});
