import sharp from "sharp";
import { decodeDataUrl, errorResponse, HttpError, isMockMode, openai, rateLimit, readJson } from "@/lib/server";
import { getStore } from "@/lib/store";
import { paintingSig, sha256, verifyTicket } from "@/lib/ticket";

export const maxDuration = 30;

/** Hangs a sold artwork in the public gallery. Everything except the artist name comes from signed data. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "exhibit", 30);
    const store = getStore();
    if (!store) throw new HttpError(503, "전시관이 아직 준비 중이에요.");

    const body = await readJson(req);
    const t = verifyTicket(body.token);
    if (!t) throw new HttpError(400, "경매 정보가 만료됐어요. 새 작품으로 다시 도전해 주세요.");
    if (t.price <= 0) throw new HttpError(400, "낙찰된 작품만 전시할 수 있어요.");
    if (!t.exhibitable) throw new HttpError(400, "경매장 규정상 이 작품은 전시할 수 없어요.");

    const doodle = decodeDataUrl(body.doodle, "image/png");
    const painting = decodeDataUrl(body.painting, "image/webp", 3_000_000);
    if (sha256(doodle) !== t.h || paintingSig(t.h, painting) !== body.paintingSig) {
      throw new HttpError(400, "작품 정보가 일치하지 않아요.");
    }

    const artist = await checkArtistName(body.artist);

    const [paintingSmall, doodleSmall] = await Promise.all([
      sharp(painting).resize(768, 768).webp({ quality: 80 }).toBuffer(),
      sharp(doodle).flatten({ background: "#ffffff" }).resize(512, 512).webp({ quality: 85 }).toBuffer(),
    ]);

    const saved = await store.save(
      {
        id: t.n,
        artist,
        title: t.title,
        word: t.word,
        styleId: t.styleId,
        price: t.price,
        total: t.total,
        comment: t.comment,
        winner: t.winner,
        createdAt: Date.now(),
      },
      { painting: paintingSmall, doodle: doodleSmall },
    );
    return Response.json({ id: t.n, alreadyExhibited: !saved });
  } catch (err) {
    return errorResponse(err);
  }
}

async function checkArtistName(value: unknown): Promise<string> {
  const name = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!name) return "무명 작가";
  if ([...name].length > 12) throw new HttpError(400, "작가명은 12자까지 쓸 수 있어요.");
  if (/https?:|www\.|\.com|[<>]/i.test(name)) throw new HttpError(400, "작가명에 링크는 쓸 수 없어요.");
  if (!isMockMode()) {
    const res = await openai().moderations.create({ model: "omni-moderation-latest", input: name });
    if (res.results.some((r) => r.flagged)) throw new HttpError(400, "작가명을 다른 이름으로 바꿔 주세요.");
  }
  return name;
}
