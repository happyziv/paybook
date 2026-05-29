import { describe, expect, it } from "vitest";
import {
  ValidationError,
  parseExpenseInput,
  parseHouseholdInput,
  parseMonthQuery,
  parsePinInput
} from "./validation";

describe("validation helpers", () => {
  it("trims and validates household names", () => {
    expect(
      parseHouseholdInput({ personAName: " 보근 ", personBName: " 배우자 " })
    ).toEqual({ personAName: "보근", personBName: "배우자" });
  });

  it("rejects empty or duplicate household names", () => {
    expect(() =>
      parseHouseholdInput({ personAName: "", personBName: "배우자" })
    ).toThrow(ValidationError);
    expect(() =>
      parseHouseholdInput({ personAName: "보근", personBName: "보근" })
    ).toThrow("두 사람의 이름은 서로 달라야 합니다.");
  });

  it("trims and validates PIN input", () => {
    expect(parsePinInput({ pin: " 123456 " })).toEqual({ pin: "123456" });
    expect(() => parsePinInput({ pin: "" })).toThrow("PIN을 입력해 주세요.");
  });

  it("validates expense input against household names", () => {
    expect(
      parseExpenseInput(
        {
          spender: "배우자",
          spentOn: "2026-05-30",
          amount: "38000",
          purpose: " 이마트 장보기 "
        },
        ["보근", "배우자"]
      )
    ).toEqual({
      spender: "배우자",
      spentOn: "2026-05-30",
      amount: 38000,
      purpose: "이마트 장보기"
    });
  });

  it("rejects invalid expense values", () => {
    expect(() =>
      parseExpenseInput(
        { spender: "누구", spentOn: "2026-05-30", amount: 1, purpose: "점심" },
        ["보근", "배우자"]
      )
    ).toThrow("쓴 사람을 선택해 주세요.");
    expect(() =>
      parseExpenseInput(
        { spender: "보근", spentOn: "2026/05/30", amount: 1, purpose: "점심" },
        ["보근", "배우자"]
      )
    ).toThrow("날짜 형식이 올바르지 않습니다.");
    expect(() =>
      parseExpenseInput(
        { spender: "보근", spentOn: "2026-02-31", amount: 1, purpose: "점심" },
        ["보근", "배우자"]
      )
    ).toThrow("날짜 형식이 올바르지 않습니다.");
    expect(() =>
      parseExpenseInput(
        { spender: "보근", spentOn: "2026-05-30", amount: 0, purpose: "점심" },
        ["보근", "배우자"]
      )
    ).toThrow("금액은 1원 이상이어야 합니다.");
    expect(() =>
      parseExpenseInput(
        {
          spender: "보근",
          spentOn: "2026-05-30",
          amount: "3000000000",
          purpose: "점심"
        },
        ["보근", "배우자"]
      )
    ).toThrow("2,147,483,647원");
    expect(() =>
      parseExpenseInput(
        { spender: "보근", spentOn: "2026-05-30", amount: 1, purpose: "" },
        ["보근", "배우자"]
      )
    ).toThrow("용도를 입력해 주세요.");
  });

  it("validates month query", () => {
    expect(parseMonthQuery("2026-05")).toBe("2026-05");
    expect(() => parseMonthQuery("2026-13")).toThrow(
      "월 형식이 올바르지 않습니다."
    );
  });
});
