// Trims the full icon sprite (332 KB) to the icons listed in app/components/icon.tsx.
// Runs before dev and build. Fails on a name the pack doesn't have.
import { readFileSync, writeFileSync } from "node:fs";

const full = readFileSync(new URL("./icons-full.svg", import.meta.url), "utf8");
const src = readFileSync(new URL("../app/components/icon.tsx", import.meta.url), "utf8");
const list = src.match(/ICONS = \[([\s\S]*?)\] as const/)[1];
const names = [...list.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);

const symbols = names.map((name) => {
  const m = full.match(new RegExp(`<symbol id="i-${name}"[\\s\\S]*?</symbol>`));
  if (!m) throw new Error(`Icon "${name}" is not in the icon pack`);
  return m[0];
});

writeFileSync(
  new URL("../public/icons.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Icon pack, Apache-2.0, see icons-LICENSE.txt -->${symbols.join("")}</svg>`,
);
console.log(`icons.svg: ${names.length} icons`);
