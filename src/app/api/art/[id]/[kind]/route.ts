import sharp from "sharp";
import { getStore, type ImageKind } from "@/lib/store";

const KINDS = ["painting", "doodle", "og"] as const;

/**
 * Serves exhibited images. They never change, so CDNs and browsers can cache them forever.
 * "og" is the painting as a JPEG, for link previews (Slack, KakaoTalk) that don't read WebP.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/art/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  if (!KINDS.includes(kind as (typeof KINDS)[number]) || !/^[\w-]{4,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const og = kind === "og";
  const buf = await getStore()?.image(id, og ? "painting" : (kind as ImageKind));
  if (!buf) return new Response("Not found", { status: 404 });
  const body = og ? await sharp(buf).resize(800, 800).jpeg({ quality: 82 }).toBuffer() : buf;
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": og ? "image/jpeg" : "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
