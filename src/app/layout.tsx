import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
// Pretendard, split by unicode range so only the glyphs a page uses are downloaded.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { InAppNotice } from "@/components/InAppNotice";

// Latin accent for small editorial details (Lot numbers, "Live", rank numerals).
const accent = Instrument_Serif({
  variable: "--font-accent",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "발더비 경매장",
  description: "15초 만에 그린 발그림이 작품이 되어 경매에 오릅니다. 당신의 발그림, 얼마일까요?",
};

export const viewport: Viewport = {
  themeColor: "#fbfaf6",
  width: "device-width",
  initialScale: 1,
  // Draw under the notch/home bar; content is kept clear with safe-area padding in globals.css.
  viewportFit: "cover",
  // The on-screen keyboard shrinks the layout instead of covering the name input.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${accent.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <InAppNotice />
        {children}
      </body>
    </html>
  );
}
