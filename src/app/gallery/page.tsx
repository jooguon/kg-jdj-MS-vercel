import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GalleryView } from "@/components/GalleryView";
import { TopBar } from "@/components/ui";
import { formatPrice } from "@/lib/auction";
import { getStore } from "@/lib/store";

const BASE_META = {
  title: "전시관 · 발더비 경매장",
  description: "발더비 경매장에서 낙찰된 발그림들. 가장 비싸게 팔린 작품은 무엇일까요?",
};

/** A shared link (/gallery?art=id) previews that work: its title, artist, price and painting. */
export async function generateMetadata({ searchParams }: PageProps<"/gallery">): Promise<Metadata> {
  const { art: id } = await searchParams;
  const art = typeof id === "string" ? (await getStore()?.list())?.find((a) => a.id === id) : undefined;
  if (!art) return BASE_META;
  const title = `‘${art.title}’ · ${art.artist} 작`;
  const description = `15초 발그림이 ${formatPrice(art.price)}원에 낙찰! 당신의 발그림은 얼마일까요?`;
  const image = { url: `/api/art/${art.id}/og`, width: 800, height: 800, alt: art.title };
  return {
    title: `${title} · 발더비 경매장`,
    description,
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

const RANKED = 4;

export default function GalleryPage({ searchParams }: PageProps<"/gallery">) {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
        <Suspense fallback={<GallerySkeleton />}>
          <GalleryData searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function GalleryData({ searchParams }: { searchParams: PageProps<"/gallery">["searchParams"] }) {
  await connection();
  const store = getStore();
  const arts = store ? await store.list() : [];
  const { art } = await searchParams;

  // 5th place and below are shown in a random order, like a salon hang.
  const rest = shuffled(arts.slice(RANKED));

  return (
    <GalleryView
      ranked={arts.slice(0, RANKED)}
      rest={rest}
      total={arts.length}
      focusId={typeof art === "string" ? art : undefined}
      ready={!!store}
    />
  );
}

function GallerySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto h-10 w-64 rounded-lg bg-surface" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
