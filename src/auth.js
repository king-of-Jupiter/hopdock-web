import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const authConfigured = Boolean(
  url && key && !/replace|your-project/.test(url + key),
);
export const supabase = authConfigured
  ? createClient(url, key, {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function callbackUrl(flow = "confirmed") {
  const base =
    import.meta.env.VITE_SITE_URL ||
    new URL(import.meta.env.BASE_URL, location.origin).href;
  const target = new URL(base);
  target.searchParams.set("flow", flow);
  target.searchParams.set(
    "lang",
    document.documentElement.lang === "en" ? "en" : "ru",
  );
  return target.href;
}
export function authError(error) {
  const code = error?.code || "";
  if (code === "invalid_credentials")
    return "Неверный email или пароль. Проверьте данные или восстановите пароль.";
  if (code === "email_not_confirmed")
    return "Сначала подтвердите email по ссылке в письме. Можно отправить письмо повторно.";
  if (code === "user_already_exists" || code === "email_exists")
    return "Этот email уже используется. Войдите или восстановите пароль.";
  if (code === "weak_password")
    return "Пароль не соответствует требованиям. Используйте не менее 12 символов, буквы, цифры и специальные символы.";
  if (code === "same_password")
    return "Новый пароль должен отличаться от текущего.";
  if (
    /rate_limit|over_email_send_rate_limit|over_request_rate_limit/.test(
      code,
    ) ||
    error?.status === 429
  )
    return "Слишком много попыток. Подождите несколько минут и повторите.";
  if (
    /otp_expired|flow_state_expired|bad_code_verifier|invalid_token/.test(code)
  )
    return "Ссылка устарела или уже использована. Запросите новое письмо.";
  if (/signup_disabled|email_provider_disabled/.test(code))
    return "Регистрация временно недоступна. Попробуйте позже.";
  if (/email_address_not_authorized|unexpected_failure/.test(code))
    return "Не удалось отправить письмо. Попробуйте позже: почтовый сервис временно недоступен.";
  if (error?.name === "AuthRetryableFetchError" || error instanceof TypeError)
    return "Не удалось связаться с сервисом. Проверьте интернет и повторите.";
  return "Не удалось выполнить действие. Повторите попытку позже. Введённые данные сохранены.";
}
