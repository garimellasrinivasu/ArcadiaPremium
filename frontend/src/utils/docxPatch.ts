/**
 * Minimal, format-preserving text editing of a .docx main document.
 *
 * Only word/document.xml is rewritten, and within it only the paragraphs the user changed.
 * A paragraph edit is applied as a diff: the common start and end of the old and new text are
 * left untouched, and only the changed middle is removed/inserted. So fixing a name or a figure
 * keeps the bold/colour/font of every other word in that paragraph.
 */
import JSZip from "jszip";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
const XML_NS = "http://www.w3.org/XML/1998/namespace";

interface Segment { el: Element; kind: "t" | "tab" | "br"; text: string }

function isW(el: Node | null, name: string): el is Element {
  return !!el && el.nodeType === 1 && (el as Element).namespaceURI === W && (el as Element).localName === name;
}

/** Text-bearing pieces of a paragraph in reading order (deleted text and field codes excluded). */
function segmentsOf(p: Element): Segment[] {
  const out: Segment[] = [];
  const walk = (node: Element) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== 1) continue;
      const el = child as Element;
      if (el.namespaceURI === W) {
        if (el.localName === "p" || el.localName === "del" || el.localName === "txbxContent") continue; // nested/deleted
        if (el.localName === "t") { out.push({ el, kind: "t", text: el.textContent || "" }); continue; }
        if (el.localName === "tab" && isW(el.parentNode, "r")) { out.push({ el, kind: "tab", text: "\t" }); continue; }
        if ((el.localName === "br" || el.localName === "cr") && isW(el.parentNode, "r")) { out.push({ el, kind: "br", text: "\n" }); continue; }
      }
      if (el.namespaceURI === MC && el.localName === "Fallback") continue; // duplicate of the Choice content
      walk(el);
    }
  };
  walk(p);
  return out;
}

/** Paragraphs that belong to the document flow (excludes text boxes and compatibility fallbacks). */
function bodyParagraphs(doc: Document): Element[] {
  const body = Array.from(doc.getElementsByTagNameNS(W, "body"))[0];
  if (!body) return [];
  return Array.from(body.getElementsByTagNameNS(W, "p")).filter((p) => {
    for (let n = p.parentNode; n && n !== body; n = n.parentNode) {
      const e = n as Element;
      if (e.namespaceURI === W && e.localName === "txbxContent") return false;
      if (e.namespaceURI === MC && e.localName === "Fallback") return false;
    }
    return true;
  });
}

