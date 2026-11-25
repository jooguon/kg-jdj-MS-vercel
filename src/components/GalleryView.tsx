"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatWon, formatWonDigits } from "@/lib/auction";
import { getBidder } from "@/lib/bidders";
import type { Artwork } from "@/lib/store";
import { getStyle } from "@/lib/styles";
import { CompareSlider } from "./CompareSlider";
import { BidderAvatar, btn, Headline } from "./ui";

const src = (id: string, kind: "painting" | "doodle") => `/api/art/${id}/${kind}`;

// Tiles get a stable "random" shape from their id, so the wall looks hand-hung.
const SHAPES = ["1 / 1", "4 / 5", "3 / 4", "2 / 3", "4 / 3", "5 / 4", "3 / 4", "1 / 1"];
function shapeFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SHAPES[h % SHAPES.length];
}

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
      <Headline className="text-3xl sm:text-5xl">발더비 전시관</Headline>
      <p className="mt-3 text-center text-muted">
        {total ? `지금까지 낙찰된 발그림 명화 ${total.toLocaleString("ko-KR")}점` : "낙찰된 발그림 명화들이 걸리는 곳"}
      </p>

      {!ready ? (
        <Empty title="전시관 준비 중이에요" body="곧 문을 열어요. 먼저 작품을 출품해 보세요!" />
      ) : total === 0 ? (
        <Empty title="아직 걸린 작품이 없어요" body="첫 낙찰의 주인공이 되어 전시관 1위에 이름을 올려 보세요." />
      ) : (
        <>
          <section className="mt-10">
            <h2 className="mb-4 flex items-baseline justify-between">
              <span className="font-serif text-xl font-black sm:text-2xl">최고가 낙찰 TOP {ranked.length}</span>
              <span className="text-xs text-muted">낙찰가 기준</span>
            </h2>
            <ol className="flex flex-col gap-3">
              {ranked.map((a, i) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(a.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-soft transition hover:-translate-y-0.5 sm:gap-5 sm:p-4 ${
                      i === 0 ? "border-gold/60 bg-gold-soft" : "border-line bg-card"
                    } ${a.id === focusId ? "ring-2 ring-accent ring-offset-2" : ""}`}
                  >
                    <span
                      className={`w-8 shrink-0 text-center font-serif font-black tabular-nums sm:w-12 ${i === 0 ? "text-4xl text-gold sm:text-5xl" : "text-3xl text-ink/70 sm:text-4xl"}`}
                    >
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by our image route */}
                    <img
                      src={src(a.id, "painting")}
                      alt=""
                      loading="lazy"
                      className={`shrink-0 rounded-lg object-cover shadow-sm ${i === 0 ? "size-20 sm:size-28" : "size-16 sm:size-20"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-base font-black sm:text-xl">
                        {i === 0 && <span aria-hidden>👑 </span>}
                        {a.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted">
                        {a.artist} · {getStyle(a.styleId)?.name ?? ""} · ‘{a.word}’
                      </span>
                      <span className="mt-1 block font-serif font-black text-accent tabular-nums sm:hidden">{formatWon(a.price)}</span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span className="block font-serif text-lg font-black text-accent tabular-nums sm:text-2xl">{formatWon(a.price).replace(" 원", "")}</span>
                      <span className="hidden text-xs text-muted sm:block">낙찰 · {getBidder(a.winner).name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {rest.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 font-serif text-xl font-black sm:text-2xl">그 밖의 낙찰작</h2>
              <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
                {rest.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setOpenId(a.id)}
                    className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-surface ${a.id === focusId ? "ring-2 ring-accent ring-offset-2" : ""}`}
                    style={{ aspectRatio: shapeFor(a.id) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by our image route */}
                    <img src={src(a.id, "painting")} alt={a.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 flex translate-y-1 flex-col bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-10 text-left text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="truncate font-serif font-bold">{a.title}</span>
                      <span className="truncate text-xs opacity-85">
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
    <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-3xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        🖼
      </span>
      <p className="mt-4 font-serif text-xl font-black">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Link href="/" className={`${btn.primary} mt-6`}>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={art.title}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-card p-4 shadow-2xl animate-rise sm:grid-cols-[1fr_1fr] sm:gap-6 sm:rounded-3xl sm:p-6"
      >
        <button type="button" onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-lg shadow">
          ✕
        </button>
        <div className="overflow-hidden rounded-2xl">
          <CompareSlider painting={src(art.id, "painting")} doodle={src(art.id, "doodle")} />
        </div>
        <div className="flex flex-col pt-4 sm:pt-2">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {rank > 0 && <span className="rounded-full bg-gold-soft px-2.5 py-1 font-bold text-[#8a6a2c]">낙찰가 {rank}위</span>}
            {mine && <span className="rounded-full bg-accent px-2.5 py-1 font-bold text-white">내 작품</span>}
            {style && <span className="rounded-full bg-surface px-2.5 py-1 text-muted">{style.name}</span>}
            <span className="rounded-full bg-surface px-2.5 py-1 text-muted">제시어 ‘{art.word}’</span>
          </div>
          <h3 className="mt-3 font-serif text-2xl font-black text-balance sm:text-3xl">{art.title}</h3>
          <p className="mt-1 text-sm text-muted">{art.artist} 작</p>

          <p className="mt-5 text-sm text-muted">최종 가상 낙찰가</p>
          <p className="font-serif text-3xl font-black text-accent tabular-nums sm:text-4xl">{formatWonDigits(art.price)}</p>

          <blockquote className="mt-4 border-l-4 border-gold pl-4 font-serif leading-relaxed text-pretty">“{art.comment}”</blockquote>

          <div className="mt-auto flex items-center gap-3 border-t border-line pt-4 text-sm">
            <BidderAvatar id={art.winner} size="sm" />
            <span>
              <span className="text-muted">낙찰자 · </span>
              <b>{getBidder(art.winner).name}</b>
            </span>
            <span className="ml-auto text-muted">감정 {art.total}점</span>
          </div>
          <Link href="/" className={`${btn.primary} mt-4 w-full`}>
            나도 출품하기
          </Link>
        </div>
      </div>
    </div>
  );
}
