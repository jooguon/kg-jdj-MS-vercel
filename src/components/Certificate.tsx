"use client";

import Link from "next/link";
import { formatWon, formatWonDigits, SCORE_ITEMS, type Appraisal } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { ArtStyle } from "@/lib/styles";
import type { AuctionResult } from "./Auction";
import { BidderAvatar, btn, Headline, HungArt, RedDot } from "./ui";

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
  const canExhibit = sold && appraisal.exhibitable;

  return (
    <section className="mx-auto w-full max-w-6xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-14">
      <p className={`mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold ${sold ? "bg-yellow" : "bg-surface"}`}>{sold ? "🎉 낙찰 증서" : "경매 결과"}</p>
      <Headline className="mt-4 text-4xl sm:text-6xl">
        {sold ? (
          <>
            축하합니다. <span className="text-primary">낙찰</span>입니다.
          </>
        ) : (
          "아쉽게도 유찰되었습니다."
        )}
      </Headline>
      {result.shill && (
        <p className="mt-4 text-center text-sm text-muted">
          {result.shill === "won" ? "바람잡이 작전 성공. 낙찰가가 두 배가 되었어요." : "바람잡이가 들통나 경매가 무효 처리됐어요."}
        </p>
      )}

      <div className="mt-14 grid gap-14 md:grid-cols-[1fr_1fr] md:items-start md:gap-16">
        <HungArt art={painting} doodle={doodle} color={style.color} className="mx-auto w-full max-w-md" />

        <div>
          <p className="eyebrow">
            Lot {lot} · {style.en}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-balance sm:text-4xl">{appraisal.title}</h2>
          <p className="mt-2 text-[15px]">
            <b className="font-semibold">{artist}</b>
            <span className="text-muted">
              {" "}
              · {style.medium} · 제시어 ‘{word}’
            </span>
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <p className="eyebrow">{sold ? "최종 가상 낙찰가" : "경매 결과"}</p>
            <p className={`mt-2 flex items-center gap-3 text-[clamp(2rem,10vw,3rem)] leading-tight font-semibold tracking-[-0.04em] whitespace-nowrap tabular-nums md:text-[clamp(2rem,4vw,3rem)] ${sold ? "text-primary" : "text-muted"}`}>
              {sold && <RedDot className="size-3.5 animate-stamp" />}
              {sold ? formatWonDigits(result.price) : "유찰"}
            </p>
            {sold && <p className="mt-1 text-sm text-muted">{formatWon(result.price)}</p>}
            {appraisal.trend.applied && sold && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold">
                오늘의 트렌드 ‘{appraisal.trend.name}’ <span className="font-accent text-sm italic">×{appraisal.trend.multiplier}</span>
              </p>
            )}
          </div>

          <blockquote className="mt-8 rounded-2xl bg-surface px-5 py-4 text-lg leading-relaxed text-pretty">“{appraisal.comment}”</blockquote>
          <p className="mt-2 pl-5 text-xs text-muted">— 발더비 수석 감정사</p>

          <dl className="mt-6 grid grid-cols-3 gap-2">
            {SCORE_ITEMS.map((item, i) => (
              <div key={item.key} className="rounded-2xl px-3 py-3" style={{ backgroundColor: ["var(--sky)", "var(--pink)", "var(--yellow)"][i] }}>
                <dt className="eyebrow text-ink/60">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {appraisal.scores[item.key]}
                  <span className="text-sm text-ink/50">/{item.max}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-3">
            {sold ? (
              <>
                <BidderAvatar id={winner.id} />
                <p className="text-sm">
                  <span className="text-muted">낙찰자 </span>
                  <b className="font-semibold">{winner.name}</b>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">이번엔 주인을 찾지 못했어요. 다음 작품을 기대할게요.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-2.5 sm:grid-cols-3">
        <button type="button" onClick={onSave} disabled={saving} className={btn.primary}>
          {saving ? "증서 인쇄 중…" : "증서 저장"}
        </button>
        {canExhibit ? (
          exhibit.status === "done" ? (
            <Link href={`/gallery?art=${exhibit.id}`} className={btn.accent}>
              전시관에서 보기 →
            </Link>
          ) : (
            <button type="button" onClick={onExhibit} disabled={exhibit.status === "saving"} className={btn.accent}>
              {exhibit.status === "saving" ? "작품 거는 중…" : "전시관에 걸기"}
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
      {canExhibit && exhibit.status !== "done" && (
        <p className="mt-3 text-center text-xs text-muted">전시관에 걸면 작가명 ‘{artist}’과 작품이 다른 사람들에게 공개돼요.</p>
      )}
    </section>
  );
}
