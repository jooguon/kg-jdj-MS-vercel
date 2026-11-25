"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { roundPrice, type Appraisal, type ShillResult } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { ArtStyle } from "@/lib/styles";
import { BidderAvatar, CountUp, FramedArt } from "./ui";

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
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-10">
      {/* Artwork on the block */}
      <div className="relative rounded-3xl bg-gradient-to-b from-surface to-bg px-6 pt-8 pb-10 sm:px-10">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-40 rounded-b-full bg-[radial-gradient(ellipse_at_top,rgb(255_244_214/0.9),transparent_70%)]" aria-hidden />
        <div className="relative">
          <FramedArt painting={painting} doodle={doodle} />
          {mode === "hammer" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`animate-stamp rounded-lg border-[5px] bg-white/90 px-5 py-2 font-serif text-5xl font-black sm:text-6xl ${
                  sold ? "border-accent text-accent" : "border-muted text-muted"
                }`}
              >
                {sold ? "낙찰" : "유찰"}
              </span>
            </div>
          )}
        </div>
        <div className="relative mt-8 border-l-4 border-accent pl-4">
          <h2 className="font-serif text-2xl font-black text-balance sm:text-3xl">{appraisal.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {artist} 작 · {style.name} · 제시어 ‘{word}’
          </p>
        </div>
      </div>

      {/* Live panel */}
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-bold text-white">
            <span className="size-2 animate-pulse rounded-full bg-white" /> LIVE
          </span>
          <span className="font-medium tracking-wider text-muted tabular-nums">
            {noBids ? "응찰 대기" : extra ? "바람잡이 라운드" : `ROUND ${revealed} / ${plan.length}`}
          </span>
        </div>

        <div>
          <p className="text-sm text-muted">현재 가상 입찰가</p>
          <p className="mt-1 font-serif text-4xl font-black tracking-tight tabular-nums sm:text-5xl">
            <CountUp value={current} />
          </p>
        </div>

        <ul className="flex min-h-[260px] flex-col gap-2" aria-live="polite">
          {noBids && (
            <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-muted">
              {mode === "hammer" ? "끝내 손을 드는 사람이 없었습니다…" : "응찰자를 기다리는 중…"}
            </li>
          )}
          {entries.slice(0, 4).map((e, i) => (
            <li
              key={`${e.kind}-${e.bidder}-${e.price}`}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 animate-rise ${
                e.kind === "shill-lost"
                  ? "border-accent/40 bg-accent-soft"
                  : e.kind === "shill-won"
                    ? "border-gold bg-gold-soft"
                    : i === 0
                      ? "border-ink/15 bg-card"
                      : "border-line bg-card opacity-70"
              }`}
            >
              {e.kind === "shill-lost" ? (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl" aria-hidden>
                  🚨
                </span>
              ) : (
                <BidderAvatar id={e.bidder} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{e.kind === "shill-lost" ? "경매사" : getBidder(e.bidder).name}</p>
                <p className="truncate text-sm text-muted">{e.line}</p>
              </div>
              {e.kind !== "shill-lost" && <span className="shrink-0 text-xs font-medium text-accent tabular-nums">{(e.price / 10_000).toLocaleString("ko-KR")}만</span>}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={shill}
          disabled={!canShill}
          className="flex flex-col items-center rounded-xl bg-gradient-to-r from-[#ff8a3d] to-[#f0453a] px-4 py-3 text-white shadow-[0_10px_24px_-10px_rgb(240_69_58/0.7)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-35 disabled:shadow-none"
        >
          <span className="text-lg font-black">{mode === "shilling" ? "바람잡이 잠입 중…" : extra ? "바람잡이 투입 완료" : "😏 바람잡이 투입"}</span>
          <span className="text-xs opacity-90">성공하면 2배 · 발각되면 0원 · 한 번만</span>
        </button>
        {shillError && <p className="text-center text-sm text-accent">{shillError}</p>}

        <div>
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>{mode === "hammer" ? "경매 종료" : mode === "shilling" ? "장내가 술렁입니다…" : "다음 입찰까지"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface">
            {mode === "bidding" && (
              <div key={revealed} className="h-full rounded-full bg-gold animate-drain" style={{ animationDuration: `${revealed === 0 ? 900 : ROUND_MS}ms` }} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
