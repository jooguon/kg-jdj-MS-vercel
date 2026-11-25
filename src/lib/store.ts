import "server-only";
import { Redis } from "@upstash/redis";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** An exhibited artwork. Images are stored separately and served from /api/art/[id]/[kind]. */
export type Artwork = {
  id: string;
  artist: string;
  title: string;
  word: string;
  styleId: string;
  price: number;
  total: number;
  comment: string;
  winner: string;
  createdAt: number;
};

export type ImageKind = "painting" | "doodle";

const LIST_LIMIT = 300;

interface Store {
  save(art: Artwork, images: Record<ImageKind, Buffer>): Promise<boolean>;
  list(): Promise<Artwork[]>;
  image(id: string, kind: ImageKind): Promise<Buffer | null>;
}

/** Upstash Redis (Vercel Marketplace). Holds metadata, a price-sorted index and base64 images. */
class RedisStore implements Store {
  constructor(private redis: Redis) {}

  async save(art: Artwork, images: Record<ImageKind, Buffer>) {
    const created = await this.redis.set(`art:${art.id}`, art, { nx: true });
    if (!created) return false;
    await Promise.all([
      this.redis.set(`art:${art.id}:painting`, images.painting.toString("base64")),
      this.redis.set(`art:${art.id}:doodle`, images.doodle.toString("base64")),
      this.redis.zadd("arts:by-price", { score: art.price, member: art.id }),
    ]);
    return true;
  }

  async list() {
    const ids = await this.redis.zrange<string[]>("arts:by-price", 0, LIST_LIMIT - 1, { rev: true });
    if (!ids.length) return [];
    const arts = await this.redis.mget<(Artwork | null)[]>(...ids.map((id) => `art:${id}`));
    return arts.filter((a): a is Artwork => !!a);
  }

  async image(id: string, kind: ImageKind) {
    const b64 = await this.redis.get<string>(`art:${id}:${kind}`);
    return b64 ? Buffer.from(b64, "base64") : null;
  }
}

/** Local development fallback: files under .data/gallery */
class FileStore implements Store {
  private dir = path.join(process.cwd(), ".data", "gallery");

  async save(art: Artwork, images: Record<ImageKind, Buffer>) {
    await mkdir(this.dir, { recursive: true });
    try {
      await writeFile(path.join(this.dir, `${art.id}.json`), JSON.stringify(art), { flag: "wx" });
    } catch {
      return false;
    }
    await Promise.all([
      writeFile(path.join(this.dir, `${art.id}.painting.webp`), images.painting),
      writeFile(path.join(this.dir, `${art.id}.doodle.webp`), images.doodle),
    ]);
    return true;
  }

  async list() {
    const files = await readdir(this.dir).catch(() => [] as string[]);
    const arts = await Promise.all(
      files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await readFile(path.join(this.dir, f), "utf8")) as Artwork),
    );
    return arts.sort((a, b) => b.price - a.price).slice(0, LIST_LIMIT);
  }

  async image(id: string, kind: ImageKind) {
    if (!/^[\w-]+$/.test(id)) return null;
    return readFile(path.join(this.dir, `${id}.${kind}.webp`)).catch(() => null);
  }
}

let store: Store | null | undefined;

/** Returns null when no storage is configured (production without Redis). */
export function getStore(): Store | null {
  if (store !== undefined) return store;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) store = new RedisStore(new Redis({ url, token }));
  else store = process.env.NODE_ENV === "production" ? null : new FileStore();
  return store;
}
