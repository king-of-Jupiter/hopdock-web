import { createContext, useContext, useEffect, useState } from "react";
const en = {
  "ваши серверы переживут эту ночь": "your servers will survive the night",
  "Приостановить строку": "Pause ticker",
  "Продолжить строку": "Resume ticker",
  "[ экран приложения ]": "[ app preview ]",
  "[ возможности ]": "[ features ]",
  "[ аккаунт ]": "[ account ]",
  "СНИППЕТЫ": "SNIPPETS",
  "КЛЮЧИ": "KEYS",
  "Настоящий Hopdock. Никакой магии.": "The real Hopdock. No magic tricks.",
  "Основная навигация": "Main navigation",
  "Перейти к аккаунту": "Skip to account",
  "Hopdock — главная": "Hopdock — home",
  Возможности: "Features",
  Скачать: "Download",
  Войти: "Sign in",
  "Ваши серверы.": "Your servers.",
  "Ваш порядок.": "Your workspace.",
  "SSH, ключи и команды — в одном рабочем пространстве.":
    "SSH, keys, and commands — in one workspace.",
  "Интерфейс Hopdock: SSH-терминал с вкладками подключений и панелью сниппетов справа":
    "Hopdock interface: SSH terminal with connection tabs and a snippets panel on the right",
  "Рабочее место": "A workspace",
  "для ваших серверов.": "for your servers.",
  "Всё необходимое для повседневной работы по SSH.":
    "Everything you need for everyday SSH work.",
  "Хосты и группы": "Hosts and groups",
  "Организуйте подключения по проектам и окружениям.":
    "Organize connections by project and environment.",
  "SSH-ключи": "SSH keys",
  "Храните ключи и используйте их для подключения.":
    "Keep your keys ready for connections.",
  "Терминал и сниппеты": "Terminal and snippets",
  "Запускайте сохранённые команды в текущей оболочке.":
    "Run saved commands in your current shell.",
  Синхронизация: "Sync",
  "Переносите хосты, пароли, ключи и сниппеты между устройствами со сквозным шифрованием.":
    "Sync hosts, passwords, keys, and snippets across devices with end-to-end encryption.",
  "Посмотреть проект на GitHub": "View the project on GitHub",
  "Закрыть возможности": "Close features",
  "Hopdock на GitHub": "Hopdock on GitHub",
  "звёзд:": "stars:",
  "звёзд на GitHub": "stars on GitHub",
  "Счётчик временно недоступен": "Star count is temporarily unavailable",
  "Проверяем последний релиз…": "Checking the latest release…",
  "Скачать для macOS": "Download for macOS",
  "Скачать для ": "Download for ",
  "Релизы для ": "Releases for ",
  "Версии для компьютера": "Desktop versions",
  "Аккаунт нужен для синхронизации.": "An account is needed for sync.",
  "Другие платформы": "Other platforms",
  "Операционная система": "Operating system",
  "Процессор Mac": "Mac processor",
  "Выберите процессор": "Select processor",
  "Apple Silicon (M1 и новее)": "Apple Silicon (M1 and newer)",
  "В последнем релизе нет сборки для Intel. Посмотрите доступные версии на GitHub.":
    "The latest release has no Intel build. Check the available versions on GitHub.",
  "Hopdock работает на компьютере. Выберите нужную систему или откройте релизы.":
    "Hopdock runs on desktop. Choose a system or browse releases.",
  "Сохранённый релиз": "Saved release",
  "Последний релиз": "Latest release",
  "Все файлы на GitHub": "All files on GitHub",
  "Не удалось получить список файлов. Скачать приложение можно на странице релизов.":
    "Could not load the files. Download the app from the releases page.",
  "Создать аккаунт": "Create account",
  "Войти в Hopdock": "Sign in to Hopdock",
  "Забыли пароль?": "Forgot your password?",
  "Новый пароль": "New password",
  "Для синхронизации между устройствами.": "For syncing across your devices.",
  "Используйте email и пароль аккаунта.":
    "Use your account email and password.",
  "Отправим ссылку для восстановления.": "We will send a password reset link.",
  "Обновите пароль аккаунта Hopdock.": "Update your Hopdock account password.",
  Пароль: "Password",
  "Повторите пароль": "Repeat password",
  "Не менее 12 символов.": "At least 12 characters.",
  "Показать ": "Show ",
  "Скрыть ": "Hide ",
  пароль: "password",
  "повторите пароль": "repeat password",
  "новый пароль": "new password",
  "Вы в Hopdock.": "You're in Hopdock.",
  "Ваш аккаунт готов к работе.": "Your account is ready.",
  "Откройте приложение и войдите с этим email и паролем, чтобы настроить синхронизацию.":
    "Open the app and sign in with this email and password to set up sync.",
  "Пароль шифрования хранилища задаётся отдельно в приложении.":
    "Your vault encryption password is set separately in the app.",
  "Скачать Hopdock": "Download Hopdock",
  "Выйти из аккаунта": "Sign out",
  "Подождите…": "Please wait…",
  "Отправить ссылку": "Send reset link",
  "Сохранить пароль": "Save password",
  "Отправим письмо для подтверждения email.":
    "We will send an email to confirm your address.",
  "Пароль шифрования вводится в приложении.":
    "Enter your encryption password in the app.",
  "Пароль шифрования хранилища не изменится.":
    "Your vault encryption password will not change.",
  "Пароль аккаунта и пароль шифрования — разные пароли.":
    "Your account and vault encryption passwords are separate.",
  "Отправить письмо повторно": "Resend email",
  "Повторить через ": "Try again in ",
  " с": " s",
  "Уже есть аккаунт?": "Already have an account?",
  "Нет аккаунта?": "Don't have an account?",
  "Вернуться ко входу": "Back to sign in",
  "Авторизация временно недоступна.":
    "Authentication is temporarily unavailable.",
  "Ссылка устарела или уже использована. Запросите новое письмо или войдите в аккаунт.":
    "This link has expired or has already been used. Request a new email or sign in.",
  "Не удалось открыть ссылку восстановления. Запросите новое письмо.":
    "Could not open the reset link. Request a new email.",
  "Email подтверждён. Теперь можно войти с этим аккаунтом в Hopdock.":
    "Email confirmed. You can now sign in to Hopdock with this account.",
  "Регистрация пока не настроена. Попробуйте позже.":
    "Registration is not configured yet. Please try again later.",
  "Используйте пароль длиной не менее 12 символов.":
    "Use a password with at least 12 characters.",
  "Пароли не совпадают. Проверьте повторный ввод.":
    "Passwords do not match. Check the repeated password.",
  "Проверьте почту. Если адрес доступен для регистрации, вы получите письмо для подтверждения email.":
    "Check your inbox. If this address is available for registration, you will receive a confirmation email.",
  "Если аккаунт с таким email существует, вы получите ссылку для восстановления пароля.":
    "If an account with this email exists, you will receive a password reset link.",
  "Пароль аккаунта обновлён. Используйте его для входа в Hopdock. Пароль шифрования не изменился.":
    "Account password updated. Use it to sign in to Hopdock. Your vault encryption password has not changed.",
  "Вы вошли в аккаунт. Используйте этот же email и пароль в приложении Hopdock.":
    "You are signed in. Use the same email and password in the Hopdock app.",
  "Запрос на повторное письмо отправлен. Проверьте входящие и папку «Спам».":
    "A resend request was sent. Check your inbox and spam folder.",
  "Сначала подтвердите email по ссылке в письме. Можно отправить письмо повторно.":
    "Confirm your email using the link in your inbox. You can resend the email.",
  "Сначала подтвердите": "Confirm your",
  "Неверный email или пароль. Проверьте данные или восстановите пароль.":
    "Incorrect email or password. Check your details or reset your password.",
  "Этот email уже используется. Войдите или восстановите пароль.":
    "This email is already in use. Sign in or reset your password.",
  "Пароль не соответствует требованиям. Используйте не менее 12 символов, буквы, цифры и специальные символы.":
    "This password does not meet the requirements. Use at least 12 characters, letters, numbers, and symbols.",
  "Новый пароль должен отличаться от текущего.":
    "The new password must differ from your current password.",
  "Слишком много попыток. Подождите несколько минут и повторите.":
    "Too many attempts. Wait a few minutes and try again.",
  "Ссылка устарела или уже использована. Запросите новое письмо.":
    "This link has expired or has already been used. Request a new email.",
  "Регистрация временно недоступна. Попробуйте позже.":
    "Registration is temporarily unavailable. Please try again later.",
  "Не удалось отправить письмо. Попробуйте позже: почтовый сервис временно недоступен.":
    "Could not send the email. Please try later: the mail service is temporarily unavailable.",
  "Не удалось связаться с сервисом. Проверьте интернет и повторите.":
    "Could not reach the service. Check your internet connection and try again.",
  "Не удалось выполнить действие. Повторите попытку позже. Введённые данные сохранены.":
    "Could not complete the action. Please try again later. Your input has been preserved.",
};
const LanguageContext = createContext(null);
function chooseLanguage() {
  const query = new URLSearchParams(location.search).get("lang");
  if (query === "ru" || query === "en") return query;
  try {
    const saved = localStorage.getItem("hopdock:language");
    if (saved === "ru" || saved === "en") return saved;
  } catch {}
  return navigator.language?.startsWith("ru") ? "ru" : "en";
}
export function translate(text, language) {
  if (typeof text !== "string") return text;
  if (language === "ru")
    return Object.entries(en).find(([, value]) => value === text)?.[0] || text;
  if (en[text] !== undefined) return en[text];
  const trimmed = text.trim();
  if (en[trimmed] !== undefined) return text.replace(trimmed, en[trimmed]);
  // Only composed labels need prefix/suffix substitution.
  return Object.keys(en)
    .filter((key) => text.includes(key))
    .sort((a, b) => b.length - a.length)
    .reduce((value, key) => value.replaceAll(key, en[key]), text);
}
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(chooseLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "ru"
        ? "Hopdock — ваши серверы, ваш порядок"
        : "Hopdock — your servers, your workspace";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        language === "ru"
          ? "Hopdock — SSH, ключи и команды в одном рабочем пространстве."
          : "Hopdock — SSH, keys, and commands in one workspace. Download for Windows, macOS, and Linux.",
      );
    try {
      localStorage.setItem("hopdock:language", language);
    } catch {}
  }, [language]);
  const t = (text) => translate(text, language);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useI18n() {
  return useContext(LanguageContext);
}
export function LanguageSwitch() {
  const { language, setLanguage } = useI18n();
  return (
    <div
      className="language-switch"
      role="group"
      aria-label={language === "ru" ? "Язык сайта" : "Website language"}
    >
      <button
        type="button"
        aria-pressed={language === "ru"}
        onClick={() => setLanguage("ru")}
      >
        RU
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
