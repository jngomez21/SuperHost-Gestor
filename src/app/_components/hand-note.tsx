import type { ReactNode } from "react";
import { ScribbleArrow } from "./icons";

// Nota escrita a mano, con flecha opcional hacia lo que señala.
export function HandNote({ children, arrow, className = "" }: {
  children: ReactNode;
  arrow?: "left" | "right" | "down";
  className?: string;
}) {
  return (
    <p className={`hand ${arrow ? `hand-${arrow}` : ""} ${className}`}>
      {arrow === "left" && <ScribbleArrow className="hand-arrow" />}
      <span>{children}</span>
      {arrow && arrow !== "left" && <ScribbleArrow className="hand-arrow" />}
    </p>
  );
}
