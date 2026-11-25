"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { formatWonDigits } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import { Logo } from "./Logo";

export const STEPS = [
  { id: "studio", label: "화실" },
  { id: "appraisal", label: "감정" },
  { id: "auction", label: "경매" },
  { id: "certificate", label: "증서" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function TopBar({ step, onHome }: { step?: StepId; onHome?: () => void }) {
  const logo = <Logo className="h-6 sm:h-7" />;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
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
        <nav className="flex items-center gap-1 text-sm">
          {step && (
            <ol className="hidden items-center gap-1 sm:flex" aria-label="진행 단계">
              {STEPS.map((s) => (
                <li
                  key={s.id}
                  aria-current={s.id === step ? "step" : undefined}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                    s.id === step ? "bg-accent text-accent-ink" : "text-muted"
                  }`}
                >
                  {s.label}
                </li>
              ))}
            </ol>
          )}
          {step && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-ink sm:hidden">
              {STEPS.find((s) => s.id === step)?.label}
            </span>
          )}
          <Link
            href="/gallery"
            className="ml-1 rounded-full border border-line bg-card px-3.5 py-1.5 font-medium text-ink transition hover:border-ink/30 sm:ml-3"
          >
            전시관
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Serif headline with the little sparkle strokes from the title design. */
export function Headline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`flex items-center justify-center gap-3 text-center font-serif font-black tracking-tight ${className}`}>
      <Spark className="-scale-x-100" />
      <span>{children}</span>
      <Spark />
    </h1>
  );
}

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 shrink-0 text-gold sm:size-6 ${className}`} aria-hidden>
      <path d="M3 8 L11 11 M5 15 L12 14 M9 3 L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Painting in a gilded frame with the original doodle pinned to the corner. */
export function FramedArt({ painting, doodle, caption = "원본 발그림", className = "" }: { painting: string; doodle?: string; caption?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="frame">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and API images */}
          <img src={painting} alt="명화로 복원된 작품" className="aspect-square w-full object-cover" />
        </div>
      </div>
      {doodle && (
        <figure className="absolute -right-2 -bottom-3 w-[24%] min-w-16 rotate-2 bg-white p-1.5 pb-1 shadow-soft sm:-right-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and API images */}
          <img src={doodle} alt="원본 낙서" className="aspect-square w-full border border-line object-cover" />
          <figcaption className="pt-1 text-center text-[10px] text-muted sm:text-[11px]">{caption}</figcaption>
        </figure>
      )}
    </div>
  );
}

export function BidderAvatar({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) {
  const b = getBidder(id);
  const cls = size === "lg" ? "size-14 text-3xl" : size === "sm" ? "size-8 text-base" : "size-11 text-2xl";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${cls}`} style={{ backgroundColor: b.tint }} aria-hidden>
      {b.emoji}
    </span>
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
    "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-ink shadow-[0_8px_20px_-8px_rgb(181_33_48/0.55)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:shadow-none",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-ink/80 bg-card px-6 py-3.5 font-bold text-ink transition hover:bg-surface active:scale-[0.99] disabled:opacity-40",
  ghost: "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-ink",
};
