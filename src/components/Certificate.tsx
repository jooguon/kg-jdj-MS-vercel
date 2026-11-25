"use client";

import Link from "next/link";
import { formatWon, formatWonDigits, SCORE_ITEMS, type Appraisal } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { ArtStyle } from "@/lib/styles";
import type { AuctionResult } from "./Auction";
import { BidderAvatar, btn, FramedArt, Headline } from "./ui";

export type ExhibitState = { status: "idle" | "saving" } | { status: "done"; id: string } | { status: "error"; error: string };

export function Certificate({
  appraisal,
  result,
  painting,
  doodle,
  artist,
  style,
  word,
  lot,
  saving,
  exhibit,
  onSave,
  onExhibit,
  onNew,
}: {
  appraisal: Appraisal;
  result: AuctionResult;
  painting: string;
  doodle: string;
  artist: string;
  style: ArtStyle;
  word: string;
  lot: string;
  saving: boolean;
  exhibit: ExhibitState;
  onSave: () => void;
  onExhibit: () => void;
  onNew: () => void;
}) {
  const sold = result.price > 0;
  const winner = getBidder(result.winner);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Headline className="text-3xl sm:text-5xl">{sold ? "축하합니다. 낙찰입니다." : "아쉽게도 유찰되었습니다."}</Headline>
      {result.shill && (
        <p className="mt-3 text-center text-sm text-muted">
          {result.shill === "won" ? "😏 바람잡이 작전 성공! 낙찰가가 두 배가 되었어요." : "🚨 바람잡이가 들통나 경매가 무효 처리됐어요."}
        </p>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
        <FramedArt painting={painting} doodle={doodle} className="mx-auto w-full max-w-md" />

        <div className="relative">
          <p className="text-xs tracking-[0.25em] text-muted">
            LOT {lot} · {style.en.toUpperCase()} · 제시어 ‘{word}’
          </p>
          <h2 className="mt-2 border-b border-line pb-4 font-serif text-3xl font-black text-balance sm:text-4xl">{appraisal.title}</h2>

          <p className="mt-4 text-sm text-muted">{sold ? "최종 가상 낙찰가" : "경매 결과"}</p>
          <p className="font-serif text-4xl font-black tracking-tight text-accent tabular-nums sm:text-5xl">
            {sold ? formatWonDigits(result.price) : "유찰"}
          </p>
          {sold && <p className="mt-1 text-sm text-muted">{formatWon(result.price)}</p>}

          <blockquote className="mt-5 font-serif text-lg leading-relaxed text-pretty">“{appraisal.comment}”</blockquote>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {SCORE_ITEMS.map((item) => (
              <div key={item.key} className="rounded-xl bg-surface px-2 py-2.5">
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="font-serif text-lg font-black tabular-nums">
                  {appraisal.scores[item.key]}
                  <span className="text-xs font-normal text-muted">/{item.max}</span>
                </dd>
              </div>
            ))}
          </dl>
          {appraisal.trend.applied && sold && (
            <p className="mt-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              🔥 오늘의 트렌드 ‘{appraisal.trend.name}’ 보너스 ×{appraisal.trend.multiplier} 적용
            </p>
          )}

          <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
            {sold ? (
              <>
                <BidderAvatar id={winner.id} />
                <p className="text-sm">
                  <span className="text-muted">낙찰자 · </span>
                  <b>{winner.name}</b>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">이번엔 주인을 찾지 못했어요. 다음 작품을 기대할게요!</p>
            )}
            <span className="ml-auto text-sm text-muted">작가 · {artist}</span>
          </div>

          <span
            className={`pointer-events-none absolute top-28 right-0 animate-stamp rounded-md border-[4px] bg-card/80 px-3 py-1 font-serif text-3xl font-black sm:top-32 ${
              sold ? "border-accent text-accent" : "border-muted text-muted"
            }`}
            aria-hidden
          >
            {sold ? "낙찰" : "유찰"}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
        <button type="button" onClick={onSave} disabled={saving} className={btn.primary}>
          {saving ? "증서 인쇄 중…" : "증서 저장 ↓"}
        </button>
        {sold && appraisal.exhibitable ? (
          exhibit.status === "done" ? (
            <Link href={`/gallery?art=${exhibit.id}`} className={btn.outline}>
              전시관에서 보기 →
            </Link>
          ) : (
            <button type="button" onClick={onExhibit} disabled={exhibit.status === "saving"} className={btn.outline}>
              {exhibit.status === "saving" ? "작품 거는 중…" : "🖼 전시관에 걸기"}
            </button>
          )
        ) : (
          <Link href="/gallery" className={btn.outline}>
            전시관 구경하기
          </Link>
        )}
        <button type="button" onClick={onNew} className={btn.outline}>
          새 작품 출품하기
        </button>
      </div>
      {exhibit.status === "error" && <p className="mt-3 text-center text-sm text-accent">{exhibit.error}</p>}
      {sold && !appraisal.exhibitable && <p className="mt-3 text-center text-xs text-muted">경매장 규정상 이 작품은 전시관에 걸 수 없어요.</p>}
      {sold && appraisal.exhibitable && exhibit.status !== "done" && (
        <p className="mt-3 text-center text-xs text-muted">전시관에 걸면 작가명과 그림이 다른 사람들에게 공개돼요.</p>
      )}
    </section>
  );
}
