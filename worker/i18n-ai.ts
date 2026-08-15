import { translateEnglishHtml as applyCuratedEnglish } from "./i18n";

export type TargetLocale = "ro" | "en";
type SourceLocale = "ro" | "en";

interface AiBinding {
  run: (
    model: string,
    input: {
      text: string;
      source_lang: SourceLocale;
      target_lang: TargetLocale;
    },
  ) => Promise<unknown>;
}

interface KvNamespace {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
}

export interface TranslationEnv {
  AI?: AiBinding;
  NEWSLETTER?: KvNamespace;
}

const MODEL = "@cf/meta/m2m100-1.2b";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const PAGE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_MODEL_CHARS = 2600;
const CONCURRENCY = 8;

const translationMemory = new Map<string, string>();
const pageMemory = new Map<string, string>();

const exactEnglishToRomanian = new Map<string, string>([
  ["main navigation", "Navigație principală"],
  ["compliance", "Conformitate"],
  ["security", "Securitate"],
  ["resources", "Resurse"],
  ["company", "Companie"],
  ["documentation", "Documentație"],
  ["client access", "Acces clienți"],
  ["client portal", "Portal clienți"],
  ["about", "Despre"],
  ["about us", "Despre noi"],
  ["careers", "Cariere"],
  ["industries", "Industrii"],
  ["partnerships", "Parteneriate"],
  ["privacy", "Confidențialitate"],
  ["privacy policy", "Politica de confidențialitate"],
  ["cookie policy", "Politica privind cookie-urile"],
  ["terms", "Termeni"],
  ["terms of service", "Termeni și condiții"],
  ["legal", "Informații legale"],
  ["read more", "Citește mai mult"],
  ["learn more", "Află mai multe"],
  ["get started", "Începe"],
  ["start here", "Începe aici"],
  ["book a call", "Programează o discuție"],
  ["talk to an expert", "Discută cu un expert"],
  ["contact us", "Contactează-ne"],
  ["submit", "Trimite"],
  ["send", "Trimite"],
  ["send message", "Trimite mesajul"],
  ["subscribe", "Abonează-te"],
  ["unsubscribe", "Dezabonează-te"],
  ["search", "Caută"],
  ["next", "Următorul"],
  ["previous", "Anterior"],
  ["back", "Înapoi"],
  ["loading", "Se încarcă"],
  ["error", "Eroare"],
  ["success", "Succes"],
  ["by", "de"],
  ["all", "Toate"],
  ["guide", "Ghid"],
  ["case study", "Studiu de caz"],
  ["case studies", "Studii de caz"],
  ["product updates", "Noutăți produs"],
  ["download", "Descarcă"],
  ["downloads", "Descărcări"],
  ["open menu", "Deschide meniul"],
  ["close menu", "Închide meniul"],
  ["security report", "Raport de securitate"],
  ["valid", "Valid"],
  ["update", "Actualizare"],
  ["website security", "Securitate site web"],
  ["email security", "Securitate email"],
  ["incident response", "Răspuns la incidente"],
  ["managed hosting", "Hosting administrat"],
  ["secure managed hosting", "Hosting securizat administrat"],
  ["cyber security", "Securitate cibernetică"],
  ["cybersecurity", "Securitate cibernetică"],
  ["free tools", "Instrumente gratuite"],
  ["accessibility", "Accesibilitate"],
  ["all systems operational", "Toate sistemele sunt operaționale"],
  ["degraded performance", "Performanță degradată"],
  ["active incident", "Incident activ"],
  ["checking status", "Se verifică statusul"],
  ["status unavailable", "Status indisponibil"],
]);

const exactRomanianToEnglish = new Map<string, string>();
for (const [english, romanian] of exactEnglishToRomanian) {
  if (!exactRomanianToEnglish.has(romanian.toLocaleLowerCase("ro-RO"))) {
    exactRomanianToEnglish.set(romanian.toLocaleLowerCase("ro-RO"), restoreEnglishCase(english));
  }
}

const romanianWords = new Set(
  `și si în in din de la pe cu pentru este sunt un o una unui unei ale al a ai sau dar care ce ca că daca dacă prin între intre fără fara după dupa înainte inainte mai foarte noi voi ei ele acest aceasta aceste acestei acesta aceea aici acolo cum când cand unde toate tot toate despre către catre fiecare poate trebuie doar iar astfel precum nostru noastră noastra voastră voastra lor tine tineți companie compania securitate conformitate găzduire gazduire date riscuri audit controale dovezi protecție protectie servicii soluții solutii afacere afacerii site site-ul website clienți clienti echipă echipa românia romania română romana disponibil disponibilă disponibile luni martie aprilie mai iunie iulie august septembrie octombrie noiembrie decembrie ianuarie februarie`.split(/\s+/),
);

