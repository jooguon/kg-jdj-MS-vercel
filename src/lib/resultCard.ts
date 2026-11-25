import { formatWonDigits, type Appraisal } from "./auction";
import { getBidder } from "./bidders";
import type { ArtStyle } from "./styles";

const W = 1080;
const H = 1350;

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
  const serif = cssVar("--font-serif-kr", "serif");
  const sans = cssVar("--font-sans-kr", "sans-serif");
  const accent = cssVar("--accent", "#b52130");
  const ink = cssVar("--ink", "#1c1b1a");
  const muted = cssVar("--muted", "#74716c");
  const sold = o.result.price > 0;
  const priceText = sold ? formatWonDigits(o.result.price) : "유찰";
  const winner = getBidder(o.result.winner);

  await Promise.all([
    document.fonts.load(`900 52px ${serif}`, o.appraisal.title + priceText + "낙찰유찰증서"),
    document.fonts.load(`500 26px ${sans}`, o.appraisal.comment + o.style.name + o.word + o.artist + winner.name + "LOT 발더비 경매장 작가 낙찰자 원본"),
  ]).catch(() => undefined);

  const [painting, doodle, logo] = await Promise.all([loadImage(o.painting), loadImage(o.doodle), loadImage("/logo-mask.png")]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbfaf8";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#e9e5de";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Logo tinted with the accent color.
  const logoW = 400;
  const logoH = (logo.height / logo.width) * logoW;
  const tint = document.createElement("canvas");
  tint.width = logoW;
  tint.height = logoH;
  const t = tint.getContext("2d")!;
  t.drawImage(logo, 0, 0, logoW, logoH);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = accent;
  t.fillRect(0, 0, logoW, logoH);
  ctx.drawImage(tint, (W - logoW) / 2, 70);

  ctx.textAlign = "center";
  ctx.fillStyle = muted;
  ctx.font = `500 22px ${sans}`;
  ctx.fillText(`낙찰 증서  ·  LOT ${o.lot}  ·  ${o.style.name}  ·  제시어 ‘${o.word}’`, W / 2, 70 + logoH + 44);

  // Gilded frame + painting.
  const size = 640;
  const px = (W - size) / 2;
  const py = 70 + logoH + 80;
  const grad = ctx.createLinearGradient(px, py, px + size, py + size);
  grad.addColorStop(0, "#e3c98f");
  grad.addColorStop(0.45, "#b98e45");
  grad.addColorStop(0.7, "#e8d3a3");
  grad.addColorStop(1, "#a97d38");
  ctx.save();
  ctx.shadowColor = "rgba(70,45,10,0.3)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = grad;
  ctx.fillRect(px - 26, py - 26, size + 52, size + 52);
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px - 12, py - 12, size + 24, size + 24);
  ctx.drawImage(painting, px, py, size, size);

  // Original doodle pinned to the corner, kept inside the frame area so it never covers the text.
  const thumb = 170;
  const tx = px + size - thumb + 64;
  const ty = py + size - thumb - 30;
  ctx.save();
  ctx.translate(tx + thumb / 2, ty + thumb / 2);
  ctx.rotate(0.035);
  ctx.shadowColor = "rgba(40,25,10,0.3)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-thumb / 2 - 10, -thumb / 2 - 10, thumb + 20, thumb + 46);
  ctx.shadowColor = "transparent";
  ctx.drawImage(doodle, -thumb / 2, -thumb / 2, thumb, thumb);
  ctx.fillStyle = muted;
  ctx.font = `500 18px ${sans}`;
  ctx.fillText("원본 발그림", 0, thumb / 2 + 26);
  ctx.restore();

  // Title, price, comment.
  let y = py + size + 100;
  ctx.fillStyle = ink;
  ctx.font = `900 46px ${serif}`;
  for (const line of wrap(ctx, o.appraisal.title, W - 180, 2)) {
    ctx.fillText(line, W / 2, y);
    y += 56;
  }
  y += 8;
  ctx.font = `900 64px ${serif}`;
  ctx.fillStyle = sold ? accent : muted;
  ctx.fillText(priceText, W / 2, y + 20);
  y += 72;

  ctx.font = `400 25px ${sans}`;
  ctx.fillStyle = ink;
  for (const line of wrap(ctx, `“${o.appraisal.comment}”`, W - 220, 2)) {
    ctx.fillText(line, W / 2, y);
    y += 36;
  }

  ctx.font = `500 22px ${sans}`;
  ctx.fillStyle = muted;
  ctx.fillText(sold ? `작가 ${o.artist}   ·   낙찰자 ${winner.emoji} ${winner.name}` : `작가 ${o.artist}`, W / 2, H - 70);

  // Stamp.
  ctx.save();
  ctx.translate(W - 150, py + size + 96);
  ctx.rotate(-0.17);
  ctx.strokeStyle = sold ? accent : muted;
  ctx.fillStyle = sold ? accent : muted;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(-78, -40, 156, 80);
  ctx.font = `900 46px ${serif}`;
  ctx.textBaseline = "middle";
  ctx.fillText(sold ? "낙찰" : "유찰", 0, 3);
  ctx.restore();

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}