/** Word-level diff: spans of the old text to replace, with their new text. */
export function diffHunks(a: string, b: string): { start: number; end: number; insert: string }[] {
  const tok = (s: string) => s.match(/\s+|[^\s]+/g) || [];
  const A = tok(a), B = tok(b);
  // Trim the common head and tail first (most edits are small), then LCS on what remains
  let h = 0;
  while (h < A.length && h < B.length && A[h] === B[h]) h++;
  let t = 0;
  while (t < A.length - h && t < B.length - h && A[A.length - 1 - t] === B[B.length - 1 - t]) t++;
  const a1 = A.slice(h, A.length - t), b1 = B.slice(h, B.length - t);
  const n = a1.length, m = b1.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a1[i] === b1[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const hunks: { start: number; end: number; insert: string }[] = [];
  let off = A.slice(0, h).join("").length;
  let i = 0, j = 0, cur: { start: number; end: number; insert: string } | null = null;
  const flush = () => { if (cur) { hunks.push(cur); cur = null; } };
  while (i < n || j < m) {
    if (i < n && j < m && a1[i] === b1[j]) { flush(); off += a1[i].length; i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { cur ??= { start: off, end: off, insert: "" }; cur.insert += b1[j]; j++; }
    else { cur ??= { start: off, end: off, insert: "" }; off += a1[i].length; cur.end = off; i++; }
  }
  flush();
  // Narrow each hunk to the characters that actually differ (runs can split mid-word, e.g. "Amount:" + bold "₹1,25,00,000")
  return hunks.map((hk) => {
    const old = a.slice(hk.start, hk.end);
    let p = 0;
    while (p < old.length && p < hk.insert.length && old[p] === hk.insert[p]) p++;
    let q = 0;
    while (q < old.length - p && q < hk.insert.length - p && old[old.length - 1 - q] === hk.insert[hk.insert.length - 1 - q]) q++;
    return { start: hk.start + p, end: hk.end - q, insert: hk.insert.slice(p, hk.insert.length - q) };
  }).filter((hk) => hk.start !== hk.end || hk.insert);
}

export class DocxModel {
  private constructor(private zip: JSZip, private doc: Document, private paras: Element[]) {}

  static async load(data: ArrayBuffer | Uint8Array): Promise<DocxModel> {
    const zip = await JSZip.loadAsync(data);
    const file = zip.file("word/document.xml");
    if (!file) throw new Error("This file has no Word document body (word/document.xml)");
    const doc = new DOMParser().parseFromString(await file.async("string"), "application/xml");
    return new DocxModel(zip, doc, bodyParagraphs(doc));
  }

  /** Text of every body paragraph, in document order (tabs as \t, line breaks as \n). */
  paragraphTexts(): string[] {
    return this.paras.map((p) => segmentsOf(p).map((s) => s.text).join(""));
  }

  /** Text only from w:t runs — what a rendered page shows, used to match rendered paragraphs. */
  paragraphVisibleTexts(): string[] {
    return this.paras.map((p) => segmentsOf(p).filter((s) => s.kind === "t").map((s) => s.text).join(""));
  }

  /** Replace a paragraph's text, changing only the words that differ. */
  setParagraphText(index: number, newText: string): void {
    const p = this.paras[index];
    if (!p) throw new Error(`Paragraph ${index} not found`);
    const oldText = segmentsOf(p).map((s) => s.text).join("");
    // Existing tabs/line breaks stay as they are; only newly typed ones become spaces (see replaceSpan)
    const clean = newText.replace(/\r\n/g, "\n");
    if (oldText === clean) return;
    // Apply each changed span separately, last first, so earlier positions stay valid
    for (const h of diffHunks(oldText, clean).reverse()) this.replaceSpan(p, h.start, h.end, h.insert);
    // Leading/trailing spaces in w:t are dropped unless xml:space="preserve"
    for (const s of segmentsOf(p)) if (s.kind === "t") s.el.setAttributeNS(XML_NS, "xml:space", "preserve");
  }

  /** Remove old text [delStart, delEnd) and insert `insert` there, inside the existing runs. */
  private replaceSpan(p: Element, delStart: number, delEnd: number, insert: string): void {
    const segs = segmentsOf(p);
    // Run that receives inserted text: the one the change starts in. At a run boundary, text typed at
    // the start of a word (after a space) takes the next run's formatting, otherwise the previous run's.
    let anchor: { el: Element; offset: number } | null = null;
    let pos = 0;
    const tRuns: { el: Element; start: number; end: number }[] = [];
    for (const s of segs) {
      const start = pos, end = pos + s.text.length;
      pos = end;
      if (s.kind === "t") tRuns.push({ el: s.el, start, end });
    }
    const full = segs.map((s) => s.text).join("");
    const atWordStart = delStart === 0 || /\s/.test(full[delStart - 1]);
    const inside = tRuns.filter((r) => delStart > r.start && delStart < r.end);
    const endsHere = tRuns.filter((r) => r.end === delStart && r.end > r.start);
    const startsHere = tRuns.filter((r) => r.start === delStart && r.end > r.start);
    const pick = inside[0] || (atWordStart ? startsHere[0] || endsHere[endsHere.length - 1] : endsHere[endsHere.length - 1] || startsHere[0]);
    if (pick) anchor = { el: pick.el, offset: delStart - pick.start };

    // Remove the old span (positions measured on the original text)
    pos = 0;
    for (const s of segs) {
      const start = pos, end = pos + s.text.length;
      pos = end;
      if (s.kind === "t") {
        const a = Math.max(start, delStart), b = Math.min(end, delEnd);
        if (a < b) s.el.textContent = s.text.slice(0, a - start) + s.text.slice(b - start);
      } else if (start >= delStart && end <= delEnd) {
        s.el.parentNode?.removeChild(s.el);
      }
    }
    insert = insert.replace(/[\t\n]/g, " ");
    if (!insert) return;
    if (!anchor) {
      const last = [...tRuns].reverse().find((r) => r.end <= delStart) || tRuns[0];
      anchor = last ? { el: last.el, offset: Math.min(delStart - last.start, (last.el.textContent || "").length) } : { el: this.newRun(p), offset: 0 };
    }
    const t = anchor.el.textContent || "";
    anchor.el.textContent = t.slice(0, anchor.offset) + insert + t.slice(anchor.offset);
  }

  /** Append an empty run to a paragraph that has none, using the paragraph mark's formatting. */
  private newRun(p: Element): Element {
    const r = this.doc.createElementNS(W, "w:r");
    const pPr = Array.from(p.childNodes).find((n) => isW(n, "pPr")) as Element | undefined;
    const markRPr = pPr ? (Array.from(pPr.childNodes).find((n) => isW(n, "rPr")) as Element | undefined) : undefined;
    if (markRPr) {
      const rPr = this.doc.createElementNS(W, "w:rPr");
      // Paragraph-mark-only properties (ins/del/moveFrom/moveTo) don't belong on a run
      for (const c of Array.from(markRPr.childNodes)) {
        if (c.nodeType === 1 && !["ins", "del", "moveFrom", "moveTo"].includes((c as Element).localName)) rPr.appendChild(c.cloneNode(true));
      }
      r.appendChild(rPr);
    }
    const t = this.doc.createElementNS(W, "w:t");
    r.appendChild(t);
    p.appendChild(r);
    return t;
  }

  async toBytes(): Promise<Uint8Array> {
    let xml = new XMLSerializer().serializeToString(this.doc);
    if (!xml.startsWith("<?xml")) xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
    this.zip.file("word/document.xml", xml);
    return this.zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }
}
