"use client";

import { FormEvent, useState } from "react";

export function PinGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(body?.message ?? "PIN 확인에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Paybook</p>
        <h1>공동가계부 PIN</h1>
        <p className="muted">가족끼리 공유한 PIN을 입력해 장부를 엽니다.</p>
        <label>
          PIN
          <input
            autoFocus
            inputMode="numeric"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="123456"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button disabled={isSubmitting || !pin.trim()} type="submit">
          {isSubmitting ? "확인 중" : "들어가기"}
        </button>
      </form>
    </main>
  );
}
