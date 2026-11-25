export function Logo({ className = "", color = "var(--accent)" }: { className?: string; color?: string }) {
  return <span role="img" aria-label="발더비 경매장" className={`logo-mask block ${className}`} style={{ backgroundColor: color }} />;
}
