export type BrowserLocale = "ro" | "en";

const runtimePairs = [
  ["Copiat", "Copied"],
  ["Copiază", "Copy"],
  ["Copiază în clipboard", "Copy to clipboard"],
  ["Copierea a eșuat", "Failed to copy"],
  ["Activează modul dev", "Enable dev mode"],
  ["Dezactivează modul dev", "Disable dev mode"],
  ["Vocea implicită a browserului", "Browser default voice"],
  ["Redare exemplu...", "Playing example..."],
  ["Cod copiat în clipboard.", "Code copied to clipboard."],
  ["Acesta este un exemplu pentru widgetul de accesibilitate ZebraByte.", "This is an example for the ZebraByte accessibility widget."],
  ["Se trimite...", "Sending..."],
  ["Abonează-mă", "Subscribe"],
  ["Abonarea nu a putut fi procesată.", "Your subscription could not be processed."],
  ["Adresa este deja abonată la newsletter-ul ZebraByte.", "This email address is already subscribed to the ZebraByte newsletter."],
  ["Verifică inbox-ul pentru linkul de confirmare. Abonarea devine activă numai după confirmare.", "Check your inbox for the confirmation link. Your subscription becomes active only after confirmation."],
  ["Mesajul nu a putut fi trimis.", "The message could not be sent."],
  ["Mesajul a fost trimis. Mulțumim!", "Your message has been sent. Thank you!"],
  ["Recenzia nu a putut fi trimisă.", "The review could not be sent."],
  ["Mulțumim! Recenzia a fost trimisă pentru verificare.", "Thank you! Your review has been submitted for verification."],
  ["A apărut o eroare de rețea. Încearcă din nou.", "A network error occurred. Please try again."],
  ["Căutare", "Search"],
  ["Șterge", "Clear"],
  ["Încarcă mai multe rezultate", "Load more results"],
  ["Caută pe acest site", "Search this site"],
  ["Filtre", "Filters"],
  ["Niciun rezultat", "No results"],
  ["Rezultatele căutării", "Search results"],
  ["navigare", "navigate"],
  ["selectare", "select"],
  ["ștergere", "clear"],
  ["închidere", "close"],
  ["căutare", "search"],
  ["Căutarea a eșuat", "Search failed"],
  ["Rezultatele vor apărea pe măsură ce tastezi", "Results will appear as you type"],
  ["Se încarcă", "Loading"],
  ["Copy for LLM", "Copy for LLM"],
  ["Copied", "Copied"],
  ["Copy failed", "Copy failed"],
  ["View as Markdown", "View as Markdown"],
  ["Glossary term", "Glossary term"],
  ["Definition", "Definition"],
  ["Filter glossary terms", "Filter glossary terms"],
  ["Filter glossary…", "Filter glossary…"],
  ["No glossary terms match your search.", "No glossary terms match your search."],
] as const;

const explicitRomanian = new Map<string, string>([
  ["copy for llm", "Copiază pentru LLM"],
  ["copied", "Copiat"],
  ["copy failed", "Copierea a eșuat"],
  ["view as markdown", "Vezi ca Markdown"],
  ["glossary term", "Termen din glosar"],
  ["definition", "Definiție"],
  ["filter glossary terms", "Filtrează termenii din glosar"],
  ["filter glossary…", "Filtrează glosarul…"],
  ["no glossary terms match your search.", "Niciun termen din glosar nu corespunde căutării."],
]);

const roToEn = new Map<string, string>();
const enToRo = new Map<string, string>();
for (const [romanian, english] of runtimePairs) {
  roToEn.set(romanian.toLocaleLowerCase("ro-RO"), english);
  if (romanian !== english) enToRo.set(english.toLocaleLowerCase("en-GB"), romanian);
}
for (const [english, romanian] of explicitRomanian) {
  enToRo.set(english, romanian);
}

const ignoredSelector = "script,style,code,pre,textarea,svg";
const pagefindSummaryCache = new Map<string, Promise<{ title?: string; excerpt?: string } | null>>();
const pagefindInFlight = new WeakSet<Element>();
let observerInstalled = false;
let observer: MutationObserver | null = null;

export function getBrowserLocale(): BrowserLocale {
  if (typeof window === "undefined") return "ro";
  const pathname = window.location.pathname || "/";
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ro";
}

export function browserT(romanian: string, english: string): string {
  return getBrowserLocale() === "en" ? english : romanian;
}

