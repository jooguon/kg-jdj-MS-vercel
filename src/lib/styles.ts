export type ArtStyle = {
  id: string;
  name: string;
  en: string;
  tagline: string;
  /** Medium line on the wall label, e.g. "캔버스에 유채" */
  medium: string;
  /** Shown while the artwork is being made. */
  facts: string[];
  /** What the finished painting is, fed to the image model. */
  prompt: string;
  /** One is picked at random per request so results don't all look alike. */
  scenes: string[];
  /** Pop color for the genre chip. Light enough for dark text. */
  color: string;
};

/** Painting styles only: every result is a flat 2D artwork. */
export const ART_STYLES: ArtStyle[] = [
  {
    id: "old-master",
    color: "#ffa45c",
    name: "고전 유화",
    en: "Old Master",
    tagline: "미술관 깊숙이 걸린 그 그림처럼",
    medium: "캔버스에 유채",
    facts: ["명암을 극적으로 대비시키는 기법을 '키아로스쿠로'라고 해요.", "옛 화가들은 달걀노른자에 안료를 섞어 물감을 만들기도 했어요."],
    prompt: "a 17th-century Old Master oil painting with dramatic chiaroscuro, rich glazed colors and fine craquelure",
    scenes: ["candle-lit dark interior", "stormy dusk landscape behind", "lavish still-life table with fruit and drapery", "aristocratic portrait setting with velvet curtain"],
  },
  {
    id: "impressionism",
    color: "#7fd8ff",
    name: "인상주의",
    en: "Impressionism",
    tagline: "빛이 머문 순간을 붓질로",
    medium: "캔버스에 유채",
    facts: ["'인상주의'는 원래 비평가가 비꼬려고 붙인 이름이었어요.", "튜브 물감이 나오면서 화가들이 야외에서 그릴 수 있게 됐어요."],
    prompt: "an Impressionist oil painting with loose broken brushstrokes and shimmering natural light",
    scenes: ["sunlit garden in late spring", "riverside at golden hour", "snowy morning street", "seaside cliff on a windy day"],
  },
  {
    id: "fauvism",
    color: "#ff8a6b",
    name: "야수파",
    en: "Fauvism",
    tagline: "색이 소리를 지르는 그림",
    medium: "캔버스에 유채",
    facts: ["야수파라는 이름은 '야수 같은 색'에 놀란 비평가가 붙였어요.", "야수파 화가들은 하늘을 빨갛게, 얼굴을 초록으로 칠하기도 했어요."],
    prompt: "a Fauvist oil painting with wild, unnatural, intensely saturated colors and bold flat brushwork",
    scenes: ["hot pink sky over an orange field", "emerald and vermilion seaside village", "violet room with patterned wallpaper", "lemon yellow afternoon with cobalt shadows"],
  },
  {
    id: "abstract",
    color: "#ff8cc0",
    name: "추상화",
    en: "Abstract",
    tagline: "형태는 남기고 감정만 터뜨리기",
    medium: "캔버스에 아크릴",
    facts: ["추상표현주의 화가들은 캔버스를 바닥에 깔고 물감을 뿌리기도 했어요.", "추상화는 무엇을 그렸는지보다 어떻게 느껴지는지를 묻는 그림이에요."],
    prompt: "a large abstract expressionist painting with bold gestural marks, drips and layered color fields, where the doodle's silhouette is still readable",
    scenes: ["fiery reds and black", "cool blues with a single yellow slash", "pastel color fields with a black line", "high-contrast black and white with one accent color"],
  },
  {
    id: "pop-art",
    color: "#ffd84d",
    name: "팝아트",
    en: "Pop Art",
    tagline: "원색, 망점, 굵은 윤곽선",
    medium: "캔버스에 실크스크린",
    facts: ["팝아트는 광고와 만화 같은 대중문화를 미술관으로 끌어왔어요.", "인쇄물의 작은 점무늬를 '벤데이 망점'이라고 불러요."],
    prompt: "a 1960s Pop Art silkscreen print with flat saturated colors, Ben-Day dots and thick outlines",
    scenes: ["repeated in a 2x2 grid with different color schemes", "single bold icon on a hot pink background", "comic-panel drama with action lines", "supermarket packaging aesthetic"],
  },
  {
    id: "cubism",
    color: "#bba3ff",
    name: "입체주의",
    en: "Cubism",
    tagline: "여러 시점으로 쪼갠 면과 각",
    medium: "캔버스에 유채",
    facts: ["입체주의는 한 대상을 여러 방향에서 본 모습을 한 화면에 담았어요.", "입체주의 화가들은 신문지를 오려 붙이는 콜라주도 처음 시도했어요."],
    prompt: "a Cubist painting where the subject is fractured into overlapping geometric planes seen from several viewpoints",
    scenes: ["warm ochre and brown palette with newspaper collage", "bright synthetic cubism with blue and orange", "café table still life around it", "musical instruments scattered nearby"],
  },
  {
    id: "surrealism",
    color: "#8fa2ff",
    name: "초현실주의",
    en: "Surrealism",
    tagline: "꿈속처럼 이상한 풍경",
    medium: "캔버스에 유채",
    facts: ["초현실주의는 꿈과 무의식을 그림으로 옮기려 했어요.", "초현실주의 화가들은 일부러 어울리지 않는 사물을 한 장면에 놓곤 했어요."],
    prompt: "a Surrealist oil painting with dreamlike logic, impossible objects and smooth, precise rendering",
    scenes: ["vast desert with long shadows and melting clocks", "floating above clouds at twilight", "a room where the sea pours through the window", "giant subject in a tiny town"],
  },
  {
    id: "watercolor",
    color: "#5fe0b6",
    name: "수채화",
    en: "Watercolor",
    tagline: "물이 번지며 만든 맑은 색",
    medium: "종이에 수채",
    facts: ["수채화는 흰 종이를 남겨서 가장 밝은 빛을 표현해요.", "물감이 마르기 전에 다른 색을 떨어뜨리는 기법을 '웻 온 웻'이라고 해요."],
    prompt: "a delicate watercolor painting with soft wet-in-wet blooms, transparent layers and white paper showing through",
    scenes: ["spring picnic in a park", "rainy city street with reflections", "botanical sketchbook page with flowers", "summer beach at noon"],
  },
  {
    id: "ink-wash",
    color: "#9be87f",
    name: "수묵화",
    en: "Ink Wash",
    tagline: "먹의 번짐과 여백의 미",
    medium: "한지에 수묵",
    facts: ["수묵화는 먹의 진하고 옅음만으로 공간과 깊이를 표현해요.", "수묵화에서 비워 둔 여백도 그림의 일부예요."],
    prompt: "an East Asian ink wash painting on hanji paper with expressive brushwork, wet bleeding ink and generous empty space, with a small red seal stamp",
    scenes: ["misty mountains in the distance", "bamboo grove in the wind", "moonlit night", "plum blossoms in early spring"],
  },
  {
    id: "minhwa",
    color: "#ff8af0",
    name: "한국 민화",
    en: "Minhwa",
    tagline: "오방색의 해학과 복",
    medium: "한지에 채색",
    facts: ["민화는 조선 시대 서민들이 복을 빌며 집에 걸던 그림이에요.", "민화의 호랑이는 무섭기보다 익살스럽게 그려지곤 했어요."],
    prompt: "a Joseon-dynasty Korean folk painting (minhwa) with flat decorative composition, vivid obangsaek colors and playful humor",
    scenes: ["among peonies and butterflies", "with a cheeky tiger and magpie", "under pine trees and a red sun", "on a decorative bookshelf (chaekgeori)"],
  },
];

export function getStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find((s) => s.id === id);
}
