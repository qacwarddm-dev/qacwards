export function printPaper(el: HTMLElement | null, onBlocked?: () => void) {
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
  f.srcdoc = `<html><head><style>${css} body{background:#fff}.paper{box-shadow:none}</style></head><body><div class="qp">${el.outerHTML}</div></body></html>`;
  f.onload = () => {
    try {
      f.contentWindow?.print();
    } catch {
      onBlocked?.();
    }
    setTimeout(() => f.remove(), 2000);
  };
}
