/**
 * Keep-Alive скрипт для предотвращения "засыпания" сервера на Render
 * Периодически пингует /health endpoint каждые 5 минут
 */

const PING_INTERVAL = 5 * 60 * 1000; // 5 минут

export function startKeepAlive() {
  const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;

  const ping = async () => {
    try {
      await fetch(`${serverUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      // Успешно запингили, ничего не делаем
    } catch (error) {
      // Ошибка - это нормально, сервер может быть недоступен
      console.debug("[Keep-Alive] Server ping failed (this is okay)");
    }
  };

  // Первый пинг через 1 минуту
  setTimeout(ping, 60 * 1000);

  // Потом каждые 5 минут
  setInterval(ping, PING_INTERVAL);

  if (import.meta.env.DEV) {
    console.log("[Keep-Alive] Started - pinging backend every 5 minutes");
  }
}

