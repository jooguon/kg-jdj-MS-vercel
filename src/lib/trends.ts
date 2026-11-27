/** Ink colors on the drawing canvas. Also used to analyze a doodle's colors. */
export const INKS = [
  { id: "black", name: "먹", value: "#1f1b17", rgb: [31, 27, 23] },
  { id: "red", name: "주홍", value: "#d1452f", rgb: [209, 69, 47] },
  { id: "blue", name: "군청", value: "#2a4fa8", rgb: [42, 79, 168] },
  { id: "gold", name: "황금", value: "#e0a526", rgb: [224, 165, 38] },
  { id: "green", name: "초록", value: "#2f8a4c", rgb: [47, 138, 76] },
] as const;

export type InkId = (typeof INKS)[number]["id"];

export type DoodleStats = {
  /** Share of the canvas that is not white, 0..1 */
  coverage: number;
  /** Share of inked pixels per ink color, 0..1 */
  share: Record<InkId, number>;
  /** Ink colors that make up at least 3% of the drawing */
  colors: InkId[];
};

/** Works on RGBA pixel data from a canvas (browser) or sharp (server). Samples every `step`-th pixel. */
function hue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const COLORED_INKS = INKS.filter((ink) => ink.id !== "black").map((ink) => ({ id: ink.id, hue: hue(ink.rgb[0], ink.rgb[1], ink.rgb[2]) }));

export function analyzePixels(data: ArrayLike<number>, pixelCount: number, step = 3): DoodleStats {
  const counts: Record<InkId, number> = { black: 0, red: 0, blue: 0, gold: 0, green: 0 };
  let inked = 0;
  let sampled = 0;
  for (let p = 0; p < pixelCount; p += step) {
    const i = p * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sampled++;
    if (Math.min(r, g, b) > 225) continue;
    inked++;
    // Grayish pixels are black ink or its anti-aliased edges; colored pixels go to the nearest ink by hue,
    // which stays stable when the ink is blended with the white paper.
    if (Math.max(r, g, b) - Math.min(r, g, b) < 45) {
      // Light gray is just the soft edge of a stroke: it counts as coverage but not as a color.
      if (Math.max(r, g, b) < 160) counts.black++;
      continue;
    }
    const h = hue(r, g, b);
    let best = COLORED_INKS[0];
    let bestDist = Infinity;
    for (const ink of COLORED_INKS) {
      const d = Math.min(Math.abs(h - ink.hue), 360 - Math.abs(h - ink.hue));
      if (d < bestDist) {
        bestDist = d;
        best = ink;
      }
    }
    counts[best.id]++;
  }
  const classified = Object.values(counts).reduce((x, y) => x + y, 0);
  const share = Object.fromEntries(INKS.map((ink) => [ink.id, classified ? counts[ink.id] / classified : 0])) as Record<InkId, number>;
  return {
    coverage: sampled ? inked / sampled : 0,
    share,
    colors: INKS.filter((ink) => share[ink.id] >= 0.03).map((ink) => ink.id),
  };
}

export type Trend = {
  id: string;
  name: string;
  hint: string;
  multiplier: number;
  test: (s: DoodleStats) => boolean;
};

/** One trend per day. Drawings that match it sell for more. */
export const TRENDS: Trend[] = [
  { id: "void", name: "극한의 여백", hint: "캔버스를 3% 미만만 채우면", multiplier: 1.8, test: (s) => s.coverage > 0 && s.coverage < 0.03 },
  { id: "red", name: "빨강의 시대", hint: "주홍색을 30% 이상 쓰면", multiplier: 1.6, test: (s) => s.share.red >= 0.3 },
  { id: "rainbow", name: "무지개 연대", hint: "4가지 색 이상 쓰면", multiplier: 1.7, test: (s) => s.colors.length >= 4 },
  { id: "full", name: "꽉 찬 캔버스", hint: "캔버스를 15% 이상 채우면", multiplier: 1.5, test: (s) => s.coverage >= 0.15 },
  { id: "blue", name: "푸른 시기", hint: "군청색을 30% 이상 쓰면", multiplier: 1.6, test: (s) => s.share.blue >= 0.3 },
  { id: "mono", name: "흑백의 품격", hint: "먹색 한 가지만 쓰면", multiplier: 1.4, test: (s) => s.colors.length === 1 && s.colors[0] === "black" },
  { id: "gold", name: "황금 만능주의", hint: "황금색을 30% 이상 쓰면", multiplier: 1.6, test: (s) => s.share.gold >= 0.3 },
];

/** Today's trend, switching at midnight Korea time. */
export function todayTrend(now = Date.now()): Trend {
  const day = Math.floor((now + 9 * 3600_000) / 86_400_000);
  return TRENDS[day % TRENDS.length];
}
