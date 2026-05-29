"use client";

import { FormEvent, useMemo, useState } from "react";
import { getCurrentMonthKey, shiftMonth, todayDateKey } from "@/lib/month";
import type { MonthlyData } from "@/lib/types";
import { MobileDetailView } from "./MobileDetailView";

type DashboardProps = {
  initialData: MonthlyData;
};

function formatCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function Dashboard({ initialData }: DashboardProps) {
  const [data, setData] = useState(initialData);
  const [month, setMonth] = useState(initialData.month);
  const [spender, setSpender] = useState(initialData.household.personAName);
  const [spentOn, setSpentOn] = useState(todayDateKey());
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const people = useMemo(
    () => [data.household.personAName, data.household.personBName],
    [data.household.personAName, data.household.personBName]
  );

  async function loadMonth(nextMonth: string) {
    const response = await fetch(`/api/monthly?month=${nextMonth}`);
    if (!response.ok) {
      setError("월별 데이터를 불러오지 못했습니다.");
      return;
    }

    const nextData = (await response.json()) as MonthlyData;
    setData(nextData);
    setMonth(nextData.month);

    if (!people.includes(spender)) {
      setSpender(nextData.household.personAName);
    }
  }

  async function changeMonth(delta: number) {
    await loadMonth(shiftMonth(month, delta));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spender,
        spentOn,
        amount,
        purpose
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(body?.message ?? "지출 저장에 실패했습니다.");
      return;
    }

    setAmount("");
    setPurpose("");
    await loadMonth(month);
  }

  async function deleteExpense(id: number) {
    const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError("삭제에 실패했습니다.");
      return;
    }

    await loadMonth(month);
  }

  return (
    <main className="dashboard-page">
      {isDetailOpen ? (
        <MobileDetailView
          data={data}
          onClose={() => setIsDetailOpen(false)}
          onDelete={deleteExpense}
          onMonthChange={changeMonth}
        />
      ) : null}

      <section className="dashboard-shell">
        <header className="dashboard-hero">
          <nav>
            <strong>Paybook</strong>
            <button
              className="ghost-on-dark mobile-only"
              onClick={() => setIsDetailOpen(true)}
              type="button"
            >
              상세내역
            </button>
          </nav>
          <div className="hero-grid">
            <div>
              <p className="eyebrow">공동 생활비 기록</p>
              <h1>{month.replace("-", "년 ")}월</h1>
            </div>
            <div className="hero-total">
              <span>이번 달 합계</span>
              <strong>{formatCurrency(data.totals.total)}</strong>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="summary-grid">
            <section className="summary-card">
              <span>전체</span>
              <strong>{formatCurrency(data.totals.total)}</strong>
            </section>
            {people.map((person) => (
              <section className="summary-card" key={person}>
                <span>{person}</span>
                <strong>{formatCurrency(data.totals.byPerson[person] ?? 0)}</strong>
              </section>
            ))}
          </div>

          <form className="quick-form" onSubmit={submit}>
            <h2>지출 입력</h2>
            <div className="form-grid">
              <label>
                쓴 사람
                <div className="segmented">
                  {people.map((person) => (
                    <button
                      className={spender === person ? "active" : ""}
                      key={person}
                      onClick={() => setSpender(person)}
                      type="button"
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                날짜
                <input
                  type="date"
                  value={spentOn}
                  onChange={(event) => setSpentOn(event.target.value)}
                />
              </label>
              <label>
                금액
                <input
                  inputMode="numeric"
                  placeholder="38000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              <label className="purpose-field">
                용도
                <input
                  placeholder="이마트 장보기"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                />
              </label>
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "추가 중" : "추가"}
              </button>
            </div>
            <div className="suggestion-line">
              <span>최근/자주 쓴 용도</span>
              <div>
                {data.suggestions.map((suggestion) => (
                  <button
                    className={purpose === suggestion ? "active" : ""}
                    key={suggestion}
                    onClick={() => setPurpose(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>

          <section className="detail-panel desktop-only">
            <div className="detail-head">
              <h2>상세 내역</h2>
              <div className="month-actions">
                <button onClick={() => changeMonth(-1)} type="button">
                  이전 달
                </button>
                <button
                  onClick={() => loadMonth(getCurrentMonthKey())}
                  type="button"
                >
                  이번 달
                </button>
                <button onClick={() => changeMonth(1)} type="button">
                  다음 달
                </button>
              </div>
            </div>
            <div className="expense-list">
              {data.expenses.length === 0 ? (
                <p className="empty">이 달에는 아직 기록이 없습니다.</p>
              ) : (
                data.expenses.map((expense) => (
                  <div className="expense-row" key={expense.id}>
                    <span className="muted">{expense.spentOn.slice(5)}</span>
                    <strong>{expense.spender}</strong>
                    <span>{expense.purpose}</span>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <button onClick={() => deleteExpense(expense.id)} type="button">
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
