"use client";

import { useSyncExternalStore } from "react";

export type Device = {
  /** Detected on the client only; false during server rendering. */
  ready: boolean;
  /** Finger instead of mouse (phones, tablets). */
  touch: boolean;
  ios: boolean;
  android: boolean;
  /** Which in-app browser we're inside, if any (they often block downloads). */
  inApp: "kakao" | "instagram" | "facebook" | "line" | "naver" | "other" | null;
};

const SERVER: Device = { ready: false, touch: false, ios: false, android: false, inApp: null };

let cached: { key: string; value: Device } | null = null;

function detect(): Device {
  const ua = navigator.userAgent;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const key = `${ua}|${touch}`;
  if (cached?.key === key) return cached.value;

  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const inApp = /KAKAOTALK/i.test(ua)
    ? "kakao"
    : /Instagram/i.test(ua)
      ? "instagram"
      : /FBAN|FBAV|FB_IAB/i.test(ua)
        ? "facebook"
        : /\bLine\//i.test(ua)
          ? "line"
          : /NAVER\(inapp/i.test(ua)
            ? "naver"
            : /; wv\)|DaumApps|everytimeApp/i.test(ua)
              ? "other"
              : null;

  const value: Device = { ready: true, touch, ios, android, inApp };
  cached = { key, value };
  return value;
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Browser/device facts for small UX adjustments. Layout itself is handled by CSS. */
export function useDevice(): Device {
  return useSyncExternalStore(subscribe, detect, () => SERVER);
}

/** Link that reopens the current page outside an in-app browser, where the platform allows it. */
export function externalBrowserUrl(device: Device, href: string): string | null {
  if (device.inApp === "kakao") return `kakaotalk://web/openExternal?url=${encodeURIComponent(href)}`;
  if (device.android) {
    const u = new URL(href);
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
  }
  return null;
}
