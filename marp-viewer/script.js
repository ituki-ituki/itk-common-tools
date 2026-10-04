import { Marp } from "https://esm.sh/@marp-team/marp-core@4";

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const mode = document.getElementById("editorMode");
const DEFAULT_H1 = "スライド";

const load = async (url) => {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} を読めません`);
  return r.text();
};

const titled = (md) => md.replace(/^#\s*\{\s*\}\s*$/m, `# ${DEFAULT_H1}`);
const texts = {};
[texts.css, texts.md] = await Promise.all([load("template/style.css"), load("template/structure.txt")]);
texts.md = titled(texts.md);
let shown = "md";

const stripOuterFence = (raw) => {
  const lines = raw.replace(/^﻿/, "").split(/\r?\n/);
  if (!/^```(?:markdown|md)?\s*$/i.test(lines[0]?.trim() ?? "")) return raw;
  lines.shift();
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim() === "") last--;
  if (last >= 0 && lines[last].trim() === "```") lines.length = last;
  return lines.join("\n");
};

const prepare = (raw) => {
  const md = titled(stripOuterFence(raw).trim());
  return /^---[\s\S]*?---/.test(md) ? md : `---\nmarp: true\ntheme: custom\npaginate: true\n---\n\n${md}`;
};

const build = () => {
  const marp = new Marp({ html: true, math: false });
  marp.themeSet.add(texts.css);
  const md = prepare(texts.md);
  const title = md.match(/^#\s+(.+)$/m)?.[1].replace(/<[^>]+>/g, "").replace(/\*{1,3}|_{1,2}|`+/g, "").trim();
  return { ...marp.render(md), title: title || DEFAULT_H1 };
};

const ratio = (el) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
const scrollTo = (el, r) => (el.scrollTop = r * (el.scrollHeight - el.clientHeight));

let syncing = false;
for (const [from, to] of [[editor, preview], [preview, editor]]) {
  from.addEventListener("scroll", () => {
    if (syncing) return;
    syncing = true;
    scrollTo(to, ratio(from));
    requestAnimationFrame(() => (syncing = false));
  });
}

const render = () => {
  const r = ratio(editor);
  preview.replaceChildren();
  if (!texts.md.trim()) return;
  const { html, css } = build();
  preview.innerHTML = `<style>${css}</style>${html}`;
  scrollTo(preview, r);
};

mode.addEventListener("change", () => {
  texts[shown] = editor.value;
  shown = mode.value;
  editor.value = texts[shown];
});

editor.addEventListener("input", () => {
  texts[shown] = editor.value;
  render();
});

editor.addEventListener("paste", () => queueMicrotask(() => {
  if (shown !== "md") return;
  editor.value = texts.md = stripOuterFence(editor.value);
  render();
}));

document.getElementById("resetBtn").addEventListener("click", () => location.reload());

document.getElementById("pdfBtn").addEventListener("click", () => {
  texts[shown] = editor.value;
  const { html, css, title } = build();
  const prev = document.title;
  document.title = title;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><style>${css} body{margin:0;background:#fff}</style></head><body>${html}</body></html>`);
  doc.close();
  doc.title = title;
  const cleanup = () => {
    document.title = prev;
    iframe.remove();
  };
  const run = () => requestAnimationFrame(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      iframe.contentWindow.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 120000);
    }
  });
  if (doc.readyState === "complete") run();
  else iframe.onload = run;
});

editor.value = texts.md;
render();
