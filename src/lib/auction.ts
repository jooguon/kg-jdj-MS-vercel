export type Scores = { clarity: number; creativity: number; finish: number };

export type Bid = { bidder: string; line: string };

/** What /api/judge returns. `token` is a signed ticket the server checks later (shill, exhibit). */
export type Appraisal = {
  title: string;
  guess: string;
  comment: string;
  scores: Scores;
  total: number;
  bids: Bid[];
  trend: { id: string; name: string; multiplier: number; applied: boolean };
  /** Hammer price in KRW before any shill. 0 means no sale. */
  price: number;
  exhibitable: boolean;
  token: string;
};

export type ShillResult = { outcome: "won" | "lost"; price: number; winner: string; token: string };

export const SCORE_ITEMS: { key: keyof Scores; label: string; max: number }[] = [
  { key: "clarity", label: "전달력", max: 40 },
  { key: "creativity", label: "창의성", max: 30 },
  { key: "finish", label: "완성도", max: 30 },
];

/** Below this score nobody bids. */
export const RESERVE_SCORE = 30;

/** 3,200,000,000 -> "32억 원", 125,000,000 -> "1억 2,500만 원" */
export function formatWon(n: number): string {
  if (n <= 0) return "0 원";
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (man) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (!parts.length) parts.push(n.toLocaleString("ko-KR"));
  return `${parts.join(" ")} 원`;
}

/** ₩128,000,000 */
export function formatWonDigits(n: number): string {
  return `₩${Math.max(0, Math.round(n)).toLocaleString("ko-KR")}`;
}

export function lotNumber(): string {
  return String(Math.floor(Math.random() * 900) + 100).padStart(4, "0");
}

/** Rounds to 2 significant digits so prices look like real bids (min 10,000 won). */
export function roundPrice(raw: number): number {
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(raw, 1))) - 1));
  return Math.max(10_000, Math.round(raw / mag) * mag);
}
