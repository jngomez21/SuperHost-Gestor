import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.25em"
      height="1.25em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

export function BulbIcon() {
  return (
    <Icon>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" fill="currentColor" fillOpacity={0.18} />
    </Icon>
  );
}

export function SparkIcon() {
  return (
    <Icon>
      <path d="M12 3c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6Z" fill="currentColor" fillOpacity={0.18} />
      <path d="M19 15c.3 1.7.9 2.3 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.2 2.2-.8 2.5-2.5Z" />
    </Icon>
  );
}

export function ArrivalIcon() {
  return (
    <Icon>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M3 12h11M10 8l4 4-4 4" />
    </Icon>
  );
}

export function DepartureIcon() {
  return (
    <Icon>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </Icon>
  );
}

// Flecha trazada a mano para las notas en Shantell Sans.
export function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 32" width="3.2em" height="1.6em" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8c10 14 30 18 52 10" />
      <path d="M46 10l10 8-12 5" />
    </svg>
  );
}
