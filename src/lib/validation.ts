import { isValidMonthKey } from "./month";
import type { ExpenseInput, HouseholdInput } from "./types";

const POSTGRES_INTEGER_MAX = 2_147_483_647;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseHouseholdInput(input: unknown): HouseholdInput {
  const record = input as Record<string, unknown>;
  const personAName = asTrimmedString(record?.personAName);
  const personBName = asTrimmedString(record?.personBName);

  if (!personAName || !personBName) {
    throw new ValidationError("두 사람의 이름을 모두 입력해 주세요.");
  }

  if (personAName === personBName) {
    throw new ValidationError("두 사람의 이름은 서로 달라야 합니다.");
  }

  return { personAName, personBName };
}

export function parsePinInput(input: unknown): { pin: string } {
  const record = input as Record<string, unknown>;
  const pin = asTrimmedString(record?.pin);

  if (!pin) {
    throw new ValidationError("PIN을 입력해 주세요.");
  }

  return { pin };
}

export function parseExpenseInput(
  input: unknown,
  allowedSpenders: string[]
): ExpenseInput {
  const record = input as Record<string, unknown>;
  const spender = asTrimmedString(record?.spender);
  const spentOn = asTrimmedString(record?.spentOn);
  const rawAmount = record?.amount;
  const purpose = asTrimmedString(record?.purpose);
  const amount =
    typeof rawAmount === "number"
      ? rawAmount
      : Number(String(rawAmount ?? "").replaceAll(",", ""));

  if (!allowedSpenders.includes(spender)) {
    throw new ValidationError("쓴 사람을 선택해 주세요.");
  }

  if (!isValidDateKey(spentOn)) {
    throw new ValidationError("날짜 형식이 올바르지 않습니다.");
  }

  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > POSTGRES_INTEGER_MAX
  ) {
    throw new ValidationError(
      "금액은 1원 이상이어야 합니다. 최대 2,147,483,647원까지 입력할 수 있습니다."
    );
  }

  if (!purpose) {
    throw new ValidationError("용도를 입력해 주세요.");
  }

  return { spender, spentOn, amount, purpose };
}

export function parseMonthQuery(month: unknown): string {
  const value = asTrimmedString(month);

  if (!isValidMonthKey(value)) {
    throw new ValidationError("월 형식이 올바르지 않습니다.");
  }

  return value;
}
