import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  infoText?: string;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const PanelShell = ({ title, infoText, headerRight, className, children }: Props) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const infoWrapRef = useRef<HTMLDivElement | null>(null);
  const infoBtnRef = useRef<HTMLButtonElement | null>(null);
  const infoPopoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, maxWidth: 280 });

  const updatePopoverPosition = useCallback(() => {
    const btn = infoBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const edgePad = 8;
    const maxWidth = Math.max(220, Math.min(320, Math.floor(viewportW * 0.72)));
    const preferredWidth = Math.min(280, maxWidth);
    const popoverHeight = infoPopoverRef.current?.offsetHeight ?? 120;

    let left = rect.left;
    left = Math.max(edgePad, Math.min(left, viewportW - preferredWidth - edgePad));

    let top = rect.bottom + 8;
    if (top + popoverHeight > viewportH - edgePad) {
      top = Math.max(edgePad, rect.top - popoverHeight - 8);
    }

    setPopoverPos({ top, left, maxWidth });
  }, []);

  useEffect(() => {
    if (!isInfoOpen) return;

    updatePopoverPosition();
    const raf = window.requestAnimationFrame(updatePopoverPosition);

    const onViewportChange = () => updatePopoverPosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (infoWrapRef.current?.contains(target)) return;
      if (infoPopoverRef.current?.contains(target)) return;
      setIsInfoOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isInfoOpen, updatePopoverPosition]);

  return (
    <section className={["panel-shell", className ?? ""].join(" ").trim()}>
      <header className="panel-shell-header">
        <div className="panel-shell-title-wrap">
          <h3 className="panel-shell-title" title={title}>{title}</h3>
          {infoText ? (
            <div className="panel-shell-info-wrap" ref={infoWrapRef}>
              <button
                ref={infoBtnRef}
                type="button"
                className="panel-shell-info-btn"
                aria-label={`Info: ${title}`}
                aria-expanded={isInfoOpen}
                onClick={() => setIsInfoOpen((current) => !current)}
              >
                ?
              </button>
            </div>
          ) : null}
        </div>
        {headerRight ? <div className="panel-shell-header-right">{headerRight}</div> : null}
      </header>
      <div className="panel-shell-content">
        {children}
      </div>

      {isInfoOpen && infoText
        ? createPortal(
          <div
            ref={infoPopoverRef}
            className="panel-shell-info-popover panel-shell-info-popover-portal"
            role="note"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              maxWidth: `${popoverPos.maxWidth}px`,
            }}
          >
            {infoText}
          </div>,
          document.body,
        )
        : null}
    </section>
  );
};

