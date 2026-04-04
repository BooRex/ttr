import { useEffect, useRef, useState } from "react";

const playTurnChessLikeSound = () => {
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const click = (time: number, freq: number, duration: number, gainValue: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.55), time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.01);
    return osc;
  };

  const osc1 = click(now, 320, 0.1, 0.16);
  const osc2 = click(now + 0.1, 250, 0.12, 0.14);

  osc2.onended = () => void ctx.close();
  // Keep a reference path so the first oscillator is not garbage-collected too early in old browsers.
  void osc1;
};

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
          playTurnChessLikeSound();
        } catch {
          // Ignore audio errors
        }
      }
    }
    prevActiveTokenRef.current = activeToken ?? null;
  }, [activeToken, sessionToken]);

  return { turnPulse };
};

