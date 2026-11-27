import { toFile } from "openai";
import sharp from "sharp";
import { buildArtPrompt, pickScene } from "@/lib/paintPrompt";
import { errorResponse, isMockMode, openai, rateLimit, readSubmission } from "@/lib/server";
import { paintingSig, sha256 } from "@/lib/ticket";

export const maxDuration = 120;

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";
const QUALITY = (process.env.OPENAI_IMAGE_QUALITY || "low") as "low" | "medium" | "high";

export async function POST(req: Request) {
  try {
    const sub = await readSubmission(req);
    rateLimit(req, "transform", 20);
    const doodleHash = sha256(sub.png);

    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 3000));
      const buf = await sharp(sub.png).webp({ quality: 85 }).toBuffer();
      return Response.json({ image: `data:image/webp;base64,${buf.toString("base64")}`, sig: paintingSig(doodleHash, buf), mock: true });
    }

    const res = await openai().images.edit({
      model: MODEL,
      image: await toFile(sub.png, "doodle.png", { type: "image/png" }),
      prompt: buildArtPrompt(sub.style, sub.word, pickScene(sub.style)),
      quality: QUALITY,
      size: "1024x1024",
      output_format: "webp",
      output_compression: 85,
      n: 1,
    });

    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");
    const buf = Buffer.from(b64, "base64");
    return Response.json({ image: `data:image/webp;base64,${b64}`, sig: paintingSig(doodleHash, buf) });
  } catch (err) {
    return errorResponse(err);
  }
}
