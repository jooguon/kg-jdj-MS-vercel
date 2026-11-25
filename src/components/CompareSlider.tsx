"use client";

import { useState } from "react";

/** Painting underneath, the original doodle on top, revealed up to the handle. */
export function CompareSlider({ painting, doodle }: { painting: string; doodle: string }) {
  const [pos, setPos] = useState(18);

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from the API */}
      <img src={painting} alt="명화로 복원된 작품" className="absolute inset-0 size-full object-cover" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the canvas */}
      <img
        src={doodle}
        alt="원본 낙서"
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-md">
          ⇆
        </span>
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">원본</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[11px] font-medium text-paper">복원작</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="원본과 복원작 비교"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
