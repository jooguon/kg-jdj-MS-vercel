import { getStore, type ImageKind } from "@/lib/store";

const KINDS: ImageKind[] = ["painting", "doodle"];

/** Serves exhibited images. They never change, so CDNs and browsers can cache them forever. */
export async function GET(_req: Request, ctx: RouteContext<"/api/art/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  if (!KINDS.includes(kind as ImageKind) || !/^[\w-]{4,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const buf = await getStore()?.image(id, kind as ImageKind);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
