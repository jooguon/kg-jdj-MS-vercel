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
import { btn, TopBar, type StepId } from "./ui";

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

function Lobby({ storedName, onEnter }: { storedName: string; onEnter: (name: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? storedName;

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:py-16">
      <div className="animate-rise">
        <p className="text-xs font-medium tracking-[0.3em] text-accent">15초 발그림 경매장</p>
        <h1 className="mt-5 w-full max-w-lg">
          <Logo className="w-full" />
        </h1>
        <p className="mt-7 font-serif text-2xl font-bold sm:text-3xl">당신의 발그림, 얼마일까요?</p>
        <p className="mt-3 max-w-md leading-relaxed text-pretty text-muted">
          제시어를 <b className="text-ink">15초</b> 안에 그리면 원하는 화풍의 명화로 복원해 경매에 올려 드려요. 가상 큰손들이 값을 매기고, 낙찰된 작품은 전시관에 걸려요.
        </p>

        <form
          className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            onEnter(name);
          }}
        >
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-card px-4 shadow-soft focus-within:border-ink/40">
            <span className="shrink-0 text-sm text-muted">작가명</span>
            <input
              value={name}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={12}
              placeholder="무명 작가"
              className="min-w-0 flex-1 bg-transparent py-3.5 font-medium outline-none placeholder:text-muted/60"
              aria-label="작가명"
            />
          </label>
          <button type="submit" className={btn.primary}>
            화실 입장 →
          </button>
        </form>
        <Link href="/gallery" className="mt-4 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          지금까지 낙찰된 작품 구경하기 →
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-md animate-rise" style={{ animationDelay: "120ms" }}>
        <div className="frame rotate-1">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- static sample */}
            <img src="/samples/renaissance.webp" alt="고양이 낙서를 르네상스 유화로 복원한 예시" className="aspect-square w-full object-cover" />
          </div>
        </div>
        <figure className="absolute -bottom-6 -left-4 w-[38%] -rotate-3 bg-white p-2 pb-1.5 shadow-soft sm:-left-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- static sample */}
          <img src="/samples/doodle.png" alt="15초 만에 그린 고양이 낙서" className="aspect-square w-full border border-line object-cover" />
          <figcaption className="pt-1 text-center text-[11px] text-muted">원본 발그림 · 15초</figcaption>
        </figure>
        <div className="absolute -top-4 -right-3 rotate-6 rounded-xl bg-card px-4 py-2.5 text-right shadow-soft sm:-right-6">
          <p className="text-[11px] text-muted">최종 가상 낙찰가</p>
          <p className="font-serif text-xl font-black text-accent">₩256,000,000</p>
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 md:col-span-2">
        {[
          ["01", "화실", "15초 안에 제시어 그리기"],
          ["02", "감정", "AI 감정사의 천재성 분석"],
          ["03", "경매", "가상 큰손들의 실시간 응찰"],
          ["04", "증서", "낙찰 증서 받고 전시관에 걸기"],
        ].map(([n, t, d]) => (
          <li key={n} className="rounded-2xl border border-line bg-card p-4 shadow-soft">
            <span className="font-serif text-sm font-bold text-gold">{n}</span>
            <p className="mt-1 font-bold">{t}</p>
            <p className="mt-0.5 text-xs text-muted">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
