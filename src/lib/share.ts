/**
 * Phones: opens the share sheet (KakaoTalk, Instagram, Messages…), with an image attached when given.
 * Desktop, or when sharing fails: copies the text and link instead.
 */
export async function shareLink(o: { title: string; text: string; url: string; file?: File | null }): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
    const attempts: ShareData[] = [];
    if (o.file && navigator.canShare?.({ files: [o.file] })) attempts.push({ title: o.title, text: `${o.text}\n${o.url}`, files: [o.file] });
    attempts.push({ title: o.title, text: o.text, url: o.url });
    for (const data of attempts) {
      try {
        await navigator.share(data);
        return "shared";
      } catch (e) {
        if ((e as Error).name === "AbortError") return "cancelled";
      }
    }
  }
  try {
    await navigator.clipboard.writeText(`${o.text}\n${o.url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
