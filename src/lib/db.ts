import { Pool } from "pg";
import { getConfig } from "./config";

export type Queryable = {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: T[] }>;
};

let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getConfig().databaseUrl });
  }

  return pool;
}

export async function ensureSchema(client: Queryable = getPool()): Promise<void> {
  if (!schemaPromise) {
    const nextSchemaPromise = (async () => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS household (
          id integer PRIMARY KEY CHECK (id = 1),
          person_a_name text NOT NULL,
          person_b_name text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS expense (
          id bigserial PRIMARY KEY,
          spender text NOT NULL,
          spent_on date NOT NULL,
          amount integer NOT NULL CHECK (amount > 0),
          purpose text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await client.query(
        "CREATE INDEX IF NOT EXISTS expense_spent_on_idx ON expense (spent_on DESC)"
      );
      await client.query(
        "CREATE INDEX IF NOT EXISTS expense_purpose_idx ON expense (purpose)"
      );
    })().catch((error) => {
      if (schemaPromise === nextSchemaPromise) {
        schemaPromise = null;
      }

      throw error;
    });

    schemaPromise = nextSchemaPromise;
  }

  return schemaPromise;
}
