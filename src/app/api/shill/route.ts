import { roundPrice, type ShillResult } from "@/lib/auction";
import { BIDDERS } from "@/lib/bidders";
import { errorResponse, HttpError, readJson } from "@/lib/server";
import { hmac, signTicket, verifyTicket } from "@/lib/ticket";

/**
 * "바람잡이 투입": a one-time gamble during the live auction.
 * Success doubles the price, failure voids the sale.
 * The outcome is derived from the ticket, so retrying the same ticket gives the same result.
 */
export async function POST(req: Request) {
  try {
    const { token } = await readJson(req);
    const t = verifyTicket(token);
    if (!t) throw new HttpError(400, "경매 정보가 만료됐어요. 새 작품으로 다시 도전해 주세요.");
    if (t.shill) throw new HttpError(400, "바람잡이는 한 번만 투입할 수 있어요.");
    if (t.price <= 0) throw new HttpError(400, "응찰자가 없어 바람잡이를 투입할 수 없어요.");

    const roll = hmac(`shill:${t.n}`);
    const won = roll[0] < 128;
    const others = BIDDERS.filter((b) => b.id !== t.winner);
    const winner = won ? others[roll[1] % others.length].id : t.winner;
    const price = won ? roundPrice(t.price * 2) : 0;

    const next = signTicket({ ...t, price, winner, shill: won ? "won" : "lost" });
    return Response.json({ outcome: won ? "won" : "lost", price, winner, token: next } satisfies ShillResult);
  } catch (err) {
    return errorResponse(err);
  }
}
