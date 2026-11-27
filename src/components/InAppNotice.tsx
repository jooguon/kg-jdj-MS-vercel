"use client";

import { useState } from "react";
import { externalBrowserUrl, useDevice } from "@/lib/device";

const NAMES: Record<string, string> = {
  kakao: "카카오톡",
  instagram: "인스타그램",
  facebook: "페이스북",
  line: "라인",
  naver: "네이버 앱",
  other: "앱",
};

/** In-app browsers (KakaoTalk, Instagram…) often block image downloads, so suggest a real browser. */
export function InAppNotice() {
  const device = useDevice();
  const [closed, setClosed] = useState(false);
  if (!device.inApp || closed) return null;

  const external = externalBrowserUrl(device, window.location.href);
  return (
    <div className="flex items-center gap-3 bg-ink px-4 py-2.5 text-[13px] text-white">
      <p className="min-w-0 flex-1 leading-snug">
        {NAMES[device.inApp]} 안에서는 증서 저장이 안 될 수 있어요.{" "}
        {external ? "외부 브라우저로 열면 더 잘 동작해요." : device.ios ? "오른쪽 아래 ⋯ 메뉴에서 ‘Safari로 열기’를 눌러 주세요." : "메뉴에서 ‘다른 브라우저로 열기’를 눌러 주세요."}
      </p>
      {external && (
        <a href={external} className="shrink-0 rounded-full bg-yellow px-3 py-1.5 font-bold text-ink">
          브라우저로 열기
        </a>
      )}
      <button type="button" onClick={() => setClosed(true)} aria-label="닫기" className="shrink-0 px-1 text-white/70">
        ✕
      </button>
    </div>
  );
}
