export type Bidder = { id: string; name: string; emoji: string; tint: string };

/** Virtual bidders at the live auction. */
export const BIDDERS: Bidder[] = [
  { id: "count", name: "한남동 백작", emoji: "🎩", tint: "#f4e4d4" },
  { id: "crypto", name: "크립토 남작", emoji: "🕶️", tint: "#dfe8f7" },
  { id: "madam", name: "미술관 사모님", emoji: "👒", tint: "#f8dfe6" },
  { id: "seongsu", name: "성수동 갤러리스트", emoji: "🧢", tint: "#e2f1e4" },
  { id: "heir", name: "재벌 3세", emoji: "💎", tint: "#e9e2f7" },
  { id: "phone", name: "익명의 전화 응찰자", emoji: "📞", tint: "#f6efd6" },
];

export function getBidder(id: string): Bidder {
  return BIDDERS.find((b) => b.id === id) ?? BIDDERS[0];
}
