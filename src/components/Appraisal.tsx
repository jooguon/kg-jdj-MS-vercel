"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { ArtStyle } from "@/lib/styles";
import { btn, Headline, useCycle } from "./ui";

export type Async<T> = { status: "pending" } | { status: "done"; data: T } | { status: "error"; error: string };

const QUOTES = [
  "붓터치에서 자본주의의 고독을 분석 중…",
  "선의 떨림에서 작가의 마감 압박을 감지했습니다…",
  "여백이 너무 많아 감정사가 숨을 고르는 중…",
  "15초의 절박함을 미술사적으로 해석하는 중…",
  "이 획, 어디서 본 듯한데… 도록을 뒤지는 중…",
];

// Rough durations used to animate the progress bar.
const EXPECTED_JUDGE_MS = 5000;
const EXPECTED_PAINT_MS = 16000;

export function Appraisal({
  doodle,
  style,
  judge,
  painting,
  onRetry,
  onDone,
}: {
  doodle: string;
  style: ArtStyle;
  judge: Async<unknown>;
  painting: Async<{ image: string }>;
  onRetry: () => void;
  onDone: () => void;
}) {
  const [started] = useState(() => performance.now());
  const [elapsed, setElapsed] = useState(0);
  const quote = useCycle(QUOTES.length, 2600);
  const fact = useCycle(style.facts.length, 5000);

  const bothDone = judge.status === "done" && painting.status === "done";
  const failed = judge.status === "error" || painting.status === "error";
  const [catalogDone, setCatalogDone] = useState(false);

  useEffect(() => {
    if (bothDone || failed) return;
    const id = setInterval(() => setElapsed(performance.now() - started), 200);
    return () => clearInterval(id);
  }, [bothDone, failed, started]);

  const finish = useEffectEvent(onDone);
  useEffect(() => {
    if (!bothDone) return;
    const a = setTimeout(() => setCatalogDone(true), 900);
    const b = setTimeout(() => finish(), 1700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [bothDone]);

  const judgePct = judge.status === "done" ? 1 : Math.min(0.95, elapsed / EXPECTED_JUDGE_MS);
  const paintPct = painting.status === "done" ? 1 : Math.min(0.95, elapsed / EXPECTED_PAINT_MS);
  const percent = Math.round((judgePct * 0.25 + paintPct * 0.65 + (catalogDone ? 0.1 : 0)) * 100);

  const steps: { label: string; state: "done" | "active" | "waiting" | "error"; error?: string }[] = [
    {
      label: "원본 분석",
      state: judge.status === "done" ? "done" : judge.status === "error" ? "error" : "active",
      error: judge.status === "error" ? judge.error : undefined,
    },
    {
      label: "명화 복원",
      state: painting.status === "done" ? "done" : painting.status === "error" ? "error" : "active",
      error: painting.status === "error" ? painting.error : undefined,
    },
    { label: "경매 도록 작성", state: catalogDone ? "done" : bothDone ? "active" : "waiting" },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Headline className="text-3xl sm:text-5xl">천재성 감정 중</Headline>
      <p key={quote} className="mt-3 text-center font-serif text-muted animate-rise sm:text-lg">
        “{QUOTES[quote]}”
      </p>

      <div className="mt-8 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr_1.1fr] md:gap-5">
        <div className="mx-auto w-full max-w-60 overflow-hidden rounded-2xl border border-line bg-white shadow-soft md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the canvas */}
          <img src={doodle} alt="출품한 낙서" className="aspect-square w-full object-cover" />
        </div>
        <span className="hidden text-2xl tracking-[-0.2em] text-muted md:block" aria-hidden>
          ›››
        </span>
        <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:max-w-none">
          {painting.status === "done" ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from the API
            <img src={painting.data.image} alt={`${style.name} 명화`} className="size-full object-cover animate-rise" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- preview while waiting */}
              <img src={`/samples/${style.id}.webp`} alt="" className="size-full scale-110 object-cover opacity-50 blur-xl" />
              <p key={fact} className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-pretty text-ink/80 animate-rise">
                {style.facts[fact]}
              </p>
            </>
          )}
        </div>

        <ul className="flex flex-col gap-2.5">
          {steps.map((s) => (
            <li
              key={s.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition ${
                s.state === "active" ? "border-accent/20 bg-accent-soft" : s.state === "error" ? "border-accent/40 bg-card" : "border-line bg-card"
              }`}
            >
              <StepIcon state={s.state} />
              <div className="min-w-0">
                <p className={`font-medium ${s.state === "waiting" ? "text-muted" : ""}`}>
                  {s.label} {s.state === "done" ? "완료" : s.state === "active" ? "중" : s.state === "error" ? "실패" : ""}
                </p>
                {s.error && <p className="mt-0.5 text-xs text-accent">{s.error}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <span className="w-14 text-right font-serif text-2xl font-black tabular-nums">{percent}%</span>
      </div>

      {failed && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onRetry} className={btn.primary}>
            다시 감정 맡기기
          </button>
        </div>
      )}
    </section>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "waiting" | "error" }) {
  if (state === "done")
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm text-white" aria-hidden>
        ✓
      </span>
    );
  if (state === "active") return <span className="size-7 shrink-0 animate-spin rounded-full border-[3px] border-dotted border-accent" aria-hidden />;
  if (state === "error")
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm text-accent" aria-hidden>
        !
      </span>
    );
  return <span className="size-7 shrink-0 rounded-full border-2 border-line" aria-hidden />;
}
