import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed tickets let the client carry auction results between requests
 * without being able to change the price, title or images.
 */
export type Ticket = {
  /** Random id; also becomes the artwork id when exhibited. */
  n: string;
  /** sha256 of the doodle PNG bytes */
  h: string;
  word: string;
  styleId: string;
  title: string;
  comment: string;
  total: number;
  price: number;
  winner: string;
  exhibitable: boolean;
  shill?: "won" | "lost";
  exp: number;
};

const TTL_MS = 3 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SIGNING_SECRET || process.env.OPENAI_API_KEY;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SIGNING_SECRET is not set");
  return "local-dev-secret";
}

export function hmac(data: string): Buffer {
  return createHmac("sha256", secret()).update(data).digest();
}

export function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

export function newTicketId(): string {
  return randomBytes(9).toString("base64url");
}

export function signTicket(t: Omit<Ticket, "exp"> & { exp?: number }): string {
  const body = Buffer.from(JSON.stringify({ ...t, exp: t.exp ?? Date.now() + TTL_MS })).toString("base64url");
  return `${body}.${hmac(body).toString("base64url")}`;
}

export function verifyTicket(token: unknown): Ticket | null {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = hmac(body);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString()) as Ticket;
    return t.exp > Date.now() ? t : null;
  } catch {
    return null;
  }
}

/** Ties a generated painting to the doodle it came from. */
export function paintingSig(doodleHash: string, painting: Buffer): string {
  return hmac(`painting:${doodleHash}:${sha256(painting)}`).toString("base64url");
}