const englishWords = new Set(
  `the and to of in for with on from is are a an your our you we they this that these those or but as by at into about how what why when where all every can will should only more most less without after before between through while website site business businesses company team security compliance hosting privacy risk risks audit controls evidence protection services solutions customers customer client clients available managed secure free tools learn read get start contact book download previous next january february march april may june july august september october november december`.split(/\s+/),
);

const protectedBrandTokens = new Set([
  "zebrabyte",
  "soc",
  "iso",
  "gdpr",
  "nis2",
  "wcag",
  "waf",
  "ddos",
  "ssl",
  "tls",
  "api",
  "graphql",
  "mcp",
  "n8n",
  "cloudflare",
  "aws",
  "github",
  "wordpress",
]);

function restoreEnglishCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word.length <= 3 ? word.toUpperCase() === word ? word : word : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`))
    .join(" ");
}

function normaliseForExactMatch(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ro-RO");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value: string, quote: string): string {
  let escaped = escapeHtmlText(value);
  if (quote === '"') escaped = escaped.replace(/"/g, "&quot;");
  if (quote === "'") escaped = escaped.replace(/'/g, "&#39;");
  return escaped;
}

function isObviouslyNonLanguage(value: string): boolean {
  const text = value.trim();
  if (!text || !/[A-Za-zĂÂÎȘȚăâîșț]/.test(text)) return true;
  if (/^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(text)) return true;
  if (/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text)) return true;
  if (/^[A-Z0-9_.:/+\-]{1,18}$/.test(text)) return true;
  if (/^\d[\d\s.,:%/+\-]*$/.test(text)) return true;
  return false;
}

function languageScore(value: string): { ro: number; en: number; words: number } {
  const text = decodeHtml(value).toLocaleLowerCase("ro-RO");
  const tokens = text.match(/[a-zăâîșț]+(?:[-'][a-zăâîșț]+)*/giu) ?? [];
  let ro = /[ăâîșț]/iu.test(text) ? 4 : 0;
  let en = 0;

  for (const token of tokens) {
    if (romanianWords.has(token)) ro += 1;
    if (englishWords.has(token)) en += 1;
  }

  if (/\b(?:tion|ment|ness|ing|edly|ous|able|ibility|ization|isation)\b/iu.test(text)) en += 1;
  if (/\b(?:ului|elor|ilor|itate|izare|ărilor|ării|iilor)\b/iu.test(text)) ro += 1;

  return { ro, en, words: tokens.length };
}

function detectSourceLanguage(value: string): SourceLocale | null {
  if (isObviouslyNonLanguage(value)) return null;

  const exact = normaliseForExactMatch(decodeHtml(value));
  if (exactEnglishToRomanian.has(exact)) return "en";
  if (exactRomanianToEnglish.has(exact)) return "ro";

  const { ro, en, words } = languageScore(value);
  if (words === 0) return null;
  if (ro >= en + 2 && ro >= 2) return "ro";
  if (en >= ro + 2 && en >= 2) return "en";

  if (words >= 8) {
    if (ro > en) return "ro";
    if (en > ro) return "en";
  }

  return null;
}

function applyExactTranslation(value: string, target: TargetLocale): string | null {
  const key = normaliseForExactMatch(value);
  if (target === "ro") return exactEnglishToRomanian.get(key) ?? null;
  return exactRomanianToEnglish.get(key) ?? null;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function extractTranslatedText(result: unknown): string | null {
  if (typeof result === "string") return result.trim() || null;
  if (!result || typeof result !== "object") return null;

  const record = result as Record<string, unknown>;
  for (const key of ["translated_text", "translation", "text", "response"]) {
    if (typeof record[key] === "string" && String(record[key]).trim()) {
      return String(record[key]).trim();
    }
  }

  if (Array.isArray(record.translations) && record.translations.length > 0) {
    const first = record.translations[0];
    if (typeof first === "string") return first.trim() || null;
    if (first && typeof first === "object") return extractTranslatedText(first);
  }

  if (record.result && typeof record.result === "object") {
    return extractTranslatedText(record.result);
  }

  return null;
}

function protectInlineTokens(value: string): { text: string; restore: (translated: string) => string } {
  const tokens: string[] = [];
  const remember = (token: string) => {
    const index = tokens.push(token) - 1;
    return ` ZBTKEEP${index} `;
  };

  let text = value
    .replace(/https?:\/\/[^\s)\]}>,]+/gi, remember)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, remember)
    .replace(/`[^`]+`/g, remember);

  for (const token of protectedBrandTokens) {
    const pattern = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    text = text.replace(pattern, remember);
  }

  return {
    text,
    restore(translated) {
      return translated.replace(/\s*ZBTKEEP(\d+)\s*/g, (_match, index) => tokens[Number(index)] ?? "");
    },
  };
}

