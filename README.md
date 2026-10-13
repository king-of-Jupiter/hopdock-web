# Hopdock Web

Сайт Hopdock по утверждённому мокапу: скачивание для Windows/Linux/macOS, русский и английский интерфейс, регистрация/вход/подтверждение email/восстановление пароля через существующий Supabase и живой счётчик GitHub.

## Локальный запуск

```sh
npm ci
cp .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 4173
```

В .env.local укажите URL и публичный publishable key проекта Hopdock. Это не пароль и не service_role. Использовать публичную конфигурацию из Variables основного репозитория. .env.local исключён из Git. Сервер/хостинг backend не нужен: браузер обращается напрямую к Supabase Auth и GitHub API.

```sh
npm run build
npm test
```

Готовые статические файлы: dist/client. Дополнительный Worker из шаблона не требуется для GitHub Pages. В .github/workflows/pages.yml подготовлен build/deploy. Репозиторий создан приватным; публикация выключена.

## GitHub Pages

1. Для Pages на GitHub Free сделайте только этот репозиторий публичным, когда решите публиковать, затем Settings → Pages → GitHub Actions.
2. Repository Variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. Они уже совпадают с Hopdock. BASE_PATH по умолчанию /hopdock-web/; SITE_URL — https://king-of-Jupiter.github.io/hopdock-web/.
3. В Supabase Auth → URL Configuration добавьте точные Redirect URLs для подтверждения и восстановления: SITE_URL + ?flow=confirmed&lang=ru, ?flow=confirmed&lang=en, ?flow=recovery&lang=ru, ?flow=recovery&lang=en. Для разработки — аналогичные URL на http://127.0.0.1:4173/. Основной Site URL задайте без завершающего слеша: https://king-of-Jupiter.github.io/hopdock-web. Не удалять прежние callback URL приложения.
4. Подключите свой SMTP для писем обычным пользователям; подтверждение email не отключать.
5. Установите PAGES_ENABLED=true и запустите workflow. Для своего домена BASE_PATH=/, SITE_URL=https://ваш-домен/ и соответствующие точные redirect URLs. Настройте DNS и Enforce HTTPS.

Регистрация и вход используют SDK Supabase. Сайт не читает хосты, пароли серверов, ключи или зашифрованное хранилище. Пароль аккаунта и пароль шифрования независимы.

## Загрузки и звёзды

Сайт определяет ОС и запрашивает latest release GitHub. Для Mac процессор выбирается вручную, если браузер не предоставляет надёжную архитектуру; Intel-сборка не подменяется ARM. На телефоне предлагаются версии для компьютера. Неизвестная ОС/ошибка API ведёт к релизам. При недоступном GitHub используется проверенный кэш или release.json, обновляемый при сборке и ежедневно workflow. Резервный релиз честно обозначен как сохранённый.

Звёзды — GitHub REST API без токена, кэш 5 минут, обновление каждые 10 минут и при возвращении на вкладку. API rate limit не блокирует регистрацию или загрузку.

## Письма Supabase

13 шаблонов: подтверждение email, recovery, invite, magic link, изменение email, код reauthentication и 7 уведомлений безопасности. HTML адаптирован для email-клиентов: inline CSS, таблицы, альтернативная ссылка, русский/английский текст и переменные Supabase.

- Просмотр: /email-previews/ (только примеры, ссылки не выполняют авторизацию).
- Готовые локализованные файлы: supabase/templates/ru и en.
- Автоматические файлы supabase/templates/*.html выбирают RU по .Data.language=ru, иначе EN. При регистрации сайт сохраняет language в user_metadata. Старые аккаунты без этого поля получают английский текст. Для строго единого языка можно применить отдельный локализованный файл.
- Темы писем и пути: manifest.json. Сборка: npm run emails:build.
- В Dashboard: Auth → Email Templates — вставить нужные HTML. Скрипт npm run emails:apply использует SUPABASE_PROJECT_REF и SUPABASE_ACCESS_TOKEN из локального окружения, после PATCH проверяет полученную конфигурацию; --dry-run показывает число шаблонов без записи. Токен в Git не сохранять. Уведомления безопасности включаются отдельно; скрипт не меняет SMTP или действующие Auth настройки.

Настройка cloud шаблонов и фактическая доставка писем ещё не выполнены. Сборка HTML и проверки SDK на localhost не являются проверкой доставки SMTP.

## Проверки и материалы

docs/reference.png — выбранный макет. design-qa.md — сравнение с реализацией. docs/motion.md — интернет-источники анимаций. docs/terminal-capture.md — реальный скрин Hopdock с отдельным профилем и локальным SSH fixture.

Для изолированной ручной проверки Auth:

```sh
node scripts/auth-fixture.mjs
# В другой консоли, только для отдельного тестового процесса:
VITE_SUPABASE_URL=http://127.0.0.1:54329 VITE_SUPABASE_PUBLISHABLE_KEY=fixture-public-key npm run dev -- --port 4174
```

Эти переменные в PowerShell задаются через $env:NAME='value'. Не менять .env.local рабочего превью ради тестов. Fixture не проксирует запросы в облако и не сохраняет пароли на диск.
