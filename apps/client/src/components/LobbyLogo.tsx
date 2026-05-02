import { memo } from "react";
import type { Lang } from "../lib/i18n";
import { getLogoSrc } from "../lib/logoAssets";

interface LobbyLogoProps {
  lang: Lang;
  className?: string;
}

const logoAltByLang: Record<Lang, string> = {
  en: "Ticket to Ride logo",
  de: "Zug um Zug logo",
  ru: "Билет на поезд логотип",
  uk: "Квиток на потяг логотип",
};

const LobbyLogoComponent = ({ lang, className }: LobbyLogoProps) => {
  const src = getLogoSrc(lang);
  const alt = logoAltByLang[lang] ?? logoAltByLang.en;

  return (
    <img
      src={src}
      alt={alt}
      className={className ?? "lobby-logo"}
      width={709}
      height={291}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      draggable={false}
    />
  );
};

export const LobbyLogo = memo(LobbyLogoComponent);

