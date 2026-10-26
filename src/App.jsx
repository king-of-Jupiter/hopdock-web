import { useI18n, LanguageSwitch } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  GithubLogo,
  Star,
  X,
  Key,
  Folder,
  TerminalWindow,
  CloudArrowUp,
} from "@phosphor-icons/react";
import { REPO_URL, getStars } from "./github";
import { DownloadArea } from "./DownloadArea";
import { AuthPanel, initialRecovery, initialLinkError } from "./AuthPanel";
function GithubLink() {
  const { t } = useI18n();
  const [stars, setStars] = useState(null);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (!document.hidden)
        getStars()
          .then((value) => alive && setStars(value))
          .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return (
    <a
      className="github-link"
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t(
        `Hopdock на GitHub${stars !== null ? `, звёзд: ${stars}` : ""}`,
      )}
    >
      <GithubLogo size={24} weight="fill" />
      <span>GitHub</span>
      <span
        className="star-count"
        title={
          stars === null
            ? t("Счётчик временно недоступен")
            : t(`${stars} звёзд на GitHub`)
        }
      >
        <Star size={20} />
        <span aria-live="polite">
          {stars === null
            ? "—"
            : new Intl.NumberFormat(
                document.documentElement.lang === "en" ? "en-US" : "ru-RU",
                {
                  notation: stars > 9999 ? "compact" : "standard",
                },
              ).format(stars)}
        </span>
      </span>
    </a>
  );
}
function featureList(t) {
  return [
    [
      Folder,
      t("Хосты и группы"),
      t("Организуйте подключения по проектам и окружениям."),
    ],
    [
      Key,
      t("SSH-ключи"),
      t("Храните ключи и используйте их для подключения."),
    ],
    [
      TerminalWindow,
      t("Терминал и сниппеты"),
      t("Запускайте сохранённые команды в текущей оболочке."),
    ],
    [
      CloudArrowUp,
      t("Синхронизация"),
      t(
        "Переносите хосты, пароли, ключи и сниппеты между устройствами со сквозным шифрованием.",
      ),
    ],
  ];
}
function Features({ close, triggerRef }) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  const backdropStart = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      triggerRef.current?.focus();
    };
  }, []);
  return (
    <dialog
      className="features-dialog"
      ref={dialogRef}
      aria-labelledby="features-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onPointerDown={(event) => {
        backdropStart.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        if (backdropStart.current && event.target === event.currentTarget)
          close();
        backdropStart.current = false;
      }}
    >
      <div className="features-content">
        <button
          className="dialog-close"
          type="button"
          aria-label={t("Закрыть возможности")}
          onClick={close}
        >
          <X size={24} />
        </button>
        <h2 id="features-title">
          {t("Рабочее место")}
          <br />
          {t("для ваших серверов.")}
        </h2>
        <p className="feature-intro">
          {t("Всё необходимое для повседневной работы по SSH.")}
        </p>
        {featureList(t).map(([Icon, title, text]) => (
          <div className="feature-row" key={title}>
            <Icon size={28} weight="light" />
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
        <a
          className="text-button feature-github"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubLogo size={20} />
          {t(" Посмотреть проект на GitHub ")}
        </a>
      </div>
    </dialog>
  );
}
export function App() {
  const { t } = useI18n();
  const [mode, setMode] = useState(
    initialRecovery
      ? "reset"
      : initialLinkError
        ? "login"
        : new URLSearchParams(location.search).get("mode") === "recover"
          ? "recover"
          : "register",
  );
  const [busy, setBusy] = useState(false);
  const [features, setFeatures] = useState(false);
  const panelRef = useRef(null),
    downloadRef = useRef(null),
    featuresRef = useRef(null);
  const scrollBehavior = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";
  function focusAccount() {
    if (busy) return;
    setMode("login");
    panelRef.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: "start",
    });
    setTimeout(
      () =>
        panelRef.current?.querySelector("input,button")?.focus({
          preventScroll: true,
        }),
      100,
    );
  }
  return (
    <>
      <a className="skip-link" href="#account">
        {t("Перейти к аккаунту")}
      </a>
      <div className="site-shell">
        <header className="container site-header">
          <a
            className="brand"
            href={import.meta.env.BASE_URL}
            aria-label={t("Hopdock — главная")}
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/hopdock-mark.svg`}
              width="46"
              height="46"
              alt=""
            />
            <span>hopdock</span>
          </a>
          <LanguageSwitch />
          <nav className="header-nav" aria-label={t("Основная навигация")}>
            <button
              ref={featuresRef}
              type="button"
              onClick={() => setFeatures(true)}
            >
              {t("Возможности")}
            </button>
            <button
              type="button"
              onClick={() => {
                downloadRef.current?.scrollIntoView({
                  behavior: scrollBehavior(),
                  block: "center",
                });
                downloadRef.current?.querySelector("a")?.focus({
                  preventScroll: true,
                });
              }}
            >
              {t("Скачать")}
            </button>
            <GithubLink />
            <button
              className="login-button"
              type="button"
              onClick={focusAccount}
              disabled={busy}
            >
              {t("Войти")}
            </button>
          </nav>
        </header>
        <main>
          <section className="container hero" aria-labelledby="hero-title">
            <h1 id="hero-title">
              {t("Ваши серверы.")}
              <br />
              {t("Ваш порядок.")}
            </h1>
            <div className="hero-copy">
              <p className="hero-subtitle">
                {t("SSH, ключи и команды — в одном рабочем пространстве.")}
              </p>
              <DownloadArea downloadRef={downloadRef} />
              <button
                className="mobile-features"
                type="button"
                onClick={() => setFeatures(true)}
              >
                {t("Возможности")}
              </button>
            </div>
          </section>
          <div className="container product-preview-wrap">
            <figure className="product-preview">
              <img
                src={`${import.meta.env.BASE_URL}assets/terminal-preview.png`}
                alt={t(
                  "Интерфейс Hopdock: SSH-терминал с вкладками подключений и панелью сниппетов справа",
                )}
                width="1440"
                height="580"
                fetchPriority="high"
                draggable="false"
              />
            </figure>
          </div>
          <section
            className="container features"
            aria-labelledby="features-section-title"
          >
            <h2 id="features-section-title">
              {t("Рабочее место")} {t("для ваших серверов.")}
            </h2>
            <p className="feature-intro">
              {t("Всё необходимое для повседневной работы по SSH.")}
            </p>
            <div className="feature-grid">
              {featureList(t).map(([Icon, title, text]) => (
                <div className="feature-row" key={title}>
                  <Icon size={32} weight="light" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>
          <div className="account-band">
            <div className="container account-grid">
              <div className="account-pitch">
                <CloudArrowUp size={40} weight="light" />
                <h3>{featureList(t)[3][1]}</h3>
                <p>{featureList(t)[3][2]}</p>
              </div>
              <AuthPanel
                mode={mode}
                setMode={setMode}
                panelRef={panelRef}
                busy={busy}
                setBusy={setBusy}
              />
            </div>
          </div>
        </main>
        <footer className="container site-footer">
          <a className="brand" href={import.meta.env.BASE_URL} aria-label={t("Hopdock — главная")}>
            <img src={`${import.meta.env.BASE_URL}assets/hopdock-mark.svg`} width="32" height="32" alt="" />
            <span>hopdock</span>
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {t(" Посмотреть проект на GitHub ")}
          </a>
        </footer>
      </div>
      {features && (
        <Features close={() => setFeatures(false)} triggerRef={featuresRef} />
      )}
    </>
  );
}
