import type { ArtStyle } from "./styles";

/** Prompt sent to the image edit API to turn a doodle into a painting. */
export function buildPaintPrompt(style: ArtStyle, word: string): string {
  return [
    `Reimagine this quick 15-second hand-drawn doodle as a museum-quality masterpiece in this style: ${style.prompt}.`,
    `The doodle is meant to show: "${word}".`,
    "Keep the original composition, subject placement and the doodle's charming naive proportions clearly recognizable, so a viewer can tell this painting came from this exact sketch.",
    "Fill the whole canvas with a fitting background in the same style.",
    "No text, no letters, no signature, no picture frame, no museum wall — only the artwork itself.",
  ].join(" ");
}
