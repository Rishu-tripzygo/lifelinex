import type { SVGProps } from "react";

const PATHS = {
  check: <path d="M4.5 12.5l4.5 4.5L19.5 6.5" strokeWidth={2.2} />,
  x: <path d="M7 7l10 10M17 7L7 17" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  plus: <path d="M12 6v12M6 12h12" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  steth: (
    <>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <circle cx="18" cy="14" r="2.6" />
      <path d="M10 13v1a5 5 0 0 0 5 5 3 3 0 0 0 3-3v-.4" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5M12 16h.01" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  // concern icons, kept from the original home page
  cycle: <path d="M12 3a6 6 0 0 0 0 12 6 6 0 0 0 6-6c0 4-3 9-9 9a9 9 0 1 1 3-17.5" />,
  thyroid: (
    <>
      <path d="M8 3c0 2-2 3-2 6a6 6 0 0 0 12 0c0-3-2-4-2-6" />
      <path d="M9 3h6" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5C19 15.5 12 20 12 20z" />,
  chart: <path d="M4 19h16M6 19l3-9 3 5 2-3 3 7" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  leaf: <path d="M7 21c-2-4 0-7 2-9-2 0-4-2-3-5 2 1 3 0 3-2 3 1 5 4 5 8 0 3-2 5-3 8" />,
  shield: <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />,
  care: (
    <>
      <path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.65 12 21 12 21z" />
      <path d="M12 3v3" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
