import { useEffect, useState } from "react";

export const useGameBodyLock = (gameStarted: boolean) => {
  useEffect(() => {
    const lock = Boolean(gameStarted);
    document.body.classList.toggle("game-scroll-lock", lock);
    return () => document.body.classList.remove("game-scroll-lock");
  }, [gameStarted]);
};

