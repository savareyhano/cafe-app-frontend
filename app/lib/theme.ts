import { useSyncExternalStore } from "react";

export type ModePref = "light" | "dark" | "system";
const KEY = "mode";

// Runs inline in <head> before paint, so the page never flashes the wrong mode.
export const themeScript = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.mode=d?"dark":"light"}catch(e){document.documentElement.dataset.mode="light"}})()`;

function getPref(): ModePref {
  try {
    return (localStorage.getItem(KEY) as ModePref) || "system";
  } catch {
    return "system";
  }
}

function resolve(pref: ModePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const listeners = new Set<() => void>();
const apply = () => {
  document.documentElement.dataset.mode = resolve(getPref());
  listeners.forEach((l) => l());
};

if (typeof window !== "undefined") {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => getPref() === "system" && apply());
}

export function setMode(pref: ModePref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* not persisted */
  }
  apply();
}

/** The resolved mode, live. */
export function useMode(): "light" | "dark" {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => (document.documentElement.dataset.mode === "dark" ? "dark" : "light"),
    () => "light",
  );
}
