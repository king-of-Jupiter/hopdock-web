import { useI18n } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  ArrowLeft,
  DownloadSimple,
  SignOut,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { RELEASES_URL } from "./github";
import { authConfigured, authError, callbackUrl, supabase } from "./auth";
const query = new URLSearchParams(location.search);
const fragment = new URLSearchParams(location.hash.slice(1));
export const initialRecovery = ["recovery", "invite"].includes(
  fragment.get("type"),
);
export const initialLinkError = fragment.has("error") || query.has("error");
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
  disabled,
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          aria-describedby={hint ? id + "-hint" : undefined}
        />
        <button
          className="eye-button"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            (visible ? t("Скрыть ") : t("Показать ")) + label.toLowerCase()
          }
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? <EyeSlash size={23} /> : <Eye size={23} />}
        </button>
      </div>
      {hint && (
        <span className="field-hint" id={id + "-hint"}>
          {hint}
        </span>
      )}
    </div>
  );
}
function Notice({ notice }) {
  const { t } = useI18n();
  if (!notice) return null;
  const Icon = notice.kind === "error" ? WarningCircle : CheckCircle;
  return (
    <div
      className={"notice " + notice.kind}
      role={notice.kind === "error" ? "alert" : "status"}
    >
      <Icon size={22} />
      <span>{t(notice.text)}</span>
    </div>
  );
}
export function AuthPanel({ mode, setMode, panelRef, busy, setBusy }) {
  const { t, language } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState(
    initialLinkError
      ? {
          kind: "error",
          text: t(
            "Ссылка устарела или уже использована. Запросите новое письмо или войдите в аккаунт.",
          ),
        }
      : null,
  );
  const [sentEmail, setSentEmail] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const titleRef = useRef(null);
  const previousMode = useRef(mode);
  const preserveNotice = useRef(false);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, value) => {
      if (!alive) return;
      setSession(value);
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("hopdock:password-recovery", "1");
        setMode("reset");
        setNotice(null);
      }
      if (event === "SIGNED_OUT")
        sessionStorage.removeItem("hopdock:password-recovery");
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error)
          setNotice({
            kind: "error",
            text: authError(error),
          });
        setSession(data.session);
        if (
          data.session &&
          (initialRecovery ||
            sessionStorage.getItem("hopdock:password-recovery") === "1")
        )
          setMode("reset");
        if (
          !data.session &&
          (initialRecovery || query.get("flow") === "recovery")
        ) {
          setMode("recover");
          setNotice({
            kind: "error",
            text: t(
              "Не удалось открыть ссылку восстановления. Запросите новое письмо.",
            ),
          });
        }
        if (data.session && query.get("flow") === "confirmed")
          setNotice({
            kind: "success",
            text: t(
              "Email подтверждён. Теперь можно войти с этим аккаунтом в Hopdock.",
            ),
          });
        if (initialLinkError || query.has("flow"))
          history.replaceState(null, "", location.pathname);
      })
      .catch(
        (error) =>
          alive &&
          setNotice({
            kind: "error",
            text: authError(error),
          }),
      );
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [setMode]);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    if (preserveNotice.current) preserveNotice.current = false;
    else setNotice(null);
    setPassword("");
    setRepeat("");
    setSentEmail("");
    titleRef.current?.focus({
      preventScroll: true,
    });
  }, [mode]);
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  function changeMode(next) {
    if (!busy) {
      setNotice(null);
      setMode(next);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!supabase) {
      setNotice({
        kind: "error",
        text: t("Регистрация пока не настроена. Попробуйте позже."),
      });
      return;
    }
    if (["register", "reset"].includes(mode) && password.length < 12) {
      setNotice({
        kind: "error",
        text: t("Используйте пароль длиной не менее 12 символов."),
      });
      return;
    }
    if (["register", "reset"].includes(mode) && password !== repeat) {
      setNotice({
        kind: "error",
        text: t("Пароли не совпадают. Проверьте повторный ввод."),
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      let result;
      if (mode === "register")
        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { language },
            emailRedirectTo: callbackUrl(),
          },
        });
      else if (mode === "login")
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      else if (mode === "recover")
        result = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl("recovery"),
        });
      else if (mode === "reset") {
        if (!session)
          throw {
            code: "invalid_token",
          };
        result = await supabase.auth.updateUser({
          password,
        });
      }
      if (result?.error) throw result.error;
      setPassword("");
      setRepeat("");
      if (mode === "register" && !result.data.session) {
        setSentEmail(email.trim());
        setResendAt(Date.now() + 60000);
        setClock(Date.now());
        setNotice({
          kind: "success",
          text: t(
            "Проверьте почту. Если адрес доступен для регистрации, вы получите письмо для подтверждения email.",
          ),
        });
      } else if (mode === "recover")
        setNotice({
          kind: "success",
          text: t(
            "Если аккаунт с таким email существует, вы получите ссылку для восстановления пароля.",
          ),
        });
      else if (mode === "reset") {
        sessionStorage.removeItem("hopdock:password-recovery");
        preserveNotice.current = true;
        setMode("login");
        setNotice({
          kind: "success",
          text: t(
            "Пароль аккаунта обновлён. Используйте его для входа в Hopdock. Пароль шифрования не изменился.",
          ),
        });
      } else
        setNotice({
          kind: "success",
          text: t(
            "Вы вошли в аккаунт. Используйте этот же email и пароль в приложении Hopdock.",
          ),
        });
    } catch (error) {
      setNotice({
        kind: "error",
        text: authError(error),
      });
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!supabase || busy || Date.now() < resendAt) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sentEmail || email.trim(),
        options: {
          emailRedirectTo: callbackUrl(),
        },
      });
      if (error) throw error;
      setResendAt(Date.now() + 60000);
      setClock(Date.now());
      setNotice({
        kind: "success",
        text: t(
          "Запрос на повторное письмо отправлен. Проверьте входящие и папку «Спам».",
        ),
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: authError(error),
      });
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setNotice(null);
      setPassword("");
      setRepeat("");
      setMode("login");
    } catch (error) {
      setNotice({
        kind: "error",
        text: authError(error),
      });
    } finally {
      setBusy(false);
    }
  }
  const signedIn = session && mode !== "reset";
  const titles = {
    register: t("Создать аккаунт"),
    login: t("Войти в Hopdock"),
    recover: t("Забыли пароль?"),
    reset: t("Новый пароль"),
  };
  const subtitles = {
    register: t("Для синхронизации между устройствами."),
    login: t("Используйте email и пароль аккаунта."),
    recover: t("Отправим ссылку для восстановления."),
    reset: t("Обновите пароль аккаунта Hopdock."),
  };
  const wait = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  return (
    <section
      className="auth-panel"
      ref={panelRef}
      id="account"
      aria-labelledby="auth-title"
    >
      <div className="auth-inner" key={signedIn ? "account" : mode}>
        <h2 id="auth-title" ref={titleRef} tabIndex={-1}>
          {signedIn ? t("Вы в Hopdock.") : titles[mode]}
        </h2>
        <p className="auth-subtitle">
          {signedIn ? t("Ваш аккаунт готов к работе.") : subtitles[mode]}
        </p>
        {signedIn ? (
          <div className="account-state">
            <CheckCircle size={44} weight="light" className="account-check" />
            <p className="account-email">{session.user.email}</p>
            <p>
              {t(
                "Откройте приложение и войдите с этим email и паролем, чтобы настроить синхронизацию.",
              )}
            </p>
            <p className="security-note">
              {t("Пароль шифрования хранилища задаётся отдельно в приложении.")}
            </p>
            <Notice notice={notice} />
            <a
              className="auth-submit"
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadSimple size={22} />
              {t(" Скачать Hopdock")}
            </a>
            <button
              type="button"
              className="text-button signout"
              onClick={signOut}
              disabled={busy}
            >
              <SignOut size={18} />
              {t(" Выйти из аккаунта")}
            </button>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={submit} aria-busy={busy}>
              {mode !== "reset" && (
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={busy}
                    maxLength={254}
                  />
                </div>
              )}
              {mode !== "recover" && (
                <PasswordField
                  id="password"
                  label={mode === "reset" ? t("Новый пароль") : t("Пароль")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  hint={
                    mode !== "login" ? t("Не менее 12 символов.") : undefined
                  }
                />
              )}
              {["register", "reset"].includes(mode) && (
                <PasswordField
                  id="repeat-password"
                  label={t("Повторите пароль")}
                  value={repeat}
                  onChange={(event) => setRepeat(event.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              )}
              {mode === "login" && (
                <button
                  type="button"
                  className="text-button forgot"
                  onClick={() => changeMode("recover")}
                  disabled={busy}
                >
                  {t("Забыли пароль?")}
                </button>
              )}
              <Notice notice={notice} />
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy && <CircleNotch size={21} className="spinner" />}
                {busy
                  ? t("Подождите…")
                  : mode === "recover"
                    ? t("Отправить ссылку")
                    : mode === "reset"
                      ? t("Сохранить пароль")
                      : mode === "login"
                        ? t("Войти")
                        : t("Создать аккаунт")}
              </button>
              <p className="form-caption">
                {mode === "register"
                  ? t("Отправим письмо для подтверждения email.")
                  : mode === "login"
                    ? t("Пароль шифрования вводится в приложении.")
                    : mode === "recover"
                      ? t("Пароль шифрования хранилища не изменится.")
                      : t(
                          "Пароль аккаунта и пароль шифрования — разные пароли.",
                        )}
              </p>
              {(sentEmail ||
                notice?.text?.startsWith(t("Сначала подтвердите"))) && (
                <button
                  className="text-button resend"
                  type="button"
                  onClick={resend}
                  disabled={busy || wait > 0 || !email}
                >
                  <EnvelopeSimple size={17} />
                  {wait > 0
                    ? t("Повторить через ") + wait + t(" с")
                    : t("Отправить письмо повторно")}
                </button>
              )}
            </form>
            <div className="auth-switch">
              {mode === "register" ? (
                <>
                  {t("Уже есть аккаунт? ")}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => changeMode("login")}
                    disabled={busy}
                  >
                    {t("Войти")}
                  </button>
                </>
              ) : mode === "login" ? (
                <>
                  {t("Нет аккаунта? ")}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => changeMode("register")}
                    disabled={busy}
                  >
                    {t("Создать аккаунт")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => changeMode("login")}
                  disabled={busy}
                >
                  <ArrowLeft size={16} />
                  {t(" Вернуться ко входу")}
                </button>
              )}
            </div>
          </>
        )}
        {!authConfigured && (
          <p className="config-note">{t("Авторизация временно недоступна.")}</p>
        )}
      </div>
    </section>
  );
}