function splitForModel(value: string): string[] {
  if (value.length <= MAX_MODEL_CHARS) return [value];

  const chunks: string[] = [];
  let current = "";
  const pieces = value.split(/(?<=[.!?;:])\s+|\n{2,}/u);

  for (const piece of pieces) {
    if (!piece) continue;
    if (piece.length > MAX_MODEL_CHARS) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let start = 0; start < piece.length; start += MAX_MODEL_CHARS) {
        chunks.push(piece.slice(start, start + MAX_MODEL_CHARS));
      }
      continue;
    }

    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length > MAX_MODEL_CHARS) {
      chunks.push(current);
      current = piece;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function translateWithAi(
  value: string,
  source: SourceLocale,
  target: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  if (source === target) return value;

  const exact = applyExactTranslation(value, target);
  if (exact) return exact;
  if (!env.AI) return value;

  const memoryKey = `${source}:${target}:${value}`;
  const memory = translationMemory.get(memoryKey);
  if (memory) return memory;

  const keyHash = await sha256(memoryKey);
  const kvKey = `i18n:v3:text:${source}:${target}:${keyHash}`;
  const cached = env.NEWSLETTER ? await env.NEWSLETTER.get(kvKey) : null;
  if (cached) {
    translationMemory.set(memoryKey, cached);
    return cached;
  }

  const protectedValue = protectInlineTokens(value);
  const chunks = splitForModel(protectedValue.text);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const result = await env.AI.run(MODEL, {
      text: chunk,
      source_lang: source,
      target_lang: target,
    });
    const translated = extractTranslatedText(result);
    if (!translated) return value;
    translatedChunks.push(translated);
  }

  const translated = protectedValue.restore(translatedChunks.join(" ")).trim();
  if (!translated) return value;

  translationMemory.set(memoryKey, translated);
  if (env.NEWSLETTER) {
    await env.NEWSLETTER.put(kvKey, translated, { expirationTtl: CACHE_TTL_SECONDS });
  }
  return translated;
}

interface Candidate {
  source: SourceLocale;
  target: TargetLocale;
  value: string;
}

function makeCandidate(rawValue: string, target: TargetLocale): Candidate | null {
  const value = decodeHtml(rawValue).replace(/\u00a0/g, " ").trim();
  if (!value || isObviouslyNonLanguage(value)) return null;

  const exact = applyExactTranslation(value, target);
  if (exact) {
    return { source: target === "ro" ? "en" : "ro", target, value };
  }

  const source = detectSourceLanguage(value);
  if (!source || source === target) return null;
  return { source, target, value };
}

function protectRuntimeBlocks(markup: string): { markup: string; restore: (value: string) => string } {
  const blocks: string[] = [];
  const protectedMarkup = markup.replace(
    /<(script|style|textarea|pre|code|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const index = blocks.push(block) - 1;
      return `___ZBT_I18N_RUNTIME_BLOCK_${index}___`;
    },
  );

  return {
    markup: protectedMarkup,
    restore(value) {
      return value.replace(/___ZBT_I18N_RUNTIME_BLOCK_(\d+)___/g, (_match, index) => blocks[Number(index)] ?? "");
    },
  };
}

