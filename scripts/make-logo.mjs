// Turns the title artwork into a white-on-transparent PNG (alpha kept from the source)
// so it can be used as a CSS mask and recolored freely.
// Usage: node scripts/make-logo.mjs <source image> public/logo-mask.png
import sharp from "sharp";
const [src, out] = process.argv.slice(2);
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < info.width * info.height; i++) {
  data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 255;
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 1 })
  .png({ compressionLevel: 9 })
  .toFile(out);
const m = await sharp(out).metadata();
console.log(`${m.width}x${m.height}`);
