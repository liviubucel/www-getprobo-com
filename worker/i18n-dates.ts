import type { TargetLocale } from "./i18n-ai";

const months = [
  { en: "January", enShort: "Jan", ro: "ianuarie", roShort: "ian." },
  { en: "February", enShort: "Feb", ro: "februarie", roShort: "feb." },
  { en: "March", enShort: "Mar", ro: "martie", roShort: "mar." },
  { en: "April", enShort: "Apr", ro: "aprilie", roShort: "apr." },
  { en: "May", enShort: "May", ro: "mai", roShort: "mai" },
  { en: "June", enShort: "Jun", ro: "iunie", roShort: "iun." },
  { en: "July", enShort: "Jul", ro: "iulie", roShort: "iul." },
  { en: "August", enShort: "Aug", ro: "august", roShort: "aug." },
  { en: "September", enShort: "Sep", ro: "septembrie", roShort: "sept." },
  { en: "October", enShort: "Oct", ro: "octombrie", roShort: "oct." },
  { en: "November", enShort: "Nov", ro: "noiembrie", roShort: "nov." },
  { en: "December", enShort: "Dec", ro: "decembrie", roShort: "dec." },
] as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const englishMonthPattern = months
  .flatMap((month) => [month.en, month.enShort])
  .map(escapeRegExp)
  .join("|");
const romanianMonthPattern = months
  .flatMap((month) => [month.ro, month.roShort])
  .map(escapeRegExp)
  .join("|");

const englishToMonth = new Map<string, (typeof months)[number]>();
const romanianToMonth = new Map<string, (typeof months)[number]>();
for (const month of months) {
  englishToMonth.set(month.en.toLowerCase(), month);
  englishToMonth.set(month.enShort.toLowerCase(), month);
  romanianToMonth.set(month.ro.toLowerCase(), month);
  romanianToMonth.set(month.roShort.toLowerCase(), month);
}

function toRomanian(markup: string): string {
  let result = markup.replace(
    new RegExp(`\\b(${englishMonthPattern})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "gi"),
    (_match, rawMonth: string, day: string, year: string) => {
      const month = englishToMonth.get(rawMonth.toLowerCase());
      return month ? `${Number(day)} ${month.ro} ${year}` : _match;
    },
  );

  result = result.replace(
    new RegExp(`\\b(\\d{1,2})\\s+(${englishMonthPattern})\\s+(\\d{4})\\b`, "gi"),
    (_match, day: string, rawMonth: string, year: string) => {
      const month = englishToMonth.get(rawMonth.toLowerCase());
      return month ? `${Number(day)} ${month.ro} ${year}` : _match;
    },
  );

  return result;
}

function toEnglish(markup: string): string {
  return markup.replace(
    new RegExp(`\\b(\\d{1,2})\\s+(${romanianMonthPattern})\\s+(\\d{4})\\b`, "gi"),
    (_match, day: string, rawMonth: string, year: string) => {
      const month = romanianToMonth.get(rawMonth.toLowerCase());
      return month ? `${month.en} ${Number(day)}, ${year}` : _match;
    },
  );
}

export function localizeDateMarkup(markup: string, locale: TargetLocale): string {
  return locale === "ro" ? toRomanian(markup) : toEnglish(markup);
}
