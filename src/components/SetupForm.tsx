"use client";

import { FormEvent, useState } from "react";

export function SetupForm() {
  const [personAName, setPersonAName] = useState("");
  const [personBName, setPersonBName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (personAName.trim() === personBName.trim()) {
      setError("두 사람의 이름은 서로 달라야 합니다.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personAName, personBName })
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(body?.message ?? "설정 저장에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">처음 설정</p>
        <h1>두 사람 이름을 입력하세요</h1>
        <p className="muted">이 이름은 지출 입력과 사람별 합계에 사용됩니다.</p>
        <label>
          첫 번째 사람
          <input
            value={personAName}
            onChange={(event) => setPersonAName(event.target.value)}
            placeholder="보근"
          />
        </label>
        <label>
          두 번째 사람
          <input
            value={personBName}
            onChange={(event) => setPersonBName(event.target.value)}
            placeholder="배우자"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button
          disabled={isSubmitting || !personAName.trim() || !personBName.trim()}
          type="submit"
        >
          {isSubmitting ? "저장 중" : "장부 시작"}
        </button>
      </form>
    </main>
  );
}
