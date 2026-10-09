// Crockford base32 minus I/L/O/U, so a hand-typed id can't confuse 1/I or 0/O.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const FILE_ID_RE = /^QAC-NDA-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export function newNdaFileId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `QAC-NDA-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function normalizeNdaFileId(raw: string): string | null {
  const id = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
  return FILE_ID_RE.test(id) ? id : null;
}
