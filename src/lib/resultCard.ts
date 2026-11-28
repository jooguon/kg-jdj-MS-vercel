import { formatPrice, type Appraisal } from "./auction";
import { bidderImage, getBidder } from "./bidders";
import type { ArtStyle } from "./styles";

const W = 1080;
const H = 1350;
const FONT = '"Pretendard Variable", Pretendard, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line);
      line = ch.trim() ? ch : "";
      if (lines.length === maxLines) break;
    } else line += ch;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && lines.join("").length < text.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, "…");
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws a 1080×1350 certificate of sale (Instagram portrait size) and returns a PNG blob. */
export async function renderCertificate(o: {
  lot: string;
  word: string;
  style: ArtStyle;
  artist: string;
  doodle: string;
  painting: string;
  appraisal: Appraisal;
  result: { price: number; winner: string };
}): Promise<Blob> {
  const ink = cssVar("--ink", "#17171c");
  const muted = cssVar("--muted", "#85847d");
  const primary = cssVar("--primary", "#3b5bff");
  const accent = cssVar("--accent", "#ff5a36");
  const yellow = cssVar("--yellow", "#ffd84d");
  const sold = o.result.price > 0;
  const priceText = sold ? `${formatPrice(o.result.price)}원` : "유찰";
  const winner = getBidder(o.result.winner);

  await Promise.all(
    [`700 48px ${FONT}`, `600 64px ${FONT}`, `400 26px ${FONT}`].map((f) =>
      document.fonts.load(f, o.appraisal.title + o.appraisal.comment + priceText + o.artist + winner.name + o.style.name + o.word + "낙찰 증서 원본 작가 LOT 발더비 경매장"),
    ),
  ).catch(() => undefined);

  const [painting, doodle, logo, portrait] = await Promise.all([
    loadImage(o.painting),
    loadImage(o.doodle),
    loadImage("/logo-mask.png"),
    sold ? loadImage(bidderImage(winner.id)).catch(() => null) : Promise.resolve(null),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(0, 0, W, H);

  // Logo tinted blue.
  const logoW = 380;
  const logoH = (logo.height / logo.width) * logoW;
  const tint = document.createElement("canvas");
  tint.width = logoW;
  tint.height = logoH;
  const t = tint.getContext("2d")!;
  t.drawImage(logo, 0, 0, logoW, logoH);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = primary;
  t.fillRect(0, 0, logoW, logoH);
  ctx.drawImage(tint, 80, 76);

  // "낙찰 증서" pill, top right.
  ctx.font = `700 26px ${FONT}`;
  const pill = sold ? "낙찰 증서" : "경매 결과";
  const pw = ctx.measureText(pill).width + 44;
  roundRect(ctx, W - 80 - pw, 82, pw, 52, 26);
  ctx.fillStyle = sold ? yellow : "#f3f1ea";
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pill, W - 80 - pw / 2, 109);
  ctx.textBaseline = "alphabetic";

  // Painting on a genre-colored backdrop.
  const size = 640;
  const px = (W - size) / 2;
  const py = 200;
  roundRect(ctx, px - 28, py - 28, size * 0.78, size * 0.78, 44);
  ctx.fillStyle = o.style.color;
  ctx.fill();
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, px, py, size, size, 28);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, px, py, size, size, 28);
  ctx.clip();
  ctx.drawImage(painting, px, py, size, size);
  ctx.restore();

  // Original doodle sticker.
  const thumb = 170;
  ctx.save();
  ctx.translate(px + size - 40, py + size - 70);
  ctx.rotate(0.07);
  roundRect(ctx, -thumb / 2 - 10 + 5, -thumb / 2 - 10 + 5, thumb + 20, thumb + 46, 14);
  ctx.fillStyle = ink;
  ctx.fill();
  roundRect(ctx, -thumb / 2 - 10, -thumb / 2 - 10, thumb + 20, thumb + 46, 14);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.drawImage(doodle, -thumb / 2, -thumb / 2, thumb, thumb);
  ctx.fillStyle = muted;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText("원본 · 15초", 0, thumb / 2 + 26);
  ctx.restore();

  // Text block.
  const left = 80;
  let y = py + size + 110;
  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(`LOT ${o.lot}  ·  ${o.style.name}  ·  제시어 ‘${o.word}’`, left, y);
  y += 62;
  ctx.fillStyle = ink;
  ctx.font = `700 50px ${FONT}`;
  for (const line of wrap(ctx, o.appraisal.title, W - 160, 1)) {
    ctx.fillText(line, left, y);
    y += 60;
  }
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(o.artist, left, y);

  // Price, right aligned on the same block.
  ctx.textAlign = "right";
  ctx.font = `600 64px ${FONT}`;
  ctx.fillStyle = sold ? primary : muted;
  const priceW = ctx.measureText(priceText).width;
  ctx.fillText(priceText, W - 80, y);
  if (sold) {
    ctx.beginPath();
    ctx.arc(W - 80 - priceW - 26, y - 22, 12, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }

  y += 64;
  ctx.textAlign = "left";
  ctx.font = `400 25px ${FONT}`;
  ctx.fillStyle = ink;
  for (const line of wrap(ctx, `“${o.appraisal.comment}”`, W - 160, 2)) {
    ctx.fillText(line, left, y);
    y += 37;
  }

  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = muted;
  if (sold && portrait) {
    // Winner's portrait in a circle, then the name.
    const r = 34;
    ctx.save();
    ctx.beginPath();
    ctx.arc(left + r, H - 70, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(portrait, left, H - 70 - r, r * 2, r * 2);
    ctx.restore();
    ctx.fillText(`낙찰자 ${winner.name}`, left + r * 2 + 14, H - 60);
  } else {
    ctx.fillText(sold ? `낙찰자 ${winner.emoji} ${winner.name}` : "다음 경매를 기대해 주세요", left, H - 60);
  }
  ctx.textAlign = "right";
  ctx.fillText("발더비 경매장", W - 80, H - 60);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}
