"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";
import { analyzePixels, type DoodleStats } from "@/lib/trends";

const SIZE = 1024;

export type Stroke = { color: string; width: number; points: number[] };

export type CanvasHandle = {
  toDataURL: () => string;
  undo: () => void;
  clear: () => void;
};

export type CanvasInfo = { strokes: number; stats: DoodleStats };

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const p = s.points;
  if (p.length === 2) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], s.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const start = Math.max(0, from - 2);
  ctx.beginPath();
  ctx.moveTo(p[start], p[start + 1]);
  for (let i = start + 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.stroke();
}

/** Square drawing surface. Tools live in the parent; this only paints and reports changes. */
export function DrawingCanvas({
  ref,
  color,
  width,
  disabled = false,
  onStrokeStart,
  onChange,
  className = "",
}: {
  ref?: Ref<CanvasHandle>;
  color: string;
  width: number;
  disabled?: boolean;
  onStrokeStart?: () => void;
  onChange?: (info: CanvasInfo) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<Stroke | null>(null);

  const ctx = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const report = () => {
    const c = ctx();
    if (!c || !onChange) return;
    const { data } = c.getImageData(0, 0, SIZE, SIZE);
    onChange({ strokes: strokes.current.length, stats: analyzePixels(data, SIZE * SIZE, 7) });
  };

  const redraw = () => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, SIZE, SIZE);
    for (const s of strokes.current) drawStroke(c, s);
    report();
  };

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    undo: () => {
      strokes.current.pop();
      redraw();
    },
    clear: () => {
      strokes.current = [];
      redraw();
    },
  }));

  // Paint the white background once, so the exported PNG is not transparent.
  useEffect(() => {
    const c = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, SIZE, SIZE);
  }, []);

  useEffect(() => {
    if (disabled) active.current = null;
  }, [disabled]);

  const toCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [((clientX - rect.left) / rect.width) * SIZE, ((clientY - rect.top) / rect.height) * SIZE];
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onStrokeStart?.();
    const stroke: Stroke = { color, width, points: toCanvas(e.clientX, e.clientY) };
    active.current = stroke;
    strokes.current.push(stroke);
    const c = ctx();
    if (c) drawStroke(c, stroke);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const stroke = active.current;
    if (!stroke || disabled) return;
    const from = stroke.points.length;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) stroke.points.push(...toCanvas(ev.clientX, ev.clientY));
    const c = ctx();
    if (c) drawStroke(c, stroke, from);
  };

  const endStroke = () => {
    if (!active.current) return;
    active.current = null;
    report();
  };

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      aria-label="그림판"
      className={`aspect-square w-full touch-none bg-white ${disabled ? "cursor-not-allowed" : "cursor-crosshair"} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
