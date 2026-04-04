import type { ReactNode } from "react";

type Props = {
  title: string;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const PanelShell = ({ title, headerRight, className, children }: Props) => {
  return (
    <section className={["panel-shell", className ?? ""].join(" ").trim()}>
      <header className="panel-shell-header">
        <h3 className="panel-shell-title" title={title}>{title}</h3>
        {headerRight ? <div className="panel-shell-header-right">{headerRight}</div> : null}
      </header>
      <div className="panel-shell-content">
        {children}
      </div>
    </section>
  );
};

