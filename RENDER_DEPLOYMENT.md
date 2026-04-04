# Деплой на Render.com

## 🚀 Быстрый старт

### 1️⃣ Подготовка GitHub

```bash
# Убедись, что все закомичено
git add .
git commit -m "Setup Render deployment"
git push origin main
```

### 2️⃣ На сайте Render

1. Перейди на https://render.com
2. Зарегистрируйся/авторизуйся через GitHub
3. Нажми "New +" → "Blueprint"
4. Выбери "Public Git repository"
5. Введи URL репо: `https://github.com/YOUR_USERNAME/ticket-to-ride-mvp`
   - *(или скопируй со своего GitHub)*
6. Нажми "Connect"
7. На странице создания выбери ветку `main` и нажми "Deploy"

### 3️⃣ Ждем деплоя (~5-10 минут)

Render автоматически:
- ✅ Установит зависимости
- ✅ Собрет фронтенд (React)
- ✅ Собрет backend (TypeScript)
- ✅ Запустит оба сервиса
- ✅ Создаст URL для каждого

### 4️⃣ Получи ссылки

После деплоя у тебя будет:

```
Frontend: https://ttr-client.onrender.com
Backend:  https://ttr-server.onrender.com
```

**Все готово!** Ссылку на frontend можешь отправить друзьям.

---

## 📝 Что происходит под капотом

**render.yaml** содержит конфигурацию для двух сервисов:

### Backend (Node.js + Express)
- Собирается: `npm run build`
- Запускается: `npm run start -w apps/server`
- Port: 3000 (Render автоматически проксирует)
- Health check: `/health` endpoint

### Frontend (Static Site)
- Собирается: `npm run build -w apps/client`
- Файлы: в `apps/client/dist/`
- Роут: все запросы → `index.html` (для React Router)
- Env: `VITE_SERVER_URL` автоматически указывает на backend

---

## ✅ Проверка статуса

1. Открой Dashboard в Render
2. Кликни на сервис
3. Проверь "Logs"

### Если что-то не работает

| Проблема | Решение |
|----------|---------|
| `build failed` | Посмотри логи - обычно проблема в npm install |
| `service crashed` | Проверь PORT (должен быть 3000) |
| Фронтенд не загружается | Проверь `dist/index.html` существует |
| WebSocket не работает | Render поддерживает - может быть CORS проблема |

### Посмотри логи
```
Сервис → Logs → выбери тип (Build/Deploy/Runtime)
```

---

## 🌍 После успешного деплоя

1. **Тестирование**: Открой https://ttr-client.onrender.com в браузере
2. **Поделись**: Отправь ссылку друзьям
3. **Игра**: Они откроют в браузере и смогут создавать комнаты

---

## 🔄 Как обновлять?

После изменений в коде:

```bash
git add .
git commit -m "Update game rules"
git push origin main
```

**Render автоматически перезапустит деплой** (примерно за 10 минут)

---

## 🆘 Проблемы и решения

### "Service spinning up..." слишком долго
- Это нормально для первого деплоя
- После первого раза будет быстрее
- Если >15 минут - посмотри логи

### "Connection refused" при подключении
- Проверь, что backend запустился (логи)
- Проверь `VITE_SERVER_URL` в переменных окружения
- Может быть прошло < 1 минуты после деплоя

### WebSocket не подключается
- Проверь консоль браузера (F12 → Console)
- Убедись, что backend URL правильный
- CORS должны быть включены (уже настроены)

---

## 💰 Стоимость

- **Бесплатный план**: 
  - ✅ 750 часов/месяц (хватает для 1 запущенного сервиса)
  - ✅ WebSockets поддерживаются
  - ✅ Отличный для тестирования
  
- **Когда начать платить**: 
  - Если > 2 активных сервисов
  - Или нужна 100% uptime
  - Или > 750 часов/месяц

---

## 📚 Полезные ссылки

- [Render Docs](https://render.com/docs)
- [Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Environment Variables](https://render.com/docs/environment-variables)

---

## Если нужна помощь

- Посмотри логи деплоя в Dashboard
- Проверь консоль браузера (F12)
- Убедись, что `git push` прошел на GitHub

