"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWon, formatWonDigits } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { Artwork } from "@/lib/store";
import { getStyle } from "@/lib/styles";
import { CompareSlider } from "./CompareSlider";
import { BidderAvatar, RedDot } from "./ui";

const src = (id: string, kind: "painting" | "doodle") => `/api/art/${id}/${kind}`;

// Tiles get a stable "random" shape from their id, so the wall looks hand-hung.
const SHAPES = ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "4 / 3", "5 / 4", "3 / 4", "1 / 1"];
function shapeFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SHAPES[h % SHAPES.length];
}

const styleName = (id: string) => getStyle(id)?.name ?? "회화";
/** "28억 8,400만 원" → "28억 8,400만" for the big ranking numbers */
const shortWon = (n: number) => formatWon(n).replace(/ 원$/, "");

export function GalleryView({
  ranked,
  rest,
  total,
  focusId,
  ready,
}: {
  ranked: Artwork[];
  rest: Artwork[];
  total: number;
  focusId?: string;
  ready: boolean;
}) {
  const all = [...ranked, ...rest];
  const [openId, setOpenId] = useState<string | undefined>(focusId);
  const open = all.find((a) => a.id === openId);
  const rankOf = (id: string) => ranked.findIndex((a) => a.id === id) + 1;

  return (
    <>
      <h1 className="text-center text-4xl font-black tracking-[-0.05em] sm:text-[52px]">
        발더비 <span className="text-primary">전시관</span>
      </h1>
      <p className="mt-2 text-center text-base font-semibold text-muted sm:text-lg">
        {total ? `지금까지 낙찰된 발그림 ${total.toLocaleString("ko-KR")}점` : "낙찰된 발그림이 걸리는 곳"}
      </p>

      {!ready ? (
        <Empty title="전시관 준비 중이에요" body="곧 문을 열어요. 먼저 작품을 출품해 보세요!" />
      ) : total === 0 ? (
        <Empty title="아직 걸린 작품이 없어요" body="첫 낙찰의 주인공이 되어 전시관 1위에 이름을 올려 보세요." />
      ) : (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">최고가 낙찰 TOP {ranked.length}</h2>
              <span className="text-sm font-semibold text-muted">낙찰가 기준</span>
            </div>
            <ol className="flex flex-col gap-3">
              {ranked.map((a, i) => {
                const first = i === 0;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(a.id)}
                      className={`flex w-full items-center gap-3 rounded-[28px] px-4 py-3 text-left transition hover:-translate-y-0.5 sm:gap-6 sm:px-6 sm:py-4 ${
                        first ? "bg-yellow" : "soft bg-card"
                      } ${a.id === focusId ? "ring-4 ring-primary/40" : ""}`}
                    >
                      <span className={`w-7 shrink-0 text-center text-3xl font-black tracking-tighter sm:w-12 sm:text-5xl ${first ? "text-ink" : "text-ink/25"}`}>{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element -- served by our image route */}
                      <img
                        src={src(a.id, "painting")}
                        alt=""
                        loading="lazy"
                        className={`shrink-0 rounded-2xl object-cover ${first ? "size-20 sm:size-24" : "size-16 sm:size-20"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-black tracking-tight sm:text-xl">
                          {first && <span aria-hidden>👑 </span>}
                          {a.title}
                        </span>
                        <span className="mt-0.5 block truncate text-sm sm:mt-1 sm:text-[15px]">
                          <b className="font-extrabold">{a.artist}</b>
                          <span className="font-semibold text-ink/55"> · {styleName(a.styleId)}</span>
                        </span>
                        <span className="mt-1 block text-lg font-black text-primary tabular-nums sm:hidden">{shortWon(a.price)}</span>
                      </span>
                      <span className="hidden shrink-0 text-right sm:block">
                        <span className="block text-2xl font-black text-primary tabular-nums">{shortWon(a.price)}</span>
                        <span className="block text-sm font-semibold text-ink/50">낙찰 · {getBidder(a.winner).name}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          {rest.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 text-xl font-black tracking-tight sm:text-2xl">그 밖의 낙찰작</h2>
              <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                {rest.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setOpenId(a.id)}
                    className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-3xl text-left sm:mb-4 ${a.id === focusId ? "ring-4 ring-primary/50" : ""}`}
                    style={{ aspectRatio: shapeFor(a.id) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by our image route */}
                    <img src={src(a.id, "painting")} alt={a.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    {a.id === focusId && <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">내 작품</span>}
                    {/* Caption is always visible so every work shows its artist */}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3.5 pt-12 pb-3 text-white sm:px-4">
                      <span className="block truncate text-sm font-black sm:text-[15px]">{a.title}</span>
                      <span className="block truncate text-xs font-semibold opacity-90 sm:text-[13px]">
                        {a.artist} · {formatWon(a.price)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {open && <Detail art={open} rank={rankOf(open.id)} mine={open.id === focusId} onClose={() => setOpenId(undefined)} />}
    </>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="soft mx-auto mt-12 flex max-w-md flex-col items-center rounded-[28px] bg-card px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        🖼
      </span>
      <p className="mt-4 text-xl font-black">{title}</p>
      <p className="mt-2 text-sm font-medium text-muted">{body}</p>
      <Link href="/" className="mt-6 rounded-full bg-primary px-6 py-3.5 font-black text-white">
        작품 출품하러 가기
      </Link>
    </div>
  );
}

function Detail({ art, rank, mine, onClose }: { art: Artwork; rank: number; mine: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const style = getStyle(art.styleId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={art.title}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-card p-4 shadow-2xl animate-rise sm:grid-cols-[1fr_1fr] sm:gap-7 sm:rounded-[28px] sm:p-6"
      >
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-surface text-sm font-black">
          ✕
        </button>
        <div className="overflow-hidden rounded-3xl">
          <CompareSlider painting={src(art.id, "painting")} doodle={src(art.id, "doodle")} />
        </div>
        <div className="flex flex-col pt-4 sm:pt-2">
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {rank > 0 && <span className="rounded-full bg-yellow px-2.5 py-1">낙찰가 {rank}위</span>}
            {mine && <span className="rounded-full bg-primary px-2.5 py-1 text-white">내 작품</span>}
            <span className="rounded-full px-2.5 py-1" style={{ backgroundColor: style ? `${style.color}55` : "var(--surface)" }}>
              {style?.name ?? "회화"}
            </span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-muted">제시어 ‘{art.word}’</span>
          </div>
          <h3 className="mt-4 text-2xl font-black tracking-tight text-balance sm:text-3xl">{art.title}</h3>
          <p className="mt-1.5 text-base">
            <b className="font-extrabold">{art.artist}</b> <span className="font-medium text-muted">작 · {style?.medium ?? "캔버스에 유채"}</span>
          </p>

          <p className="mt-6 text-sm font-bold text-muted">최종 가상 낙찰가</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-primary tabular-nums sm:text-4xl">
            <RedDot className="size-3" />
            {formatWonDigits(art.price)}
          </p>

          <blockquote className="mt-5 rounded-2xl bg-surface px-4 py-3 font-medium leading-relaxed text-pretty">“{art.comment}”</blockquote>

          <div className="mt-auto flex items-center gap-3 pt-5 text-sm">
            <BidderAvatar id={art.winner} size="sm" />
            <span>
              <span className="font-medium text-muted">낙찰자 </span>
              <b className="font-extrabold">{getBidder(art.winner).name}</b>
            </span>
            <span className="ml-auto font-medium text-muted">감정 {art.total}점</span>
          </div>
          <Link href="/" className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-primary font-black text-white">
            나도 출품하기
          </Link>
        </div>
      </div>
    </div>
  );
}
