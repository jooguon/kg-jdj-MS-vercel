/** Title artwork as a CSS mask, so it can take any color. `en` is the English "Balthebys Auction" title. */
export function Logo({ className = "", color = "var(--accent)", variant = "ko" }: { className?: string; color?: string; variant?: "ko" | "en" }) {
  return <span role="img" aria-label="발더비 경매장" className={`${variant === "en" ? "logo-mask-en" : "logo-mask"} block ${className}`} style={{ backgroundColor: color }} />;
}
