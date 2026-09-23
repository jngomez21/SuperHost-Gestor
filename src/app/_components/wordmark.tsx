"use client";

import type { AnimationEvent, MouseEvent } from "react";

// Cada letra salta al pasar por encima y termina su salto aunque el cursor se vaya.
function jump(event: MouseEvent<HTMLElement>) {
  const letter = (event.target as HTMLElement).closest(".wordmark-letter");
  letter?.classList.add("is-jumping");
}

function land(event: AnimationEvent<HTMLElement>) {
  (event.target as HTMLElement).classList.remove("is-jumping");
}

export function Wordmark({ text, hero = false }: { text: string; hero?: boolean }) {
  return (
    <span className={`wordmark${hero ? " wordmark-hero" : ""}`} onMouseOver={jump} onAnimationEnd={land}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, w) => (
          <span key={w}>
            {w > 0 && " "}
            {/* Palabra entera: si no, el navegador puede partir entre dos letras. */}
            <span className="wordmark-word">
              {[...word].map((char, i) => <span key={i} className="wordmark-letter">{char}</span>)}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
