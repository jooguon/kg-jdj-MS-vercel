"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ART_STYLES, type ArtStyle } from "@/lib/styles";
import { INKS, todayTrend, type DoodleStats } from "@/lib/trends";
import { DrawingCanvas, type CanvasHandle, type CanvasInfo } from "./DrawingCanvas";
import { btn, Headline } from "./ui";

export const DRAW_SECONDS = 15;

const ERASER = "#ffffff";
const BRUSHES = [
  { name: "가는 붓", value: 10 },
  { name: "굵은 붓", value: 28 },
];

// Capped by viewport height so the whole studio fits on a laptop screen.
const CANVAS_MAX = "max(20rem, calc(100dvh - 250px))";

const EMPTY: CanvasInfo = {
  strokes: 0,
  stats: { coverage: 0, share: { black: 0, red: 0, blue: 0, gold: 0, green: 0 }, colors: [] },
};

export function Studio({
  word,
  canReroll,
  onReroll,
  initialStyle,
  onSubmit,
}: {
  word: string;
  canReroll: boolean;
  onReroll: () => void;
  initialStyle: ArtStyle | null;
  onSubmit: (image: string, style: ArtStyle) => void;
}) {
  const canvas = useRef<CanvasHandle>(null);
  const [color, setColor] = useState<string>(INKS[0].value);
  const [brush, setBrush] = useState(BRUSHES[0].value);
  const [style, setStyle] = useState<ArtStyle | null>(initialStyle);
  const [info, setInfo] = useState<CanvasInfo>(EMPTY);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [left, setLeft] = useState(DRAW_SECONDS * 1000);
  const trend = todayTrend();

  const timeUp = left <= 0;
  const erasing = color === ERASER;

  const onTick = useEffectEvent((start: number) => {
    const remaining = DRAW_SECONDS * 1000 - (performance.now() - start);
    setLeft(Math.max(0, remaining));
    return remaining <= 0;
  });

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      if (onTick(startedAt)) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [startedAt]);

  const seconds = Math.ceil(left / 1000);
  const ready = info.strokes > 0 && info.stats.coverage > 0 && style;

  const submit = () => {
    if (!ready || !canvas.current) return;
    onSubmit(canvas.current.toDataURL(), style);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Headline className="text-[22px] sm:text-4xl">당신의 발그림, 얼마일까요?</Headline>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-accent">
          🔥 오늘의 트렌드 · <b>{trend.name}</b> <b>×{trend.multiplier}</b>
        </span>
        {trend.test(info.stats) && info.strokes > 0 ? (
          <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">✓ 트렌드 조건 충족!</span>
        ) : (
          <span className="text-xs text-muted">{trend.hint}하면 낙찰가가 올라요</span>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_300px] lg:items-start lg:gap-x-5">
        {/* Tools */}
        <div className="order-2 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-2.5 shadow-soft lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:w-[96px] lg:flex-col lg:flex-nowrap lg:py-4">
          <div className="flex gap-2 lg:flex-col" role="radiogroup" aria-label="물감 색">
            {INKS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.name}
                title={c.name}
                onClick={() => setColor(c.value)}
                className={`size-8 rounded-full transition lg:size-9 ${color === c.value ? "ring-2 ring-ink ring-offset-2" : "hover:scale-110"}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <span className="mx-1 h-7 w-px bg-line lg:my-1 lg:h-px lg:w-10" aria-hidden />
          <div className="flex gap-1.5 lg:flex-col">
            {BRUSHES.map((b) => (
              <button
                key={b.value}
                type="button"
                aria-pressed={!erasing && brush === b.value}
                title={b.name}
                onClick={() => {
                  setBrush(b.value);
                  if (erasing) setColor(INKS[0].value);
                }}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs whitespace-nowrap transition lg:w-[76px] ${
                  !erasing && brush === b.value ? "bg-ink text-white" : "text-muted hover:bg-surface"
                }`}
              >
                <span className="rounded-full bg-current" style={{ width: b.value / 3, height: b.value / 3 }} />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
          <span className="mx-1 h-7 w-px bg-line lg:my-1 lg:h-px lg:w-10" aria-hidden />
          <div className="flex gap-1 lg:flex-col">
            <ToolButton label="지우개" icon="◇" active={erasing} onClick={() => setColor(ERASER)} />
            <ToolButton label="되돌리기" icon="↶" disabled={!info.strokes || timeUp} onClick={() => canvas.current?.undo()} />
            <ToolButton label="초기화" icon="↻" disabled={!info.strokes || timeUp} onClick={() => canvas.current?.clear()} />
          </div>
        </div>

        {/* Canvas */}
        <div className="order-1 mx-auto w-full lg:order-none lg:col-start-2 lg:row-start-1" style={{ maxWidth: CANVAS_MAX }}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-serif text-xl font-black tabular-nums text-white transition-colors ${
                  timeUp ? "bg-muted" : seconds <= 5 && startedAt ? "bg-accent animate-pulse-ring" : "bg-accent"
                }`}
                aria-live="polite"
              >
                <span aria-hidden className="text-base">⏱</span>00:{String(seconds).padStart(2, "0")}
              </span>
              <span className="hidden text-sm text-muted sm:inline">
                {timeUp ? "시간 종료! 화풍을 고르고 감정을 맡기세요" : startedAt ? "15초 안에 그려주세요" : "첫 획을 긋는 순간 시작돼요"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-sm text-muted">제시어</span>
              <span className="font-serif text-2xl font-black">{word}</span>
              {canReroll && !startedAt && (
                <button type="button" onClick={onReroll} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-ink/30 hover:text-ink">
                  바꾸기
                </button>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-line shadow-soft">
            <DrawingCanvas
              ref={canvas}
              color={color}
              width={erasing ? 44 : brush}
              disabled={timeUp}
              onStrokeStart={() => setStartedAt((t) => t ?? performance.now())}
              onChange={setInfo}
            />
            {timeUp && (
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-ink/75 py-2 text-center text-sm font-medium text-white">
                붓을 내려놓으세요! 이제 화풍을 골라 감정을 맡기세요
              </div>
            )}
          </div>

        </div>

        <div className="order-3 mx-auto w-full lg:order-none lg:col-start-2 lg:row-start-2" style={{ maxWidth: CANVAS_MAX }}>
          <Stats info={info.stats} strokes={info.strokes} />
        </div>

        {/* Styles */}
        <div className="order-4 lg:order-none lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <p className="mb-3 text-center font-serif text-lg font-bold">화풍을 골라주세요</p>
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-2 lg:gap-3">
            {ART_STYLES.map((s) => {
              const selected = style?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s)}
                  aria-pressed={selected}
                  className={`group relative overflow-hidden rounded-xl border-2 bg-card text-left transition ${
                    selected ? "border-accent shadow-[0_6px_18px_-8px_rgb(181_33_48/0.6)]" : "border-transparent hover:border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static previews */}
                  <img src={`/samples/${s.id}.webp`} alt="" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105 lg:aspect-[16/9]" />
                  <span className="block truncate px-1 py-1.5 text-center text-xs font-medium sm:text-sm lg:py-1">{s.name}</span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-xs text-white shadow" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 min-h-5 text-center text-xs text-muted">{style ? style.tagline : "고양이 낙서를 각 화풍으로 복원한 예시예요"}</p>

          <button type="button" onClick={submit} disabled={!ready} className={`${btn.primary} mt-4 w-full text-lg ${ready && timeUp ? "animate-pulse-ring" : ""}`}>
            {!info.strokes ? "먼저 그림을 그려주세요" : !style ? "화풍을 골라주세요" : "감정 맡기기 →"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ToolButton({ label, icon, onClick, disabled, active }: { label: string; icon: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs whitespace-nowrap transition disabled:opacity-35 lg:w-[76px] lg:justify-start ${
        active ? "bg-ink text-white" : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <span aria-hidden className="text-sm">{icon}</span>
      {label}
    </button>
  );
}

function Stats({ info, strokes }: { info: DoodleStats; strokes: number }) {
  const items = [
    ["획 수", String(strokes)],
    ["색상", String(info.colors.length)],
    ["채움률", `${Math.round(info.coverage * 100)}%`],
  ];
  return (
    <dl className="flex items-center justify-center divide-x divide-line rounded-xl border border-line bg-card py-2.5 shadow-soft">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-2 px-5">
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="font-serif text-xl font-black text-accent tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
