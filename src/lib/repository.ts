import { ensureSchema, getPool, type Queryable } from "./db";
import { monthBounds } from "./month";
import type { Expense, ExpenseInput, Household, HouseholdInput, MonthlyData } from "./types";

type HouseholdRow = {
  person_a_name: string;
  person_b_name: string;
  created_at: string | Date;
};

type ExpenseRow = {
  id: string | number;
  spender: string;
  spent_on: string | Date;
  amount: number;
  purpose: string;
  created_at: string | Date;
};

function toDateKey(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return value.slice(0, 10);
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapHousehold(row: HouseholdRow): Household {
  return {
    personAName: row.person_a_name,
    personBName: row.person_b_name,
    createdAt: toIsoString(row.created_at)
  };
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: Number(row.id),
    spender: row.spender,
    spentOn: toDateKey(row.spent_on),
    amount: Number(row.amount),
    purpose: row.purpose,
    createdAt: toIsoString(row.created_at)
  };
}

export function createRepository(client: Queryable = getPool()) {
  async function ready(): Promise<void> {
    await ensureSchema(client);
  }

  return {
    async getHousehold(): Promise<Household | null> {
      await ready();
      const result = await client.query<HouseholdRow>(
        `SELECT person_a_name, person_b_name, created_at
         FROM household
         WHERE id = 1`
      );

      return result.rows[0] ? mapHousehold(result.rows[0]) : null;
    },

    async createHousehold(input: HouseholdInput): Promise<Household> {
      await ready();

      try {
        const result = await client.query<HouseholdRow>(
          `INSERT INTO household (id, person_a_name, person_b_name)
           VALUES (1, $1, $2)
           RETURNING person_a_name, person_b_name, created_at`,
          [input.personAName, input.personBName]
        );

        return mapHousehold(result.rows[0]);
      } catch (error) {
        const pgError = error as { code?: string };
        if (pgError.code === "23505") {
          throw new Error("이미 장부 설정이 완료되었습니다.");
        }
        throw error;
      }
    },

    async getMonthlyData(month: string): Promise<MonthlyData> {
      await ready();
      const household = await this.getHousehold();

      if (!household) {
        throw new Error("장부 설정이 필요합니다.");
      }

      const bounds = monthBounds(month);
      const result = await client.query<ExpenseRow>(
        `SELECT id, spender, spent_on, amount, purpose, created_at
         FROM expense
         WHERE spent_on >= $1 AND spent_on < $2
         ORDER BY spent_on DESC, created_at DESC, id DESC`,
        [bounds.start, bounds.endExclusive]
      );
      const expenses = result.rows.map(mapExpense);
      const byPerson: Record<string, number> = {
        [household.personAName]: 0,
        [household.personBName]: 0
      };
      let total = 0;

      for (const expense of expenses) {
        total += expense.amount;
        byPerson[expense.spender] = (byPerson[expense.spender] ?? 0) + expense.amount;
      }

      return {
        month,
        household,
        totals: { total, byPerson },
        suggestions: await this.getPurposeSuggestions(),
        expenses
      };
    },

    async createExpense(input: ExpenseInput): Promise<Expense> {
      await ready();
      const result = await client.query<ExpenseRow>(
        `INSERT INTO expense (spender, spent_on, amount, purpose)
         VALUES ($1, $2, $3, $4)
         RETURNING id, spender, spent_on, amount, purpose, created_at`,
        [input.spender, input.spentOn, input.amount, input.purpose]
      );

      return mapExpense(result.rows[0]);
    },

    async deleteExpense(id: number): Promise<void> {
      await ready();
      await client.query("DELETE FROM expense WHERE id = $1", [id]);
    },

    async getPurposeSuggestions(): Promise<string[]> {
      await ready();
      const result = await client.query<{ purpose: string }>(
        `SELECT purpose,
                COUNT(*) AS usage_count,
                MAX(created_at) AS last_used
         FROM expense
         GROUP BY purpose
         ORDER BY usage_count DESC, last_used DESC
         LIMIT 5`
      );

      return result.rows.slice(0, 5).map((row) => row.purpose);
    }
  };
}

export function getRepository() {
  return createRepository(getPool());
}
