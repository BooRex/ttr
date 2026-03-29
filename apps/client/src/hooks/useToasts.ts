import { useCallback, useState } from "react";

export type Toast = { id: string; kind: "error" | "info"; message: string };

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((c) => [...c, { id, kind, message }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((c) => c.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
};

