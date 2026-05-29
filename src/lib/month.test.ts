import { describe, expect, it } from "vitest";
import {
  getCurrentMonthKey,
  isValidMonthKey,
  monthBounds,
  shiftMonth,
  todayDateKey
} from "./month";

describe("month helpers", () => {
  it("formats the current month as YYYY-MM", () => {
    expect(getCurrentMonthKey(new Date(2026, 4, 30))).toBe("2026-05");
    expect(getCurrentMonthKey(new Date("2026-05-31T15:30:00.000Z"))).toBe(
      "2026-06"
    );
  });

  it("formats today's date as YYYY-MM-DD", () => {
    expect(todayDateKey(new Date(2026, 4, 3))).toBe("2026-05-03");
    expect(todayDateKey(new Date("2026-05-31T15:30:00.000Z"))).toBe(
      "2026-06-01"
    );
  });

  it("validates real month keys only", () => {
    expect(isValidMonthKey("2026-05")).toBe(true);
    expect(isValidMonthKey("2026-00")).toBe(false);
    expect(isValidMonthKey("2026-13")).toBe(false);
    expect(isValidMonthKey("26-05")).toBe(false);
  });

  it("returns inclusive start and exclusive next-month end", () => {
    expect(monthBounds("2026-05")).toEqual({
      start: "2026-05-01",
      endExclusive: "2026-06-01"
    });
  });

  it("shifts month keys across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
