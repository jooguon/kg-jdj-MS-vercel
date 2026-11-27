"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { lotNumber, type Appraisal } from "@/lib/auction";
import { renderCertificate } from "@/lib/resultCard";
import type { ArtStyle } from "@/lib/styles";
import { randomWord } from "@/lib/words";
import { Appraisal as AppraisalView, type Async } from "./Appraisal";
import { Auction, type AuctionResult } from "./Auction";
import { Certificate, type ExhibitState } from "./Certificate";
import { Logo } from "./Logo";
import { Studio } from "./Studio";
import { btn, RedDot, TopBar, type StepId } from "./ui";

type Phase = "lobby" | StepId;
type Painting = { image: string; sig: string; mock?: boolean };

const NAME_KEY = "balderby:artist";
const NAME_EVENT = "balderby:artist";
const DEFAULT_ARTIST = "무명 작가";

function subscribeName(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(NAME_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(NAME_EVENT, cb);
  };
}
function readName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
    window.dispatchEvent(new Event(NAME_EVENT));
  } catch {}
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "경매장에 문제가 생겼어요. 다시 시도해 주세요.");
  return json as T;
}

export function Game() {
  const storedName = useSyncExternalStore(subscribeName, readName, () => "");
  const [phase, setPhase] = useState<Phase>("lobby");
  const [artist, setArtist] = useState(DEFAULT_ARTIST);
  const [word, setWord] = useState("");
  const [rerolled, setRerolled] = useState(false);
  const [lot, setLot] = useState("");
  const [style, setStyle] = useState<ArtStyle | null>(null);
  const [doodle, setDoodle] = useState("");
  const [judge, setJudge] = useState<Async<Appraisal>>({ status: "pending" });
  const [painting, setPainting] = useState<Async<Painting>>({ status: "pending" });
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [exhibit, setExhibit] = useState<ExhibitState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const submissionId = useRef(0);

  const go = (p: Phase) => {
    setPhase(p);
    window.scrollTo({ top: 0 });
  };

  const enterStudio = (name: string) => {
    const clean = name.replace(/\s+/g, " ").trim().slice(0, 12);
    saveName(clean);
    setArtist(clean || DEFAULT_ARTIST);
    newRound();
  };

  const newRound = () => {
    submissionId.current++;
    setWord(randomWord());
    setRerolled(false);
    setLot(lotNumber());
    setResult(null);
    setExhibit({ status: "idle" });
    go("studio");
  };

  const requestJudge = (id: number, body: object) => {
    setJudge({ status: "pending" });
    postJSON<Appraisal>("/api/judge", body)
      .then((data) => id === submissionId.current && setJudge({ status: "done", data }))
      .catch((e: Error) => id === submissionId.current && setJudge({ status: "error", error: e.message }));
  };

  const requestPainting = (id: number, body: object) => {
    setPainting({ status: "pending" });
    postJSON<Painting>("/api/transform", body)
      .then((data) => id === submissionId.current && setPainting({ status: "done", data }))
      .catch((e: Error) => id === submissionId.current && setPainting({ status: "error", error: e.message }));
  };

  const submit = (image: string, s: ArtStyle) => {
    const id = ++submissionId.current;
    setDoodle(image);
    setStyle(s);
    const body = { image, word, styleId: s.id };
    requestJudge(id, body);
    requestPainting(id, body);
    go("appraisal");
  };

  const retry = () => {
    if (!style) return;
    const body = { image: doodle, word, styleId: style.id };
    if (judge.status === "error") requestJudge(submissionId.current, body);
    if (painting.status === "error") requestPainting(submissionId.current, body);
  };

  const saveCertificate = async () => {
    if (judge.status !== "done" || painting.status !== "done" || !result || !style) return;
    setSaving(true);
    try {
      const blob = await renderCertificate({
        lot,
        word,
        style,
        artist,
        doodle,
        painting: painting.data.image,
        appraisal: judge.data,
        result,
      });
      const file = new File([blob], `balderby-lot-${lot}.png`, { type: "image/png" });
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      if (isTouch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "발더비 경매장 낙찰 증서" }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } finally {
      setSaving(false);
    }
  };

  const hangInGallery = async () => {
    if (painting.status !== "done" || !result) return;
    setExhibit({ status: "saving" });
    try {
      const { id } = await postJSON<{ id: string }>("/api/exhibit", {
        token: result.token,
        artist,
        doodle,
        painting: painting.data.image,
        paintingSig: painting.data.sig,
      });
      setExhibit({ status: "done", id });
    } catch (e) {
      setExhibit({ status: "error", error: (e as Error).message });
    }
  };

  const home = () => go("lobby");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar step={phase === "lobby" ? undefined : phase} onHome={home} />
      <main className="flex flex-1 flex-col pb-14">
        {phase === "lobby" && <Lobby storedName={storedName} onEnter={enterStudio} />}
        {phase === "studio" && (
          <Studio
            key={lot}
            word={word}
            canReroll={!rerolled}
            onReroll={() => {
              setRerolled(true);
              setWord((w) => randomWord(w));
            }}
            initialStyle={style}
            onSubmit={submit}
          />
        )}
        {phase === "appraisal" && style && (
          <AppraisalView doodle={doodle} style={style} judge={judge} painting={painting} onRetry={retry} onDone={() => go("auction")} />
        )}
        {phase === "auction" && style && judge.status === "done" && painting.status === "done" && (
          <Auction
            appraisal={judge.data}
            painting={painting.data.image}
            doodle={doodle}
            artist={artist}
            style={style}
            word={word}
            onFinish={(r) => {
              setResult(r);
              go("certificate");
            }}
          />
        )}
        {phase === "certificate" && style && judge.status === "done" && painting.status === "done" && result && (
          <Certificate
            appraisal={judge.data}
            result={result}
            painting={painting.data.image}
            doodle={doodle}
            artist={artist}
            style={style}
            word={word}
            lot={lot}
            saving={saving}
            exhibit={exhibit}
            onSave={saveCertificate}
            onExhibit={hangInGallery}
            onNew={newRound}
          />
        )}
      </main>
    </div>
  );
}

