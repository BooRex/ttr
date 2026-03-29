import { useEffect, useRef, useState } from "react";

/**
 * Manages audio context unlock and turn pulse effect
 */
export const useTurnPulse = (activeToken: string | null | undefined, sessionToken: string) => {
  const [turnPulse, setTurnPulse] = useState(false);
  const audioUnlocked = useRef(false);
  const prevActiveTokenRef = useRef<string | null>(null);

  // Unlock audio on first pointer interaction
  useEffect(() => {
    const unlock = () => {
      audioUnlocked.current = true;
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Trigger pulse and sound when it becomes player's turn
  useEffect(() => {
    const changed = prevActiveTokenRef.current && prevActiveTokenRef.current !== activeToken;
    if (changed && activeToken === sessionToken) {
      setTurnPulse(true);
      window.setTimeout(() => setTurnPulse(false), 1100);

      if (audioUnlocked.current) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(640, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.82);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.85);
          osc.onended = () => void ctx.close();
        } catch {
          // Ignore audio errors
        }
      }
    }
    prevActiveTokenRef.current = activeToken ?? null;
  }, [activeToken, sessionToken]);

  return { turnPulse };
};

