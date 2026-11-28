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
const EXPECTED_ART_MS = 16000;

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
  const artPct = painting.status === "done" ? 1 : Math.min(0.95, elapsed / EXPECTED_ART_MS);
  const percent = Math.round((judgePct * 0.25 + artPct * 0.65 + (catalogDone ? 0.1 : 0)) * 100);

  const steps: { label: string; state: "done" | "active" | "waiting" | "error"; error?: string }[] = [
    { label: "원본 분석", state: judge.status === "done" ? "done" : judge.status === "error" ? "error" : "active", error: judge.status === "error" ? judge.error : undefined },
    {
      label: `${style.name} 그림 제작`,
      state: painting.status === "done" ? "done" : painting.status === "error" ? "error" : "active",
      error: painting.status === "error" ? painting.error : undefined,
    },
    { label: "경매 도록 작성", state: catalogDone ? "done" : bothDone ? "active" : "waiting" },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mx-auto w-fit rounded-full bg-yellow px-3 py-1 text-xs font-semibold">🔍 감정실</p>
      <Headline className="mt-4 text-4xl sm:text-6xl">
        천재성 <span className="text-primary">감정 중</span>
      </Headline>
      <p key={quote} className="mt-4 text-center text-muted animate-rise sm:text-lg">
        {QUOTES[quote]}
      </p>

      <div className="mt-12 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr_1fr] md:gap-6">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the canvas */}
          <img src={doodle} alt="출품한 낙서" className="mx-auto aspect-square w-full max-w-60 rounded-2xl border-2 border-ink bg-white object-cover shadow-[5px_5px_0_var(--sky)] md:max-w-none" />
          <figcaption className="eyebrow mt-3 text-center">Original</figcaption>
        </figure>
        <span className="hidden font-accent text-4xl text-primary italic md:block" aria-hidden>
          →
        </span>
        <figure>
          <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-2xl border-2 border-ink bg-surface md:max-w-none" style={{ boxShadow: `5px 5px 0 ${style.color}` }}>
            {/* The doodle melts into a blur while the painting is made; the finished work arrives still veiled. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the canvas */}
            <img
              src={doodle}
              alt=""
              className="absolute inset-0 size-full object-cover transition-[filter,opacity,transform] duration-700"
              style={{
                filter: `blur(${(2 + artPct * 14).toFixed(1)}px) saturate(${1 + artPct})`,
                transform: `scale(${1 + artPct * 0.12})`,
                opacity: painting.status === "done" ? 0 : 1,
              }}
            />
            <span className="absolute inset-0 mix-blend-multiply transition-opacity duration-700" style={{ backgroundColor: style.color, opacity: painting.status === "done" ? 0 : 0.15 + artPct * 0.35 }} aria-hidden />
            {painting.status === "done" && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from the API
              <img src={painting.data.image} alt={`${style.name} 작품 (경매장에서 공개)`} className="absolute inset-0 size-full scale-110 object-cover animate-unveil" />
            )}
            {painting.status !== "done" && painting.status !== "error" && <span className="absolute inset-0 animate-sweep bg-[linear-gradient(110deg,transparent_35%,rgb(255_255_255/0.55)_50%,transparent_65%)]" aria-hidden />}
            <span className="absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm">
                {painting.status === "done" ? "✨ 완성! 경매장에서 공개돼요" : painting.status === "error" ? "변환 실패" : `${style.name} 그림으로 바꾸는 중… ${Math.round(artPct * 100)}%`}
              </span>
            </span>
          </div>
          <figcaption key={fact} className="mt-3 min-h-10 text-center text-xs leading-relaxed text-pretty text-muted animate-rise">
            <span className="eyebrow block">{style.en}</span>
            {painting.status !== "done" && style.facts[fact]}
          </figcaption>
        </figure>

        <ol className="flex flex-col border-t border-line">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 border-b border-line py-4">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full font-accent text-base italic ${s.state === "waiting" ? "bg-surface text-muted" : s.state === "done" ? "bg-mint" : s.state === "error" ? "bg-accent-soft" : "bg-yellow"}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] ${s.state === "waiting" ? "text-muted" : "font-medium"}`}>{s.label}</p>
                {s.error && <p className="mt-0.5 text-xs text-accent">{s.error}</p>}
              </div>
              <StepIcon state={s.state} />
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-14 flex items-center gap-5">
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-card">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <span className="w-16 text-right text-2xl font-semibold text-primary tabular-nums">{percent}%</span>
      </div>

      {failed && (
        <div className="mt-8 flex justify-center">
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
      <span className="text-sm font-semibold text-primary" aria-label="완료">
        완료
      </span>
    );
  if (state === "active") return <span className="size-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-label="진행 중" />;
  if (state === "error")
    return (
      <span className="text-sm font-semibold text-accent" aria-label="실패">
        실패
      </span>
    );
  return <span className="text-sm text-muted/60">대기</span>;
}
