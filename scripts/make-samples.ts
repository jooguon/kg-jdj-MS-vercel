// Generates the example artworks shown in the lobby from public/examples/doodle.png.
// Usage: node scripts/make-samples.ts sculpture neon art-toy:0   (needs OPENAI_API_KEY)
// "id:n" picks scene n of that style instead of a random one.
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { ART_STYLES } from "../src/lib/styles.ts";
import { buildArtPrompt, pickScene } from "../src/lib/paintPrompt.ts";

const picks = new Map(process.argv.slice(2).map((a) => a.split(":") as [string, string?]));
const ids = [...picks.keys()];
if (!ids.length) throw new Error("Pass one or more style ids");
const client = new OpenAI();
const doodle = await readFile("public/examples/doodle.png");

await Promise.all(
  ART_STYLES.filter((s) => ids.includes(s.id)).map(async (style) => {
    const t = Date.now();
    const res = await client.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
      image: await toFile(doodle, "doodle.png", { type: "image/png" }),
      prompt: buildArtPrompt(style, "고양이", picks.get(style.id) ? style.scenes[Number(picks.get(style.id))] : pickScene(style)),
      quality: "medium",
      size: "1024x1024",
      output_format: "png",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error(`no image for ${style.id}`);
    await sharp(Buffer.from(b64, "base64")).resize(800, 800).webp({ quality: 82 }).toFile(`public/examples/${style.id}.webp`);
    console.log(`${style.id} done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }),
);
