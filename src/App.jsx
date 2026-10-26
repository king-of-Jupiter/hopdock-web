import { useI18n, LanguageSwitch } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
  function openFeatures(event) {
    featuresRef.current = event.currentTarget;
    setFeatures(true);
  }
  function focusAccount() {
    if (busy) return;
    // The login form is shorter than the sign-up one: lay it out first, so the
    // scroll target is final and focus does not cut the smooth scroll short.
    flushSync(() => setMode("login"));
    const behavior = scrollBehavior();
    const focusFirst = () =>
      panelRef.current?.querySelector("input,button")?.focus({
        preventScroll: true,
      });
    panelRef.current?.scrollIntoView({ behavior, block: "center" });
    if (behavior === "instant") return focusFirst();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      removeEventListener("scrollend", finish);
      focusFirst();
    };
    const fallback = setTimeout(finish, 1200);
    addEventListener("scrollend", finish);
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
              type="button"
              onClick={openFeatures}
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
            <div className="season-label">
              <span className="season-dot" />
              {t("Ночная смена · Halloween edition")}
              <span>31 / 10</span>
            </div>
            <div className="hero-layout">
              <div className="hero-main">
                <h1 id="hero-title">
                  {t("Ваши серверы.")}
                  <br />
                  <em>{t("Без страшилок.")}</em>
                </h1>
                <div className="hero-copy">
                  <p className="hero-subtitle">
                    {t("SSH, ключи и команды — в одном рабочем пространстве.")}
                  </p>
                  <DownloadArea downloadRef={downloadRef} />
                  <button
                    className="mobile-features"
                    type="button"
                    onClick={openFeatures}
                  >
                    {t("Возможности")}
                  </button>
                </div>
              </div>
              <div className="haunted-art">
                <span className="art-caption">HOPDOCK AFTER DARK</span>
                <img
                  src={`${import.meta.env.BASE_URL}assets/halloween-night.webp`}
                  width="1254"
                  height="1254"
                  alt={t("Хэллоуинский коллаж: скелет за старым компьютером в моховом саду")}
                />
                <span className="art-sticker">
                  {t("Призраки — снаружи.")}<br />{t("Порядок — внутри.")}
                </span>
              </div>
            </div>
          </section>
          <div className="container product-preview-wrap">
            <div className="preview-caption">
              <span>01 / {t("Внутри всё спокойно")}</span>
              <span>SSH · {t("КЛЮЧИ")} · {t("СНИППЕТЫ")}</span>
            </div>
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
              <figcaption><span className="season-dot" />{t("Настоящий Hopdock. Никакой магии.")}<span>~/hopdock</span></figcaption>
            </figure>
          </div>
          <section
            className="container features"
            aria-labelledby="features-section-title"
          >
            <p className="section-index">02 / {t("Набор на ночную смену")}</p>
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
                <p className="section-index">03 / {t("На одной стороне экрана")}</p>
                <CloudArrowUp size={40} weight="light" />
                <h3>{t("В темноте.")}<br /><em>{t("На связи.")}</em></h3>
                <p>{featureList(t)[3][2]}</p>
                <span className="account-sigil" aria-hidden="true">✳</span>
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
          <span className="footer-season">HALLOWEEN EDITION / 2026</span>
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
