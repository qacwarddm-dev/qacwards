export function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", hour12: false }).format(now));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** "Dean Reyes", "Director Bautista", otherwise the given name. */
export function greetName(name: string, position: string) {
  const [surname, given] = name.split(",").map((s) => s.trim());
  const title = /dean/i.test(position) ? "Dean" : /director/i.test(position) ? "Director" : /^dr\b/i.test(position) ? "Dr." : null;
  if (title) return `${title} ${surname}`;
  return (given ?? surname).split(" ")[0];
}
