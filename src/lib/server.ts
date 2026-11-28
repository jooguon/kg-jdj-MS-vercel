import "server-only";
import OpenAI from "openai";
import sharp from "sharp";
import { roundPrice } from "./auction";
import { getStyle, type ArtStyle } from "./styles";
import { analyzePixels, type DoodleStats } from "./trends";
import { WORDS } from "./words";

const MAX_IMAGE_BYTES = 1_500_000;

export type Submission = { png: Buffer; dataUrl: string; word: string; style: ArtStyle };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, "잘못된 요청이에요.");
}

/** Decodes a data URL of the given type, enforcing a size limit. */
export function decodeDataUrl(value: unknown, mime: string, maxBytes = MAX_IMAGE_BYTES): Buffer {
  const prefix = `data:${mime};base64,`;
  if (typeof value !== "string" || !value.startsWith(prefix)) throw new HttpError(400, "그림 형식이 올바르지 않아요.");
  const buf = Buffer.from(value.slice(prefix.length), "base64");
  if (buf.length === 0 || buf.length > maxBytes) throw new HttpError(413, "그림 파일이 너무 커요.");
  return buf;
}

/** Validates the JSON body shared by /api/judge and /api/transform. */
export async function readSubmission(req: Request): Promise<Submission> {
  const { image, word, styleId } = await readJson(req);
  if (typeof word !== "string" || !WORDS.includes(word)) throw new HttpError(400, "알 수 없는 제시어예요.");
  const style = typeof styleId === "string" ? getStyle(styleId) : undefined;
  if (!style) throw new HttpError(400, "알 수 없는 화풍이에요.");
  const png = decodeDataUrl(image, "image/png");
  return { png, dataUrl: image as string, word, style };
}

/** Same size and sampling as the studio canvas, so "트렌드 적중" there always matches the price here. */
export async function analyzeDoodle(png: Buffer): Promise<DoodleStats> {
  const { data, info } = await sharp(png).resize(1024, 1024, { fit: "fill" }).flatten({ background: "#ffffff" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return analyzePixels(data, info.width * info.height, 7);
}

/** Exponential: about 10,000 won at 0 points to about 10 billion won at 100 points, rounded to 2 significant digits. */
export function hammerPrice(total: number, multiplier = 1): number {
  const raw = 10_000 * Math.pow(10, (total / 100) * 6) * (0.85 + Math.random() * 0.3) * multiplier;
  return roundPrice(raw);
}


/**
 * Without an API key, local development returns sample data so the UI can be built and tested.
 * In production a missing key is a configuration error.
 */
export function isMockMode(): boolean {
  if (process.env.OPENAI_API_KEY) return false;
  if (process.env.NODE_ENV === "production") throw new HttpError(500, "서버에 OpenAI API 키가 설정되지 않았어요.");
  return true;
}

let client: OpenAI | null = null;
export function openai(): OpenAI {
  client ??= new OpenAI();
  return client;
}

// Best-effort per-IP limit. Serverless instances do not share memory, so this only slows down abuse.
const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(req: Request, bucket: string, limit: number, windowMs = 60 * 60 * 1000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) throw new HttpError(429, "출품이 너무 많아요. 잠시 후 다시 도전해 주세요.");
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  if (err instanceof OpenAI.APIError) {
    if (err.status === 400 && /safety|moderation|content_policy/i.test(err.message)) {
      return Response.json({ error: "경매장 규정상 출품할 수 없는 그림이에요." }, { status: 400 });
    }
    if (err.status === 429) return Response.json({ error: "경매장이 붐벼요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
  return Response.json({ error: "감정 중 문제가 생겼어요. 다시 시도해 주세요." }, { status: 500 });
}
