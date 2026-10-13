# Письма

Состав и переменные проверены по [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) и [Management API Auth config](https://supabase.com/docs/reference/api/v1-update-auth-service-config). Письма используют ConfirmationURL для одноразовых действий и Token для reauthentication. Уведомления безопасности не содержат ConfirmationURL.

Локальное переключение языка писем использует документированный Data (user_metadata) только для оформления, не для авторизации. На сайте language сохраняется при signUp. Supabase настройки шаблонов требуют применения отдельно; автоматический apply script не меняет SMTP, RLS, аккаунты или схемы базы и проверяет результат после PATCH.

Логотип в письме загружается с SiteURL/assets/hopdock-icon.png; Site URL рекомендуется без завершающего слеша. Если почтовый клиент блокирует изображения, рядом остаётся текстовый wordmark. В письмах не используются webfont/CDN/script.

Файлы предварительного просмотра содержат только example.com адреса и примерный OTP 123456. Ни один preview не является рабочей ссылкой подтверждения.