const LOBBY_WORKS = [
  { id: "pop-art", title: "노란 고양이의 15분", medium: "캔버스에 실크스크린", price: "₩412,000,000" },
  { id: "fauvism", title: "분홍 하늘 아래 야옹", medium: "캔버스에 유채", price: "₩1,280,000,000" },
  { id: "watercolor", title: "봄날의 낮잠", medium: "종이에 수채", price: "₩96,000,000" },
];

function Lobby({ storedName, onEnter }: { storedName: string; onEnter: (name: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? storedName;

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-20">
      <div className="animate-rise">
        <p className="inline-flex rounded-full bg-yellow px-3 py-1 text-xs font-semibold">✦ 15초 발그림 경매장</p>
        <h1 className="mt-6 w-full max-w-md">
          <Logo className="w-full" color="var(--primary)" />
        </h1>
        <p className="mt-10 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          당신의 <span className="relative inline-block">발그림<span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-pink/70" /></span>,
          <br />
          얼마일까요?
        </p>
        <p className="mt-4 max-w-sm leading-relaxed text-pretty text-muted">
          제시어를 15초 안에 그리면 고전 유화부터 팝아트, 수묵화까지 원하는 화풍의 그림으로 다시 그려 경매에 올려 드려요.
        </p>

        <form
          className="mt-10 flex max-w-md items-center gap-2 rounded-full border-2 border-ink bg-card p-1.5 pl-5 shadow-[4px_4px_0_var(--ink)]"
          onSubmit={(e) => {
            e.preventDefault();
            onEnter(name);
          }}
        >
          <span className="eyebrow shrink-0">작가명</span>
          <input
            value={name}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={12}
            placeholder="무명 작가"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-medium outline-none placeholder:text-muted/60"
            aria-label="작가명"
          />
          <button type="submit" className={`${btn.primary} py-3`}>
            화실 입장
          </button>
        </form>
        <Link href="/gallery" className="mt-5 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          지금까지 낙찰된 작품 보기 →
        </Link>
      </div>

      {/* A small wall of example works, all made from the same 15-second cat doodle */}
      <div className="relative grid grid-cols-2 gap-x-6 gap-y-10 animate-rise" style={{ animationDelay: "120ms" }}>
        {LOBBY_WORKS.map((w, i) => (
          <figure key={w.id} className={`relative ${i === 1 ? "row-span-2 self-center" : ""}`}>
            <span
              className={`absolute -z-10 ${i === 0 ? "-top-4 -left-4 size-2/3 rounded-full bg-sky" : i === 1 ? "-right-4 -bottom-4 size-3/4 rounded-[2rem] bg-pink" : "-bottom-4 -left-4 size-3/5 rotate-12 rounded-3xl bg-yellow"}`}
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- static example */}
            <img src={`/examples/${w.id}.webp`} alt={w.title} className="hung aspect-square w-full rounded-xl object-cover" />
            <figcaption className="mt-3 text-xs leading-relaxed">
              <p className="font-semibold">{w.title}</p>
              <p className="text-muted">{w.medium}</p>
              <p className="mt-0.5 flex items-center gap-1.5 tabular-nums">
                <RedDot className="size-2" />
                {w.price}
              </p>
            </figcaption>
          </figure>
        ))}
        <figure className="absolute -top-8 -left-6 z-10 w-24 rotate-[-6deg] rounded-lg border-2 border-ink bg-white p-1.5 shadow-[3px_3px_0_var(--ink)] sm:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element -- static example */}
          <img src="/examples/doodle.png" alt="15초 만에 그린 고양이 낙서" className="aspect-square w-full object-cover" />
          <figcaption className="pt-1 text-center text-[10px] text-muted">원본 · 15초</figcaption>
        </figure>
      </div>

      <ol className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-8 sm:grid-cols-4 md:col-span-2 md:mt-4">
        {[
          ["01", "화실", "15초 안에 제시어 그리기"],
          ["02", "감정", "AI 감정사의 천재성 분석"],
          ["03", "경매", "가상 큰손들의 실시간 응찰"],
          ["04", "증서", "낙찰 증서 받고 전시관에 걸기"],
        ].map(([n, t, d]) => (
          <li key={n}>
            <span
              className="flex size-9 items-center justify-center rounded-full font-accent text-lg italic"
              style={{ backgroundColor: ["var(--sky)", "var(--pink)", "var(--yellow)", "var(--mint)"][Number(n) - 1] }}
            >
              {n}
            </span>
            <p className="mt-2 text-[15px] font-semibold">{t}</p>
            <p className="mt-0.5 text-xs text-muted">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
