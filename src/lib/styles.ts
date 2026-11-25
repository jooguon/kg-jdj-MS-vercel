export type ArtStyle = {
  id: string;
  name: string;
  en: string;
  tagline: string;
  /** Shown while the painting is being generated. */
  facts: string[];
  /** Style description fed to the image model. */
  prompt: string;
  /** Two colors used for the style card swatch. */
  swatch: [string, string];
};

export const ART_STYLES: ArtStyle[] = [
  {
    id: "impressionism",
    name: "인상주의",
    en: "Impressionism",
    tagline: "빛이 머문 순간을 짧은 붓질로",
    facts: [
      "'인상주의'라는 이름은 원래 비평가가 비꼬려고 붙인 말이었어요.",
      "인상주의 화가들은 튜브 물감 덕분에 야외에서 그림을 그릴 수 있었어요.",
    ],
    prompt:
      "French Impressionist oil painting: visible short broken brushstrokes, soft natural daylight, luminous pastel palette, plein-air atmosphere, shimmering reflections",
    swatch: ["#9cc5e0", "#f2d58c"],
  },
  {
    id: "post-impressionism",
    name: "후기인상주의",
    en: "Post-Impressionism",
    tagline: "소용돌이치는 두꺼운 붓터치",
    facts: [
      "후기인상주의는 색과 붓질로 감정을 드러내려 했어요.",
      "물감을 두껍게 바르는 기법을 '임파스토'라고 불러요.",
    ],
    prompt:
      "Post-Impressionist oil painting: thick swirling impasto brushstrokes, bold complementary colors (cobalt blue and chrome yellow), expressive rhythmic lines, dramatic night or sunlit sky",
    swatch: ["#1f4e9c", "#f0c419"],
  },
  {
    id: "cubism",
    name: "입체주의",
    en: "Cubism",
    tagline: "여러 시점으로 쪼갠 면과 각",
    facts: [
      "입체주의는 한 대상을 여러 방향에서 본 모습을 한 화면에 담았어요.",
      "입체주의 초기 그림은 갈색과 회색 위주의 차분한 색을 썼어요.",
    ],
    prompt:
      "Analytical and synthetic Cubist painting: subject fractured into overlapping geometric planes seen from multiple viewpoints, angular facets, muted ochre, brown and grey palette with a few accent colors, collage-like texture",
    swatch: ["#8a6f4d", "#c9b79c"],
  },
  {
    id: "surrealism",
    name: "초현실주의",
    en: "Surrealism",
    tagline: "꿈속처럼 녹아내리는 풍경",
    facts: [
      "초현실주의는 꿈과 무의식을 그림으로 옮기려 했어요.",
      "초현실주의 화가들은 일부러 어울리지 않는 사물을 한 장면에 놓곤 했어요.",
    ],
    prompt:
      "Surrealist oil painting: dreamlike desert landscape with long shadows, melting and impossible forms, hyper-smooth academic rendering, uncanny calm, vast sky",
    swatch: ["#d98e4a", "#5a7fa8"],
  },
  {
    id: "pop-art",
    name: "팝아트",
    en: "Pop Art",
    tagline: "원색, 망점, 굵은 윤곽선",
    facts: [
      "팝아트는 광고와 만화 같은 대중문화를 미술로 끌어왔어요.",
      "인쇄물의 작은 점무늬를 '벤데이 망점'이라고 불러요.",
    ],
    prompt:
      "1960s Pop Art screen print: flat saturated primary colors, Ben-Day halftone dots, thick black comic-book outlines, bold graphic composition, no speech bubbles or text",
    swatch: ["#e63946", "#ffd60a"],
  },
  {
    id: "renaissance",
    name: "르네상스 유화",
    en: "Renaissance",
    tagline: "빛과 어둠으로 빚은 고전",
    facts: [
      "르네상스 화가들은 원근법으로 평면에 깊이를 만들었어요.",
      "명암을 강하게 대비시키는 기법을 '키아로스쿠로'라고 해요.",
    ],
    prompt:
      "High Renaissance oil painting on wood panel: chiaroscuro lighting, sfumato soft edges, rich glazed earth tones, classical balanced composition, fine craquelure varnish texture",
    swatch: ["#5b3a29", "#c8a46a"],
  },
  {
    id: "ink-wash",
    name: "수묵화",
    en: "Ink Wash",
    tagline: "먹의 번짐과 여백의 미",
    facts: [
      "수묵화는 먹의 진하고 옅음만으로 공간과 깊이를 표현해요.",
      "수묵화에서 비워 둔 여백도 그림의 일부예요.",
    ],
    prompt:
      "East Asian ink wash painting on hanji paper: expressive black ink brushwork with varied tonal gradations, wet bleeding edges, generous empty space, a small red seal stamp in the corner, no written characters",
    swatch: ["#2b2b2b", "#e8e2d4"],
  },
  {
    id: "minhwa",
    name: "한국 민화",
    en: "Minhwa",
    tagline: "오방색의 해학과 복",
    facts: [
      "민화는 조선 시대 서민들이 복을 빌며 집에 걸던 그림이에요.",
      "민화의 호랑이는 무섭기보다 익살스럽게 그려지곤 했어요.",
    ],
    prompt:
      "Joseon-dynasty Korean folk painting (minhwa): flat decorative composition, vivid obangsaek colors (blue, red, yellow, white, black), playful humorous character, mineral pigments on aged paper, stylized peonies, clouds and pine trees",
    swatch: ["#c0392b", "#2e86ab"],
  },
];

export function getStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find((s) => s.id === id);
}
