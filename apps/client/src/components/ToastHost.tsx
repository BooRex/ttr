type Toast = {
  id: string;
  kind: "error" | "info";
  message: string;
};

type Props = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

export const ToastHost = ({ toasts, onDismiss }: Props) => {
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.kind}`}>
          <span>{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} aria-label="Закрыть уведомление">
            x
          </button>
        </div>
      ))}
    </div>
  );
};

