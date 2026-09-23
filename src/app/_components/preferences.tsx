"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { BulbIcon, SparkIcon } from "./icons";

const root = () => document.documentElement;
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(root(), { attributes: true, attributeFilter: ["data-theme", "data-motion"] });
  darkQuery().addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    darkQuery().removeEventListener("change", onChange);
  };
}

const isDark = () => (root().dataset.theme ? root().dataset.theme === "dark" : darkQuery().matches);
const motionOff = () => root().dataset.motion === "off";

function save(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

export function Preferences() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);
  const still = useSyncExternalStore(subscribe, motionOff, () => false);

  // En desarrollo, React limpia los atributos de <html> al remontar; se vuelven a poner.
  useLayoutEffect(() => {
    try {
      const theme = localStorage.getItem("theme");
      const motion = localStorage.getItem("motion");
      if (theme) root().dataset.theme = theme;
      if (motion) root().dataset.motion = motion;
    } catch {}
  }, []);

  function toggleTheme() {
    const next = isDark() ? "light" : "dark";
    root().dataset.theme = next;
    save("theme", next);
  }

  function toggleMotion() {
    if (motionOff()) delete root().dataset.motion;
    else root().dataset.motion = "off";
    save("motion", motionOff() ? "off" : null);
  }

  return (
    <>
      <button type="button" className="iconkey" onClick={toggleTheme} title={dark ? "Modo claro" : "Modo oscuro"}>
        <BulbIcon />
        <span className="visually-hidden">{dark ? "Pasar a modo claro" : "Pasar a modo oscuro"}</span>
      </button>
      <button type="button" className="iconkey" onClick={toggleMotion} aria-pressed={!still} title="Animaciones">
        <SparkIcon />
        <span className="visually-hidden">Animaciones</span>
      </button>
    </>
  );
}
