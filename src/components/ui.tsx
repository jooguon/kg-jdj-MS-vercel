"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { formatWonDigits } from "@/lib/auction";
import { bidderImage, getBidder } from "@/lib/bidders";
import { Logo } from "./Logo";

export const STEPS = [
  { id: "studio", label: "화실" },
  { id: "appraisal", label: "감정" },
  { id: "auction", label: "경매" },
  { id: "certificate", label: "증서" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function TopBar({ step, onHome }: { step?: StepId; onHome?: () => void }) {
  const logo = <Logo className="h-5 sm:h-6" color="var(--primary)" />;
  const current = STEPS.findIndex((s) => s.id === step);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        {onHome ? (
          <button type="button" onClick={onHome} aria-label="처음으로">
            {logo}
          </button>
        ) : (
          <Link href="/" aria-label="처음으로">
            {logo}
          </Link>
        )}
        <nav className="flex items-center gap-5 text-sm">
          {step && (
            <ol className="hidden items-center gap-1 sm:flex" aria-label="진행 단계">
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  aria-current={s.id === step ? "step" : undefined}
                  className={`rounded-full px-3 py-1 transition ${i === current ? "bg-primary font-semibold text-white" : i < current ? "text-ink/70" : "text-muted/70"}`}
                >
                  <span className="mr-1 font-accent text-[13px] italic">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </li>
              ))}
            </ol>
          )}
          {step && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white sm:hidden">
              <span className="font-accent italic opacity-70">{String(current + 1).padStart(2, "0")} </span>
              {STEPS[current]?.label}
            </span>
          )}
          <Link href="/gallery" className="rounded-full bg-yellow px-3.5 py-1.5 text-[13px] font-semibold transition hover:-translate-y-0.5">
            전시관
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Headline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-center font-bold tracking-[-0.035em] text-balance ${className}`}>{children}</h1>;
}

/** The painting on a pop-colored backdrop, with the original doodle pinned to the corner like a sticker. */
export function HungArt({ art, doodle, color = "var(--pink)", className = "" }: { art: string; doodle?: string; color?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute -top-4 -left-4 h-3/4 w-3/4 rounded-[2rem]" style={{ backgroundColor: color }} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and API images */}
      <img src={art} alt="완성된 그림" className="hung relative aspect-square w-full rounded-2xl bg-white object-cover" />
      {doodle && (
        <figure className="absolute -right-3 -bottom-5 w-[26%] min-w-16 rotate-[4deg] rounded-lg border-2 border-ink bg-white p-1.5 shadow-[3px_3px_0_var(--ink)] sm:-right-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and API images */}
          <img src={doodle} alt="원본 낙서" className="aspect-square w-full rounded object-cover" />
          <figcaption className="pt-1 text-center text-[10px] text-muted">원본 · 15초</figcaption>
        </figure>
      )}
    </div>
  );
}

/** Museum wall label: artist, title, medium, price. */
export function WallLabel({
  artist,
  title,
  medium,
  price,
  sold,
  className = "",
}: {
  artist: string;
  title: string;
  medium: string;
  price?: string;
  sold?: boolean;
  className?: string;
}) {
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      <p className="font-semibold">{artist}</p>
      <p>
        <i className="not-italic">{title}</i>, <span className="font-accent italic">2026</span>
      </p>
      <p className="text-muted">{medium}</p>
      {price && (
        <p className="mt-1 flex items-center gap-1.5 tabular-nums">
          {sold && <RedDot />}
          {price}
        </p>
      )}
    </div>
  );
}

/** Galleries put a red dot next to a sold work. */
export function RedDot({ className = "size-2.5" }: { className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full bg-accent ${className}`} aria-label="판매됨" />;
}

export function BidderAvatar({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) {
  const b = getBidder(id);
  const cls = size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static portraits
    <img src={bidderImage(b.id)} alt={b.name} title={b.name} className={`shrink-0 rounded-full bg-surface object-cover ${cls}`} />
  );
}

/** Animates from the previous value to the new one. */
export function CountUp({ value, ms = 900, format = formatWonDigits }: { value: number; ms?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(0);
  const [from, setFrom] = useState(0);
  const [target, setTarget] = useState(value);
  if (target !== value) {
    setFrom(shown);
    setTarget(value);
  }
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(t < 1 ? from + (target - from) * eased : target);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, target, ms]);
  return <>{format(shown)}</>;
}

export function useCycle(length: number, ms: number, active = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms, active]);
  return i;
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_rgb(59_91_255/0.8)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:bg-primary/25 disabled:shadow-none",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-6 py-3 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-yellow active:translate-y-0 disabled:opacity-40",
  accent:
    "inline-flex items-center justify-center gap-2 rounded-full bg-pink px-6 py-3.5 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:opacity-35",
};