function translatePagefindDynamic(core: string, locale: BrowserLocale): string | null {
  if (locale === "ro") {
    let match = core.match(/^No results for (.+)\. Showing results for (.+) instead$/i);
    if (match) return `Niciun rezultat pentru ${match[1]}. Se afișează în schimb rezultatele pentru ${match[2]}`;
    match = core.match(/^No results for (.+)\. Try one of the following searches:$/i);
    if (match) return `Niciun rezultat pentru ${match[1]}. Încearcă una dintre următoarele căutări:`;
    match = core.match(/^No results for (.+)$/i);
    if (match) return `Niciun rezultat pentru ${match[1]}`;
    match = core.match(/^(\d+) results? for (.+)$/i);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? "rezultat" : "rezultate"} pentru ${match[2]}`;
    match = core.match(/^(\d+) results?$/i);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? "rezultat" : "rezultate"}`;
    match = core.match(/^Searching for (.+)\.\.\.$/i);
    if (match) return `Se caută ${match[1]}...`;
    match = core.match(/^(\d+) selected$/i);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? "selectat" : "selectate"}`;
  } else {
    let match = core.match(/^Niciun rezultat pentru (.+)\. Se afișează în schimb rezultatele pentru (.+)$/i);
    if (match) return `No results for ${match[1]}. Showing results for ${match[2]} instead`;
    match = core.match(/^Niciun rezultat pentru (.+)\. Încearcă una dintre următoarele căutări:$/i);
    if (match) return `No results for ${match[1]}. Try one of the following searches:`;
    match = core.match(/^Niciun rezultat pentru (.+)$/i);
    if (match) return `No results for ${match[1]}`;
    match = core.match(/^(\d+) (?:rezultat|rezultate) pentru (.+)$/i);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? "result" : "results"} for ${match[2]}`;
    match = core.match(/^(\d+) (?:rezultat|rezultate)$/i);
    if (match) return `${match[1]} ${Number(match[1]) === 1 ? "result" : "results"}`;
    match = core.match(/^Se caută(?: după:)? (.+)\.\.\.$/i);
    if (match) return `Searching for ${match[1]}...`;
    match = core.match(/^(\d+) (?:selectat|selectate)$/i);
    if (match) return `${match[1]} selected`;
  }
  return null;
}

function translateRuntimeValue(value: string, locale = getBrowserLocale()): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length || undefined);
  if (!core) return value;

  const dictionary = locale === "en" ? roToEn : enToRo;
  const translated = dictionary.get(core.toLocaleLowerCase(locale === "en" ? "ro-RO" : "en-GB"));
  if (translated && translated !== core) return `${leading}${translated}${trailing}`;

  const pagefind = translatePagefindDynamic(core, locale);
  if (pagefind) return `${leading}${pagefind}${trailing}`;

  const glossaryEnglish = core.match(/^(\d+) glossary (term|terms) found\.$/i);
  if (locale === "ro" && glossaryEnglish) {
    const count = Number(glossaryEnglish[1]);
    return `${leading}${count} ${count === 1 ? "termen" : "termeni"} din glosar ${count === 1 ? "găsit" : "găsiți"}.${trailing}`;
  }

  const glossaryRomanian = core.match(/^(\d+) (termen|termeni) din glosar (găsit|găsiți)\.$/i);
  if (locale === "en" && glossaryRomanian) {
    const count = Number(glossaryRomanian[1]);
    return `${leading}${count} glossary ${count === 1 ? "term" : "terms"} found.${trailing}`;
  }

  if (locale === "ro") {
    const showTranslation = core.match(/^Show translation \(EN\)$/i);
    if (showTranslation) return `${leading}Arată traducerea (EN)${trailing}`;
    const showOriginal = core.match(/^Show original \(([^)]+)\)$/i);
    if (showOriginal) return `${leading}Arată originalul (${showOriginal[1]})${trailing}`;
  } else {
    const showTranslation = core.match(/^Arată traducerea \(EN\)$/i);
    if (showTranslation) return `${leading}Show translation (EN)${trailing}`;
    const showOriginal = core.match(/^Arată originalul \(([^)]+)\)$/i);
    if (showOriginal) return `${leading}Show original (${showOriginal[1]})${trailing}`;
  }

  return value;
}

function shouldSkip(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest(ignoredSelector));
}

function localizeTextNode(node: Node) {
  if (node.nodeType !== Node.TEXT_NODE || shouldSkip(node) || !node.nodeValue) return;
  const translated = translateRuntimeValue(node.nodeValue);
  if (translated !== node.nodeValue) node.nodeValue = translated;
}

function localizedResultUrl(raw: string, locale: BrowserLocale): string {
  const url = new URL(raw, window.location.origin);
  if (url.origin !== window.location.origin) return url.toString();

  if (locale === "en") {
    if (url.pathname !== "/en" && !url.pathname.startsWith("/en/")) {
      url.pathname = url.pathname === "/" ? "/en" : `/en${url.pathname}`;
    }
  } else if (url.pathname === "/en" || url.pathname.startsWith("/en/")) {
    url.pathname = url.pathname === "/en" ? "/" : url.pathname.slice(3) || "/";
  }
  return url.toString();
}

