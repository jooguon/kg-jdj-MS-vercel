export type Bidder = {
  id: string;
  name: string;
  /** Fallback when the portrait can't load, and used in plain-text places. */
  emoji: string;
  /** How they talk — fed to the AI that writes their bidding lines. */
  persona: string;
};

/** Virtual bidders at the live auction. Portraits live at /bidders/{id}.webp */
export const BIDDERS: Bidder[] = [
  { id: "count", name: "한남동 백작", emoji: "🎩", persona: "우아한 허세, 귀족 말투" },
  { id: "crypto", name: "크립토 남작", emoji: "🕶️", persona: "NFT·코인 드립" },
  { id: "madam", name: "미술관 사모님", emoji: "👒", persona: "감성 과몰입, 쉽게 감동함" },
  { id: "seongsu", name: "성수동 갤러리스트", emoji: "🧢", persona: "힙한 큐레이터 말투" },
  { id: "heir", name: "재벌 3세", emoji: "💎", persona: "심드렁한 돈 자랑" },
  { id: "phone", name: "익명의 전화 응찰자", emoji: "📞", persona: "짧고 미스터리한 말" },
  { id: "landlord", name: "강남 건물주", emoji: "🏢", persona: "월세·건물로 셈하는 여유" },
  { id: "cto", name: "판교 CTO", emoji: "💻", persona: "개발자 용어와 스톡옵션 드립" },
  { id: "youtuber", name: "재테크 유튜버", emoji: "📈", persona: "과장된 방송 톤, 구독자에게 말함" },
  { id: "student", name: "미대 입시생", emoji: "🎓", persona: "입시 기준으로 진지하게 채점" },
  { id: "curator", name: "국립미술관 학예사", emoji: "🏛️", persona: "어려운 학술 용어 남발" },
  { id: "newyork", name: "뉴욕 컬렉터", emoji: "🗽", persona: "영어를 섞어 말함" },
  { id: "grandma", name: "시골 큰손 할머니", emoji: "👵", persona: "정 많은 사투리 반말" },
  { id: "robot", name: "AI 컬렉터 로봇", emoji: "🤖", persona: "확률과 분석으로 말하는 기계 말투" },
  { id: "catlover", name: "고양이 집사", emoji: "🐈", persona: "고양이 그림이면 이성을 잃음" },
  { id: "trainee", name: "아이돌 연습생", emoji: "🎤", persona: "밝고 귀여운 말투, 팬 이야기" },
  { id: "cvs", name: "편의점 사장님", emoji: "🏪", persona: "가게에 걸 생각부터 하는 생활밀착형" },
  { id: "influencer", name: "인테리어 인플루언서", emoji: "📸", persona: "감성 피드·인테리어 말투" },
  { id: "critic", name: "은퇴한 평론가", emoji: "🧐", persona: "투덜대다가 결국 삼" },
  { id: "prince", name: "발더비아 왕국 왕자", emoji: "👑", persona: "과장된 왕족 말투(짐, ~노라)" },
  { id: "andromeda", name: "안드로메다 외계인", emoji: "👽", persona: "지구 문화를 오해하는 번역기 말투, 끝에 '삐릭'" },
];

export function getBidder(id: string): Bidder {
  return BIDDERS.find((b) => b.id === id) ?? BIDDERS[0];
}

export const bidderImage = (id: string) => `/bidders/${getBidder(id).id}.webp`;
