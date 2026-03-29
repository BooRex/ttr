import { useState } from "react";
import { defaultLang, getInitialLang, setLangStorage, type Lang } from "../lib/i18n";

/**
 * Инициализация языка с обработкой ошибок
 */
export const useLang = () => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return getInitialLang();
    } catch {
      return defaultLang;
    }
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    setLangStorage(newLang);
  };

  return [lang, setLang] as const;
};

