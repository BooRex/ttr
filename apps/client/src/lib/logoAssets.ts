import type { Lang } from "./i18n";

export const LOGO_SRC_BY_LANG: Record<Lang, string> = {
  en: "/assets/logos/logo-en.png",
  de: "/assets/logos/logo-de.png",
  ru: "/assets/logos/logo-ru.png",
  uk: "/assets/logos/logo-uk.png",
};

const preloadedSrc = new Set<string>();
const pendingSrc = new Map<string, Promise<void>>();

const preloadSrc = (src: string): Promise<void> => {
  if (preloadedSrc.has(src)) return Promise.resolve();

  const pending = pendingSrc.get(src);
  if (pending) return pending;

  const promise = new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      preloadedSrc.add(src);
      pendingSrc.delete(src);
      resolve();
    };
    image.onerror = () => {
      pendingSrc.delete(src);
      resolve();
    };
    image.src = src;
  });

  pendingSrc.set(src, promise);
  return promise;
};

export const getLogoSrc = (lang: Lang): string => LOGO_SRC_BY_LANG[lang] ?? LOGO_SRC_BY_LANG.en;

export const warmLogoCache = async (lang: Lang): Promise<void> => {
  const primarySrc = getLogoSrc(lang);
  await preloadSrc(primarySrc);

  const secondary = Object.values(LOGO_SRC_BY_LANG).filter((src) => src !== primarySrc);
  void Promise.all(secondary.map((src) => preloadSrc(src)));
};

