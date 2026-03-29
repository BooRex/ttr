import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import en from "./locales/en.json";
import de from "./locales/de.json";

export type Lang = "ru" | "uk" | "en" | "de";

type LocaleTree = typeof ru;

type PathValue = string | number | boolean | null | undefined;

const dict: Record<Lang, LocaleTree> = { ru, uk, en, de };

const getByPath = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
};

const interpolate = (template: string, params?: Record<string, PathValue>): string => {
  if (!params) return template;
  return template.replace(/\{(\w+)}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
};

export const defaultLang: Lang = "ru";

export const getInitialLang = (): Lang => {
  const saved = localStorage.getItem("ttr_lang") as Lang | null;
  if (saved && dict[saved]) return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("uk")) return "uk";
  if (browser.startsWith("de")) return "de";
  if (browser.startsWith("en")) return "en";
  return "ru";
};

export const setLangStorage = (lang: Lang): void => {
  localStorage.setItem("ttr_lang", lang);
};

export const t = (lang: Lang, key: string, params?: Record<string, PathValue>): string => {
  const value = getByPath(dict[lang], key) ?? getByPath(dict.ru, key) ?? key;
  return typeof value === "string" ? interpolate(value, params) : String(value);
};

export const cityLabel = (lang: Lang, city: string): string => {
  const value = getByPath(dict[lang], `cities.${city}`) ?? getByPath(dict.ru, `cities.${city}`);
  return typeof value === "string" ? value : city;
};

export const cardLabel = (lang: Lang, color: string): string => {
  const value = getByPath(dict[lang], `cards.${color}`) ?? getByPath(dict.ru, `cards.${color}`);
  return typeof value === "string" ? value : color;
};
