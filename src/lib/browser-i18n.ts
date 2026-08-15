export type BrowserLocale = "ro" | "en";

export function getBrowserLocale(): BrowserLocale {
  if (typeof window === "undefined") return "ro";
  const pathname = window.location.pathname || "/";
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ro";
}

export function browserT(romanian: string, english: string): string {
  return getBrowserLocale() === "en" ? english : romanian;
}
