import { useEffect, useState } from "react";

export const useMediaQueries = () => {
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false,
  );
  const [isPortrait, setIsPortrait] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(orientation: portrait)").matches : false,
  );

  useEffect(() => {
    const portraitMedia = window.matchMedia("(orientation: portrait)");
    const mobileMedia = window.matchMedia("(max-width: 900px)");

    const handlePortrait = () => setIsPortrait(portraitMedia.matches);
    const handleMobile = () => setIsMobileLayout(mobileMedia.matches);

    handlePortrait();
    handleMobile();

    portraitMedia.addEventListener("change", handlePortrait);
    mobileMedia.addEventListener("change", handleMobile);

    return () => {
      portraitMedia.removeEventListener("change", handlePortrait);
      mobileMedia.removeEventListener("change", handleMobile);
    };
  }, []);

  return { isMobileLayout, isPortrait };
};

