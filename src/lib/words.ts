/** Prompts players draw. The API only accepts words from this list. */
export const WORDS = [
  "고양이", "강아지", "기린", "펭귄", "상어", "문어", "달팽이", "거북이", "토끼", "공룡",
  "용", "유령", "로봇", "우주비행사", "눈사람", "산타", "해적선", "등대", "화산", "무지개",
  "자전거", "기차", "비행기", "열기구", "우산", "왕관", "안경", "기타", "선인장", "해바라기",
  "피자", "햄버거", "케이크", "아이스크림", "커피", "수박", "성", "집", "나무", "달",
];

export function randomWord(exclude?: string): string {
  const pool = exclude ? WORDS.filter((w) => w !== exclude) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}
