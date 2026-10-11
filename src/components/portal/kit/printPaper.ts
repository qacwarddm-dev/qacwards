/** `letter` prints one US Letter sheet per `.cpage`, edge to edge (the certification report). */
export function printPaper(el: HTMLElement | null, onBlocked?: () => void, letter?: boolean) {
  if (!el) return;
  const css = [...document.styleSheets]
    .map((s) => {
      try {
        return [...s.cssRules].map((r) => r.cssText).join("");
      } catch {
        return "";
      }
    })
    .join("");
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;width:0;height:0;border:0";
  document.body.appendChild(f);
  f.srcdoc = `<html><head><style>${css} body{background:#fff}.paper{box-shadow:none}${
    letter
      ? " @page{size:letter;margin:0} body{margin:0} .qp .cwrap{gap:0;min-width:0} .qp .cpage{box-shadow:none;width:8.5in;height:11in;max-width:none;aspect-ratio:auto;page-break-after:always} .qp .cpn{display:none}"
      : ""
  }</style></head><body><div class="qp">${el.outerHTML}</div></body></html>`;
  f.onload = () => {
    try {
      f.contentWindow?.print();
    } catch {
      onBlocked?.();
    }
    setTimeout(() => f.remove(), 2000);
  };
}
