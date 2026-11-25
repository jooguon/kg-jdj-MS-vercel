// Generates the style preview images shown on the style cards and the lobby.
// Usage: node scripts/make-samples.ts            (needs OPENAI_API_KEY)
//        node scripts/make-samples.ts minhwa     (only the given style ids)
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { ART_STYLES } from "../src/lib/styles.ts";
import { buildPaintPrompt } from "../src/lib/paintPrompt.ts";

const only = process.argv.slice(2);
const client = new OpenAI();
const doodle = await readFile("public/samples/doodle.png");

await Promise.all(
  ART_STYLES.filter((s) => !only.length || only.includes(s.id)).map(async (style) => {
    const t = Date.now();
    const res = await client.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
      image: await toFile(doodle, "doodle.png", { type: "image/png" }),
      prompt: buildPaintPrompt(style, "고양이"),
      quality: "medium",
      size: "1024x1024",
      output_format: "png",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error(`no image for ${style.id}`);
    await sharp(Buffer.from(b64, "base64")).resize(640, 640).webp({ quality: 82 }).toFile(`public/samples/${style.id}.webp`);
    console.log(`${style.id} done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }),
);
