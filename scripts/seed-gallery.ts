// Fills the LOCAL dev gallery (.data/gallery) with sample artworks to preview the layout.
// Usage: node scripts/seed-gallery.ts [count]
// It never touches the production store.
import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ART_STYLES } from "../src/lib/styles.ts";
import { BIDDERS } from "../src/lib/bidders.ts";

const count = Number(process.argv[2] ?? 14);
const dir = path.join(process.cwd(), ".data", "gallery");
await mkdir(dir, { recursive: true });

const titles = ["고독한 자본의 야옹", "출근길의 실존", "월요일의 기하학", "무제 #15초", "소유의 허무", "어느 오후의 소용돌이", "침묵하는 꼬리", "자본주의 고양이", "여백의 반란", "마감 직전의 초상", "편의점 앞 비너스", "부동산의 꿈", "새벽 세 시의 선", "점 두 개의 우주"];
const artists = ["발가락 피카소", "15초 렘브란트", "무명 작가", "야근하는 모네", "낙서왕", "손목 스냅", "그림치", "성수동 반고흐"];
const doodle = await sharp("public/examples/doodle.png").resize(512, 512).webp({ quality: 85 }).toBuffer();

// Only the styles that have an example painting in public/examples.
const styles = ART_STYLES.filter((s) => existsSync(`public/examples/${s.id}.webp`));

for (let i = 0; i < count; i++) {
  const style = styles[i % styles.length];
  const id = `seed${String(i).padStart(3, "0")}`;
  const total = 30 + Math.floor(Math.random() * 65);
  const price = Math.round((10_000 * Math.pow(10, (total / 100) * 6)) / 10_000) * 10_000;
  const painting = await sharp(`public/examples/${style.id}.webp`).resize(768, 768).webp({ quality: 80 }).toBuffer();
  await writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify({
      id,
      artist: artists[i % artists.length],
      title: titles[i % titles.length],
      word: "고양이",
      styleId: style.id,
      price,
      total,
      comment: "샘플 작품입니다. 붓끝에서 15초의 절박함이 느껴집니다.",
      winner: BIDDERS[i % BIDDERS.length].id,
      createdAt: Date.now() - i * 60_000,
    }),
  );
  await writeFile(path.join(dir, `${id}.painting.webp`), painting);
  await writeFile(path.join(dir, `${id}.doodle.webp`), doodle);
}
console.log(`seeded ${count} artworks into ${dir}`);
