"use client";

import type { MonthlyData } from "@/lib/types";

type MobileDetailViewProps = {
  data: MonthlyData;
  onClose: () => void;
  onDelete: (id: number) => void;
  onMonthChange: (delta: number) => void;
};

function formatCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function MobileDetailView({
  data,
  onClose,
  onDelete,
  onMonthChange
}: MobileDetailViewProps) {
  return (
    <div className="mobile-detail">
      <header className="mobile-detail__header">
        <div>
          <p className="eyebrow">상세내역</p>
          <h1>월별 지출</h1>
        </div>
        <button className="ghost-on-dark" onClick={onClose} type="button">
          닫기
        </button>
      </header>

      <div className="mobile-detail__body">
        <div className="month-picker">
          <button onClick={() => onMonthChange(-1)} type="button">
            이전
          </button>
          <strong>{data.month}</strong>
          <button onClick={() => onMonthChange(1)} type="button">
            다음
          </button>
        </div>

        <section className="summary-card summary-card--full">
          <span>월 합계</span>
          <strong>{formatCurrency(data.totals.total)}</strong>
        </section>

        <div className="expense-list expense-list--mobile">
          {data.expenses.length === 0 ? (
            <p className="empty">이 달에는 아직 기록이 없습니다.</p>
          ) : (
            data.expenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <span className="muted">{expense.spentOn.slice(5)}</span>
                <div>
                  <strong>{expense.spender}</strong>
                  <p>{expense.purpose}</p>
                </div>
                <div className="expense-row__amount">
                  <strong>{formatCurrency(expense.amount)}</strong>
                  <button onClick={() => onDelete(expense.id)} type="button">
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
