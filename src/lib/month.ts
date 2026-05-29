const HOUSEHOLD_TIME_ZONE = "Asia/Seoul";
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: HOUSEHOLD_TIME_ZONE,
  year: "numeric"
});

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function dateParts(date: Date): { year: string; month: string; day: string } {
  const parts = Object.fromEntries(
    dateKeyFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day
  };
}

export function getCurrentMonthKey(date = new Date()): string {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}`;
}

export function todayDateKey(date = new Date()): string {
  const parts = dateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isValidMonthKey(month: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return false;
  }

  const monthNumber = Number(month.slice(5, 7));
  return monthNumber >= 1 && monthNumber <= 12;
}

export function monthBounds(month: string): {
  start: string;
  endExclusive: string;
} {
  if (!isValidMonthKey(month)) {
    throw new Error("Invalid month key");
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);

  return {
    start: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-01`,
    endExclusive: `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-01`
  };
}

export function shiftMonth(month: string, delta: number): string {
  if (!isValidMonthKey(month)) {
    throw new Error("Invalid month key");
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const shifted = new Date(year, monthIndex + delta, 1);

  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}`;
}
