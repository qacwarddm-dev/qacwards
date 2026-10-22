const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchWords = (q: string) =>
  q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2);

/** The PDF page that holds the most of the searched words (each as a word prefix, like the index), earliest on a tie. */
export async function bestPdfPage(bytes: Uint8Array, words: string[], timeoutMs: number): Promise<{ page: number | null; pages: number | null }> {
  if (!words.length) return { page: null, pages: null };
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes.slice() });
  try {
    const read = parser.getText().then((r) => ({ pages: r.pages ?? [], total: r.total ?? null }));
    const res = await Promise.race([read, new Promise<null>((done) => setTimeout(() => done(null), timeoutMs))]);
    if (!res) return { page: null, pages: null };
    const rx = words.map((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w)}`, "iu"));
    let best = { page: null as number | null, score: 0 };
    for (const p of res.pages) {
      const score = rx.filter((r) => r.test(p.text)).length;
      if (score > best.score) best = { page: p.num, score };
    }
    return { page: best.page, pages: res.total ?? res.pages.length };
  } finally {
    await parser.destroy().catch(() => {});
  }
}