function pageSummary(url: string): Promise<{ title?: string; excerpt?: string } | null> {
  const cached = pagefindSummaryCache.get(url);
  if (cached) return cached;

  const pending = (async () => {
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/html" },
        credentials: "same-origin",
      });
      if (!response.ok) return null;
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const target = new URL(url);
      let title = "";
      let excerpt = "";

      if (target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        const section = parsed.getElementById(id);
        title = section?.textContent?.trim() ?? "";
        const sibling = section?.nextElementSibling;
        excerpt = sibling?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      }

      title ||= parsed.querySelector("main h1")?.textContent?.trim() ?? parsed.querySelector("h1")?.textContent?.trim() ?? "";
      excerpt ||= parsed.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";

      return {
        title: title || undefined,
        excerpt: excerpt ? excerpt.slice(0, 320) : undefined,
      };
    } catch {
      return null;
    }
  })();

  pagefindSummaryCache.set(url, pending);
  return pending;
}

async function localizePagefindLink(link: HTMLAnchorElement) {
  if (pagefindInFlight.has(link)) return;
  pagefindInFlight.add(link);

  const locale = getBrowserLocale();
  const localizedUrl = localizedResultUrl(link.href, locale);

  try {
    if (localizedUrl !== link.href) link.href = localizedUrl;

    const summary = await pageSummary(localizedUrl);
    if (!summary) return;

    if (summary.title && link.textContent !== summary.title) {
      link.textContent = summary.title;
      const result = link.closest(".pagefind-ui__result, .pagefind-ui__result-nested");
      const image = result?.querySelector<HTMLImageElement>(".pagefind-ui__result-image");
      if (image && image.alt !== summary.title) image.alt = summary.title;
    }

    if (summary.excerpt) {
      const titleContainer = link.closest(".pagefind-ui__result-title");
      const scope = titleContainer?.parentElement;
      const excerpt = scope?.querySelector<HTMLElement>(":scope > .pagefind-ui__result-excerpt");
      if (excerpt && excerpt.textContent !== summary.excerpt) excerpt.textContent = summary.excerpt;
    }

    link.dataset.zbtLocalized = locale;
    link.dataset.zbtLocalizedHref = localizedUrl;
  } finally {
    pagefindInFlight.delete(link);
  }
}

function localizePagefindResults(root: ParentNode) {
  const links = root instanceof HTMLAnchorElement && root.matches(".pagefind-ui__result-link")
    ? [root]
    : [...root.querySelectorAll<HTMLAnchorElement>(".pagefind-ui__result-link")];
  const locale = getBrowserLocale();
  for (const link of links) {
    const expectedHref = localizedResultUrl(link.href, locale);
    if (
      link.dataset.zbtLocalized === locale &&
      link.dataset.zbtLocalizedHref === expectedHref &&
      link.href === expectedHref
    ) {
      continue;
    }
    void localizePagefindLink(link);
  }
}

function localizeElement(element: Element) {
  if (element.matches(ignoredSelector) || element.closest(ignoredSelector)) return;

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    localizeTextNode(current);
    current = walker.nextNode();
  }

  for (const node of [element, ...element.querySelectorAll<HTMLElement>("[title], [aria-label], [placeholder]")]) {
    if (!(node instanceof HTMLElement) || node.matches(ignoredSelector) || node.closest(ignoredSelector)) continue;
    for (const attribute of ["title", "aria-label", "placeholder"]) {
      const value = node.getAttribute(attribute);
      if (!value) continue;
      const translated = translateRuntimeValue(value);
      if (translated !== value) node.setAttribute(attribute, translated);
    }
  }

  localizePagefindResults(element);
}

function localizeDocument() {
  if (!document.body) return;
  localizeElement(document.body);
  localizePagefindResults(document);
}

export function installBrowserI18nObserver() {
  if (typeof window === "undefined" || observerInstalled) {
    localizeDocument();
    return;
  }

  observerInstalled = true;
  localizeDocument();

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        localizeTextNode(mutation.target);
        continue;
      }

      if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
        localizeElement(mutation.target);
        continue;
      }

      for (const added of mutation.addedNodes) {
        if (added.nodeType === Node.TEXT_NODE) localizeTextNode(added);
        else if (added instanceof Element) localizeElement(added);
      }
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["title", "aria-label", "placeholder"],
  });

  document.addEventListener("astro:after-swap", localizeDocument);
}
