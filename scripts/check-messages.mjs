// Checks that every locale file has exactly the same keys and {placeholders} as en.json.
// Usage: node scripts/check-messages.mjs
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../messages/", import.meta.url);
const load = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}

// Top-level ICU argument names, e.g. {name} or {count, plural, ...}
function args(str) {
  const names = new Set();
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "{") {
      if (depth === 0) {
        const m = /^\{\s*([a-zA-Z_][\w]*)/.exec(str.slice(i));
        if (m) names.add(m[1]);
      }
      depth++;
    } else if (str[i] === "}") depth--;
  }
  return [...names].sort().join(",");
}

const base = flatten(load("en.json"));
let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const other = flatten(load(file));
  for (const k of Object.keys(base)) {
    if (!(k in other)) { console.error(`${file}: missing ${k}`); failed = true; }
    else if (args(base[k]) !== args(other[k])) {
      console.error(`${file}: placeholder mismatch in ${k}: en={${args(base[k])}} ${file}={${args(other[k])}}`);
      failed = true;
    }
  }
  for (const k of Object.keys(other)) if (!(k in base)) { console.error(`${file}: extra key ${k}`); failed = true; }
  console.log(`${file}: ${Object.keys(other).length} keys checked`);
}
process.exit(failed ? 1 : 0);
