"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ART_STYLES, type ArtStyle } from "@/lib/styles";
import { INKS, todayTrend } from "@/lib/trends";
import { DrawingCanvas, type CanvasHandle, type CanvasInfo } from "./DrawingCanvas";

export const DRAW_SECONDS = 15;

const ERASER = "#ffffff";
const BRUSHES = [
  { name: "가는 붓", value: 10, dot: "size-2.5" },
  { name: "굵은 붓", value: 28, dot: "size-5" },
];

const EMPTY: CanvasInfo = {
  strokes: 0,
  stats: { coverage: 0, share: { black: 0, red: 0, blue: 0, gold: 0, green: 0 }, colors: [] },
};

/**
 * Desktop: tool bar | canvas | styles, all three columns ending on the same line.
 * The canvas width is capped by viewport height so the studio fits on a laptop screen.
 */

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
  const urgent = !!startedAt && !timeUp && seconds <= 5;
  const ready = info.strokes > 0 && info.stats.coverage > 0 && style;
  const trendMet = info.strokes > 0 && trend.test(info.stats);

  const submit = () => {
    if (!ready || !canvas.current) return;
    onSubmit(canvas.current.toDataURL(), style);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-7 short:py-2">
      {/* Title + today's trend */}
      <h1 className="text-center text-[28px] leading-tight font-black tracking-[-0.05em] sm:text-[44px] short:hidden">
        당신의 <span className="text-primary">발그림</span>, 얼마일까요?
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 short:hidden">
        <span className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${trendMet ? "bg-mint" : "bg-yellow"}`}>
          {trendMet ? "✓ 트렌드 적중" : "🔥 오늘의 트렌드"} · {trend.name} ×{trend.multiplier}
        </span>
        <span className="text-sm font-medium text-muted">{trendMet ? "이대로면 낙찰가가 껑충 뛰어요" : `${trend.hint} 낙찰가 UP`}</span>
      </div>

      <div className="studio-grid mt-7 grid grid-cols-1 gap-5 wide:grid-cols-[76px_var(--cw)_minmax(300px,380px)] wide:items-stretch wide:justify-center wide:gap-6 short:mt-0 short:grid-cols-[52px_var(--cw)_minmax(220px,1fr)] short:gap-3">
        {/* Tool bar */}
        <aside className="soft order-2 flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-3xl bg-card px-3 py-2.5 sm:justify-between wide:order-none wide:flex-col wide:flex-nowrap wide:rounded-full wide:px-0 wide:py-5 compact:py-3 short:py-2">
          <div className="flex items-center gap-2 wide:flex-col wide:gap-3 compact:gap-2 short:gap-1" role="radiogroup" aria-label="물감 색">
            {INKS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.name}
                title={c.name}
                onClick={() => setColor(c.value)}
                className={`size-7 rounded-full transition sm:size-8 wide:size-9 compact:size-8 short:size-6 ${color === c.value ? "ring-[3px] ring-primary ring-offset-2" : "hover:scale-110"}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 wide:flex-col wide:gap-3 compact:gap-2 short:gap-1">
            {BRUSHES.map((b) => {
              const on = !erasing && brush === b.value;
              return (
                <button
                  key={b.value}
                  type="button"
                  aria-pressed={on}
                  aria-label={b.name}
                  title={b.name}
                  onClick={() => {
                    setBrush(b.value);
                    if (erasing) setColor(INKS[0].value);
                  }}
                  className={`flex size-9 items-center justify-center rounded-full transition wide:size-11 compact:size-9 short:size-8 ${on ? "bg-primary text-white" : "bg-surface text-ink hover:bg-line"}`}
                >
                  <span className={`rounded-full bg-current ${b.dot}`} />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 wide:flex-col wide:gap-2 compact:gap-1.5 short:gap-1">
            <RoundTool label="지우개" icon="⌫" active={erasing} onClick={() => setColor(ERASER)} />
            <RoundTool label="되돌리기" icon="↶" disabled={!info.strokes || timeUp} onClick={() => canvas.current?.undo()} />
            <RoundTool label="초기화" icon="↻" disabled={!info.strokes || timeUp} onClick={() => canvas.current?.clear()} />
          </div>
        </aside>

        {/* Canvas */}
        <div className="order-1 mx-auto flex w-full max-w-(--cw-mobile) min-w-0 flex-col wide:order-none wide:max-w-none">
          <div className="mb-3 flex h-[52px] items-center justify-between gap-3 compact:mb-2 compact:h-11 short:mb-1.5 short:h-10">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xl font-black whitespace-nowrap tabular-nums text-white transition-colors sm:px-5 sm:py-2.5 sm:text-2xl short:gap-1 short:px-2.5 short:py-1 short:text-sm ${
                  timeUp ? "bg-muted" : urgent ? "animate-pulse-ring bg-accent" : "bg-primary"
                }`}
                aria-live="polite"
              >
                <span aria-hidden>⏱</span>00:{String(seconds).padStart(2, "0")}
              </span>
              <span className="hidden text-xs leading-snug font-semibold text-muted xl:block">
                {timeUp ? "시간 끝!" : startedAt ? "망설이면 늦어요" : "첫 획부터 시작"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-muted sm:text-base short:hidden">제시어</span>
              <span className="text-[28px] leading-none font-black tracking-[-0.04em] whitespace-nowrap sm:text-[34px] short:text-lg">{word}</span>
              {canReroll && !startedAt && (
                <button type="button" onClick={onReroll} className="self-center rounded-full bg-surface px-2.5 py-1 text-xs font-bold whitespace-nowrap text-muted hover:text-ink short:px-1.5 short:py-0.5 short:text-[10px]">
                  바꾸기
                </button>
              )}
            </div>
          </div>

          <div className="soft relative overflow-hidden rounded-[28px] bg-white">
            <DrawingCanvas
              ref={canvas}
              color={color}
              width={erasing ? 44 : brush}
              disabled={timeUp}
              onStrokeStart={() => setStartedAt((t) => t ?? performance.now())}
              onChange={setInfo}
            />
            <div className="absolute inset-x-0 top-0 h-1.5 bg-surface">
              <div className={`h-full ${urgent ? "bg-accent" : "bg-primary"}`} style={{ width: `${(left / (DRAW_SECONDS * 1000)) * 100}%`, transition: "width 100ms linear" }} />
            </div>
            {timeUp && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary py-3 text-center text-sm font-bold text-white">
                붓을 내려놓으세요! 이제 화풍을 고를 차례예요
              </div>
            )}
          </div>

          <dl className="mt-4 flex items-baseline justify-center gap-7 text-[15px] font-bold text-muted short:mt-1.5 short:text-xs">
            {[
              ["획 수", String(info.strokes)],
              ["색상", String(info.stats.colors.length)],
              ["채움률", `${Math.round(info.stats.coverage * 100)}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1.5">
                <dt>{k}</dt>
                <dd className="text-2xl font-black text-primary tabular-nums short:text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Styles: fills the canvas column height so both end on the same line */}
        <div className="order-3 flex min-w-0 flex-col wide:order-none">
          <div className="mb-3 flex h-[52px] items-center justify-between compact:mb-2 compact:h-11 short:mb-1.5 short:h-10">
            <p className="text-2xl font-black tracking-[-0.04em] short:text-lg">화풍을 골라주세요</p>
            <button
              type="button"
              onClick={() => setStyle(ART_STYLES[Math.floor(Math.random() * ART_STYLES.length)])}
              className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-pink hover:text-ink"
            >
              🎲 랜덤
            </button>
          </div>

          <ul className="grid flex-1 auto-rows-fr grid-cols-2 gap-2.5 compact:gap-2 short:gap-1.5">
            {ART_STYLES.map((s) => {
              const selected = style?.id === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStyle(s)}
                    aria-pressed={selected}
                    className="relative flex h-full w-full items-center gap-2.5 rounded-2xl p-2 pr-3 text-left transition hover:brightness-[0.97] compact:p-1.5 short:gap-1.5 short:rounded-xl short:p-1"
                    style={{ backgroundColor: selected ? s.color : `${s.color}33` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static thumbnails */}
                    <img src={`/styles/${s.id}.webp`} alt="" className="size-11 shrink-0 rounded-xl object-cover compact:size-9 short:size-7 short:rounded-lg" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] leading-tight font-extrabold">{s.name}</span>
                      <span className="block truncate text-[11px] font-semibold opacity-50 short:hidden">{s.en}</span>
                    </span>
                    {selected && (
                      <span className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-xs text-white" aria-hidden>
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 min-h-5 truncate text-sm font-medium text-muted compact:hidden short:hidden">
            {style ? (
              <>
                <b className="font-extrabold text-ink">{style.name}</b> — {style.tagline}
              </>
            ) : (
              "고전 유화부터 팝아트, 수묵화까지 하나만 골라 주세요"
            )}
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className={`mt-3 flex h-[60px] w-full items-center compact:h-12 short:mt-1.5 short:h-11 short:text-base justify-center rounded-full bg-primary text-lg font-black text-white shadow-[0_12px_24px_-12px_rgb(59_91_255/0.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:bg-primary/25 disabled:shadow-none disabled:hover:translate-y-0 ${
              ready && timeUp ? "animate-pulse-ring" : ""
            }`}
          >
            {!info.strokes ? "먼저 그림을 그려주세요" : !style ? "화풍을 골라주세요" : "감정 맡기기 →"}
          </button>
        </div>
      </div>
    </section>
  );
}

function RoundTool({ label, icon, onClick, disabled, active }: { label: string; icon: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex size-9 items-center justify-center rounded-full text-lg font-bold transition disabled:opacity-30 wide:size-11 compact:size-9 short:size-8 short:text-base ${
        active ? "bg-primary text-white" : "bg-surface text-muted hover:bg-line hover:text-ink"
      }`}
    >
      {icon}
    </button>
  );
}
