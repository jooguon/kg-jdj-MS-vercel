"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { formatPrice, roundPrice, type Appraisal, type ShillResult } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { ArtStyle } from "@/lib/styles";
import { BidderAvatar, CountUp, HungArt, RedDot, WallLabel } from "./ui";

export type AuctionResult = { price: number; winner: string; token: string; shill?: "won" | "lost" };

type Entry = { bidder: string; line: string; price: number; kind: "bid" | "shill-won" | "shill-lost" };

const ROUND_MS = 2600;
const FRACTIONS = [0.22, 0.46, 0.73, 1];

export function Auction({
  appraisal,
  painting,
  doodle,
  artist,
  style,
  word,
  onFinish,
}: {
  appraisal: Appraisal;
  painting: string;
  doodle: string;
  artist: string;
  style: ArtStyle;
  word: string;
  onFinish: (r: AuctionResult) => void;
}) {
  const plan = useMemo<Entry[]>(
    () =>
      appraisal.bids.map((b, i, all) => ({
        ...b,
        kind: "bid",
        price: i === all.length - 1 ? appraisal.price : roundPrice(appraisal.price * FRACTIONS[Math.min(i, FRACTIONS.length - 1)]),
      })),
    [appraisal],
  );

  const [revealed, setRevealed] = useState(0);
  const [extra, setExtra] = useState<Entry | null>(null);
  const [mode, setMode] = useState<"bidding" | "shilling" | "hammer">("bidding");
  const [result, setResult] = useState<AuctionResult>({
    price: appraisal.price,
    winner: appraisal.bids.at(-1)?.bidder ?? "",
    token: appraisal.token,
  });
  const [shillError, setShillError] = useState("");

  // Reveal one bid per round, then bring the hammer down.
  useEffect(() => {
    if (mode !== "bidding") return;
    const last = revealed >= plan.length;
    const id = setTimeout(
      () => (last ? setMode("hammer") : setRevealed((r) => r + 1)),
      revealed === 0 && !last ? 900 : last ? (plan.length ? 1800 : 2600) : ROUND_MS,
    );
    return () => clearTimeout(id);
  }, [mode, revealed, plan.length]);

  const finish = useEffectEvent(() => onFinish(result));
  useEffect(() => {
    if (mode !== "hammer") return;
    const id = setTimeout(() => finish(), 2400);
    return () => clearTimeout(id);
  }, [mode]);

  const shill = async () => {
    setMode("shilling");
    setShillError("");
    try {
      const res = await fetch("/api/shill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: appraisal.token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "바람잡이가 길을 잃었어요.");
      const r = json as ShillResult;
      await new Promise((ok) => setTimeout(ok, 1400));
      setExtra(
        r.outcome === "won"
          ? { bidder: r.winner, line: "이 작품, 두 배 부르겠습니다!", price: r.price, kind: "shill-won" }
          : { bidder: "", line: "바람잡이 발각! 경매가 무효 처리됩니다.", price: 0, kind: "shill-lost" },
      );
      setResult({ price: r.price, winner: r.winner, token: r.token, shill: r.outcome });
      setMode("hammer");
    } catch (e) {
      setShillError((e as Error).message);
      setMode("bidding");
    }
  };

  const entries = [...plan.slice(0, revealed), ...(extra ? [extra] : [])].reverse();
  const current = extra ? extra.price : (plan[revealed - 1]?.price ?? 0);
  const noBids = plan.length === 0;
  const sold = result.price > 0;
  const canShill = mode === "bidding" && revealed >= 1 && revealed < plan.length && !extra;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-12 md:grid-cols-[1fr_1fr] md:items-start md:gap-16">
      {/* The work on the block */}
      <div>
        {/* Smaller on phones so the live bidding panel stays on screen */}
        <div className="relative mx-auto max-w-[15rem] sm:max-w-xs md:max-w-md">
          <HungArt art={painting} doodle={doodle} color={style.color} />
          {mode === "hammer" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`flex -rotate-6 items-center gap-2.5 rounded-2xl border-2 border-ink px-7 py-3 text-3xl font-black shadow-[5px_5px_0_var(--ink)] animate-stamp ${sold ? "bg-yellow" : "bg-card text-muted"}`}
              >
                {sold && <RedDot className="size-4" />}
                {sold ? "낙찰!" : "유찰"}
              </span>
            </div>
          )}
        </div>
        <WallLabel className="mx-auto mt-8 max-w-[15rem] sm:max-w-xs md:mt-10 md:max-w-md" artist={artist} title={appraisal.title} medium={`${style.medium} · 제시어 ‘${word}’`} />
      </div>

      {/* Live panel */}
      <div className="flex flex-col rounded-3xl border-2 border-ink bg-card p-5 shadow-[6px_6px_0_var(--primary)] sm:p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            <span className="font-accent text-lg italic">Live</span> 실시간 경매
          </span>
          <span className="text-sm text-muted tabular-nums">
            {noBids ? "응찰 대기" : extra ? "바람잡이 라운드" : `Round ${revealed} / ${plan.length}`}
          </span>
        </div>

        <div className="py-6">
          <p className="eyebrow">현재 가상 입찰가</p>
          <p className="mt-2 text-5xl font-semibold tracking-[-0.04em] text-primary tabular-nums sm:text-6xl">
            <CountUp value={current} />
            <span className="ml-1.5 text-2xl font-bold">원</span>
          </p>
        </div>

        <ul className="flex min-h-[288px] flex-col gap-1.5 sm:min-h-[312px]" aria-live="polite">
          {noBids && (
            <li className="py-10 text-center text-muted">{mode === "hammer" ? "끝내 손을 드는 사람이 없었습니다…" : "응찰자를 기다리는 중…"}</li>
          )}
          {entries.slice(0, 4).map((e, i) => (
            <li
              key={`${e.kind}-${e.bidder}-${e.price}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 animate-rise ${e.kind === "shill-lost" ? "bg-accent-soft" : e.kind === "shill-won" ? "bg-yellow" : i === 0 ? "bg-surface" : "opacity-45"}`}
            >
              {e.kind === "shill-lost" ? (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xl sm:size-14" aria-hidden>
                  🚨
                </span>
              ) : (
                <BidderAvatar id={e.bidder} />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${e.kind === "shill-lost" ? "text-accent" : ""}`}>
                  {e.kind === "shill-lost" ? "경매사" : getBidder(e.bidder).name}
                  {e.kind === "shill-won" && <span className="ml-1.5 text-xs font-medium text-accent">바람잡이에 낚임</span>}
                </p>
                <p className="truncate text-sm text-muted">{e.line}</p>
              </div>
              {e.kind !== "shill-lost" && <span className="shrink-0 text-sm tabular-nums">{formatPrice(e.price)}</span>}
            </li>
          ))}
        </ul>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface">
          {mode === "bidding" && (
            <div key={revealed} className="h-full rounded-full bg-primary animate-drain" style={{ animationDuration: `${revealed === 0 ? 900 : ROUND_MS}ms` }} />
          )}
        </div>
        <p className="mt-2 text-xs text-muted">{mode === "hammer" ? "경매 종료" : mode === "shilling" ? "장내가 술렁입니다…" : "다음 입찰까지"}</p>

        <button
          type="button"
          onClick={shill}
          disabled={!canShill}
          className="mt-5 flex items-center justify-between rounded-full border-2 border-ink bg-accent py-2.5 pr-2.5 pl-6 text-white shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:border-line disabled:bg-surface disabled:text-muted disabled:shadow-none"
        >
          <span className="text-left">
            <span className="block text-[15px] font-semibold">{mode === "shilling" ? "바람잡이 잠입 중…" : extra ? "바람잡이 투입 완료" : "바람잡이 투입"}</span>
            <span className="block text-xs opacity-80">성공하면 2배 · 발각되면 0원 · 단 한 번</span>
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-lg" aria-hidden>
            🤫
          </span>
        </button>
        {shillError && <p className="mt-2 text-center text-sm text-accent">{shillError}</p>}
      </div>
    </section>
  );
}