function translatableAttributeNames(tag: string): string[] {
  const names = ["aria-label", "title", "placeholder", "alt"];
  if (/^<input\b/i.test(tag) && /\btype=["'](?:submit|button|reset)["']/i.test(tag)) names.push("value");
  if (
    /^<meta\b/i.test(tag) &&
    (/(?:name|property)=["'](?:description|keywords|og:title|og:description|og:image:alt|twitter:title|twitter:description)["']/i.test(tag))
  ) {
    names.push("content");
  }
  return names;
}

function collectMarkupCandidates(markup: string, target: TargetLocale): Candidate[] {
  const candidates: Candidate[] = [];
  const parts = markup.split(/(<[^>]+>)/g);

  for (const part of parts) {
    if (!part || /^<[^>]+>$/.test(part)) {
      if (!part?.startsWith("<")) continue;
      const names = translatableAttributeNames(part);
      for (const name of names) {
        const pattern = new RegExp(`\\b${name}=(['\"])(.*?)\\1`, "gi");
        for (const match of part.matchAll(pattern)) {
          const candidate = makeCandidate(match[2] ?? "", target);
          if (candidate) candidates.push(candidate);
        }
      }
      continue;
    }

    if (/^___ZBT_I18N_RUNTIME_BLOCK_\d+___$/.test(part.trim())) continue;
    const candidate = makeCandidate(part, target);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function buildTranslations(
  candidates: Candidate[],
  env: TranslationEnv,
): Promise<Map<string, string>> {
  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    unique.set(`${candidate.source}:${candidate.target}:${candidate.value}`, candidate);
  }

  const entries = [...unique.entries()];
  const translated = await mapWithConcurrency(entries, CONCURRENCY, async ([key, candidate]) => {
    const exact = applyExactTranslation(candidate.value, candidate.target);
    if (exact) return [key, exact] as const;
    try {
      return [
        key,
        await translateWithAi(candidate.value, candidate.source, candidate.target, env),
      ] as const;
    } catch {
      return [key, candidate.value] as const;
    }
  });

  return new Map(translated);
}

function lookupTranslation(
  rawValue: string,
  target: TargetLocale,
  translations: Map<string, string>,
): string | null {
  const candidate = makeCandidate(rawValue, target);
  if (!candidate) return null;
  const key = `${candidate.source}:${candidate.target}:${candidate.value}`;
  return translations.get(key) ?? null;
}

function replaceAttributeValues(
  tag: string,
  target: TargetLocale,
  translations: Map<string, string>,
): string {
  let result = tag;
  for (const name of translatableAttributeNames(tag)) {
    const pattern = new RegExp(`\\b${name}=(['\"])(.*?)\\1`, "gi");
    result = result.replace(pattern, (match, quote, rawValue) => {
      const translated = lookupTranslation(rawValue, target, translations);
      if (!translated) return match;
      return `${name}=${quote}${escapeHtmlAttribute(translated, quote)}${quote}`;
    });
  }
  return result;
}

async function localizeMarkupVisible(
  markup: string,
  target: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  const protectedMarkup = protectRuntimeBlocks(markup);
  const candidates = collectMarkupCandidates(protectedMarkup.markup, target);
  if (candidates.length === 0) return protectedMarkup.restore(protectedMarkup.markup);

  const translations = await buildTranslations(candidates, env);
  const parts = protectedMarkup.markup.split(/(<[^>]+>)/g);
  const localized = parts
    .map((part) => {
      if (!part) return part;
      if (/^<[^>]+>$/.test(part)) return replaceAttributeValues(part, target, translations);
      if (/^___ZBT_I18N_RUNTIME_BLOCK_\d+___$/.test(part.trim())) return part;

      const candidate = makeCandidate(part, target);
      if (!candidate) return part;
      const key = `${candidate.source}:${candidate.target}:${candidate.value}`;
      const translated = translations.get(key);
      if (!translated || translated === candidate.value) return part;

      const leading = part.match(/^\s*/)?.[0] ?? "";
      const trailing = part.match(/\s*$/)?.[0] ?? "";
      return `${leading}${escapeHtmlText(translated)}${trailing}`;
    })
    .join("");

  return protectedMarkup.restore(localized);
}

async function localizeJsonLd(
  markup: string,
  target: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  const pattern = /<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  const matches = [...markup.matchAll(pattern)];
  if (matches.length === 0) return markup;

  let cursor = 0;
  let result = "";

  for (const match of matches) {
    const index = match.index ?? 0;
    result += markup.slice(cursor, index);
    cursor = index + match[0].length;

    try {
      const parsed = JSON.parse(match[2] ?? "{}");
      await localizeJsonLdNode(parsed, target, env);
      result += `<script${match[1]}>${JSON.stringify(parsed)}</script>`;
    } catch {
      result += match[0];
    }
  }

  result += markup.slice(cursor);
  return result;
}

async function localizeJsonLdNode(
  value: unknown,
  target: TargetLocale,
  env: TranslationEnv,
  key?: string,
): Promise<void> {
  if (!value || typeof value !== "object") return;
  const semanticKeys = new Set([
    "description",
    "headline",
    "alternativeHeadline",
    "articleBody",
    "text",
    "caption",
  ]);

  if (Array.isArray(value)) {
    for (const item of value) await localizeJsonLdNode(item, target, env, key);
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [childKey, childValue] of Object.entries(record)) {
    if (typeof childValue === "string" && semanticKeys.has(childKey)) {
      const candidate = makeCandidate(childValue, target);
      if (!candidate) continue;
      try {
        record[childKey] = await translateWithAi(
          candidate.value,
          candidate.source,
          candidate.target,
          env,
        );
      } catch {
        // Keep valid structured data if translation is temporarily unavailable.
      }
      continue;
    }
    await localizeJsonLdNode(childValue, target, env, childKey);
  }
}

function rewriteEnglishDocumentLinks(markup: string): string {
  return markup
    .replace(/href=(['"])\/blog\.xml\1/gi, 'href="/en/blog.xml"')
    .replace(/href=(['"])\/changelog\.xml\1/gi, 'href="/en/changelog.xml"')
    .replace(/(<link>)(https?:\/\/(?:www\.)?zebrabyte\.ro)(\/[^<]*)(<\/link>)/gi, (_m, before, origin, path, after) => {
      if (path === "/en" || path.startsWith("/en/")) return `${before}${origin}${path}${after}`;
      return `${before}${origin}${path === "/" ? "/en" : `/en${path}`}${after}`;
    })
    .replace(/(<guid\b[^>]*>)(https?:\/\/(?:www\.)?zebrabyte\.ro)(\/[^<]*)(<\/guid>)/gi, (_m, before, origin, path, after) => {
      if (path === "/en" || path.startsWith("/en/")) return `${before}${origin}${path}${after}`;
      return `${before}${origin}${path === "/" ? "/en" : `/en${path}`}${after}`;
    });
}

async function cachedPageTransform(
  input: string,
  target: TargetLocale,
  env: TranslationEnv,
  transformer: () => Promise<string>,
): Promise<string> {
  const hash = await sha256(`${target}:${input}`);
  const memoryKey = `${target}:${hash}`;
  const memory = pageMemory.get(memoryKey);
  if (memory) return memory;

  const kvKey = `i18n:v3:page:${target}:${hash}`;
  const cached = env.NEWSLETTER ? await env.NEWSLETTER.get(kvKey) : null;
  if (cached) {
    pageMemory.set(memoryKey, cached);
    return cached;
  }

  const output = await transformer();
  pageMemory.set(memoryKey, output);
  if (env.NEWSLETTER) {
    await env.NEWSLETTER.put(kvKey, output, { expirationTtl: PAGE_CACHE_TTL_SECONDS });
  }
  return output;
}

export async function normalizeRomanianMarkup(
  markup: string,
  env: TranslationEnv,
): Promise<string> {
  return cachedPageTransform(markup, "ro", env, async () => {
    const visible = await localizeMarkupVisible(markup, "ro", env);
    return localizeJsonLd(visible, "ro", env);
  });
}

export async function translateEnglishMarkup(
  markup: string,
  env: TranslationEnv,
): Promise<string> {
  const romanian = await normalizeRomanianMarkup(markup, env);
  const curated = applyCuratedEnglish(romanian);

  return cachedPageTransform(curated, "en", env, async () => {
    const visible = await localizeMarkupVisible(curated, "en", env);
    const structured = await localizeJsonLd(visible, "en", env);
    return rewriteEnglishDocumentLinks(structured);
  });
}

function protectMarkdown(value: string): { text: string; restore: (localized: string) => string } {
  const blocks: string[] = [];
  const remember = (block: string) => {
    const index = blocks.push(block) - 1;
    return `\nZBTMDBLOCK${index}\n`;
  };

  const text = value
    .replace(/```[\s\S]*?```/g, remember)
    .replace(/~~~[\s\S]*?~~~/g, remember)
    .replace(/`[^`\n]+`/g, remember);

  return {
    text,
    restore(localized) {
      return localized.replace(/\n?ZBTMDBLOCK(\d+)\n?/g, (_match, index) => blocks[Number(index)] ?? "");
    },
  };
}

export async function localizePlainText(
  text: string,
  target: TargetLocale,
  env: TranslationEnv,
): Promise<string> {
  return cachedPageTransform(text, target, env, async () => {
    const protectedText = protectMarkdown(text);
    const paragraphs = protectedText.text.split(/(\n{2,})/);
    const localized: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph || /^\n{2,}$/.test(paragraph) || /ZBTMDBLOCK\d+/.test(paragraph)) {
        localized.push(paragraph);
        continue;
      }

      const leadingSyntax = paragraph.match(/^(\s*(?:#{1,6}|>|[-+*]|\d+[.)])?\s*)/)?.[0] ?? "";
      const body = paragraph.slice(leadingSyntax.length);
      const candidate = makeCandidate(body, target);
      if (!candidate) {
        localized.push(paragraph);
        continue;
      }

      try {
        const translated = await translateWithAi(candidate.value, candidate.source, target, env);
        localized.push(`${leadingSyntax}${translated}`);
      } catch {
        localized.push(paragraph);
      }
    }

    return protectedText.restore(localized.join(""));
  });
}
