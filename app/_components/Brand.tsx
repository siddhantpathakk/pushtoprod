import type { CSSProperties } from "react";

type Size = "sm" | "md" | "lg";

const NAME_SIZE: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

const MARK_SIZE: Record<Size, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

export function ClarionMark({
  size = "md",
  className,
  style,
}: {
  size?: Size;
  className?: string;
  style?: CSSProperties;
}) {
  const px = MARK_SIZE[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={style}
    >
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M11 8.5a4 4 0 0 1 0 7" strokeWidth="1.5" opacity="0.85" />
      <path d="M15 5.5a8 8 0 0 1 0 13" strokeWidth="1.5" opacity="0.55" />
      <path d="M19 2.5a12 12 0 0 1 0 19" strokeWidth="1.5" opacity="0.25" />
    </svg>
  );
}

export default function Brand({
  size = "md",
  tagline = false,
  className = "",
}: {
  size?: Size;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ClarionMark size={size} className="text-stone-900 dark:text-stone-100" />
      <span
        className={`font-medium tracking-tight ${NAME_SIZE[size]} text-stone-900 dark:text-stone-100`}
      >
        Clarion
      </span>
      {tagline ? (
        <>
          <span
            aria-hidden
            className="hidden sm:inline text-stone-300 dark:text-stone-700 select-none"
          >
            ·
          </span>
          <span className="hidden sm:inline text-sm text-stone-500 tracking-tight">
            Clarity from the chaos
          </span>
        </>
      ) : null}
    </div>
  );
}
