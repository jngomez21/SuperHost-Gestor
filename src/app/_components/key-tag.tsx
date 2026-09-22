import type { ReactNode } from "react";

export function HangingTag({ number, caption, children }: {
  number: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="hook">
      <div className="ring" aria-hidden="true" />
      <div className="tag tag-swing">
        <p className="tag-number" aria-hidden="true">{number}</p>
        <p className="tag-caption">{caption}</p>
        {children}
      </div>
    </div>
  );
}
