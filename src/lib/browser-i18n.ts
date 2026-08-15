export type BrowserLocale = "ro" | "en";

const runtimePairs = [
  ["Copiat", "Copied"],
  ["Copiază", "Copy"],
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

function translateRuntimeValue(value: string, locale = getBrowserLocale()): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length || undefined);
  if (!core) return value;

  const dictionary = locale === "en" ? roToEn : enToRo;
  const translated = dictionary.get(core.toLocaleLowerCase(locale === "en" ? "ro-RO" : "en-GB"));
  if (translated && translated !== core) return `${leading}${translated}${trailing}`;

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
}

function localizeDocument() {
  if (!document.body) return;
  localizeElement(document.body);
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
