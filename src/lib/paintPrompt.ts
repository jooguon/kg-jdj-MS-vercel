import type { ArtStyle } from "./styles";

/** Prompt sent to the image edit API to turn a doodle into a painting. */
export function buildArtPrompt(style: ArtStyle, word: string, scene: string): string {
  return [
    `Turn this quick 15-second doodle of "${word}" into a finished, gallery-worthy painting: ${style.prompt}.`,
    `Setting and variation: ${scene}.`,
    "Use the doodle as the concept and rough composition: keep its recognizable silhouette, pose and quirky extra marks so people can tell it came from this sketch, but freely reinterpret colors, details, lighting and surroundings like a serious painter would.",
    "It must be a flat two-dimensional painting that fills the whole image edge to edge: no sculpture, no 3D object, no photo of a room, no frame and no wall.",
    "No text, letters, signatures or watermarks.",
  ].join(" ");
}

export function pickScene(style: ArtStyle): string {
  return style.scenes[Math.floor(Math.random() * style.scenes.length)];
}
