import { useI18n } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  WindowsLogo,
  AppleLogo,
  LinuxLogo,
  DownloadSimple,
  CircleNotch,
  CaretDown,
} from "@phosphor-icons/react";
import {
  RELEASES_URL,
  detectPlatform,
  getRelease,
  selectAsset,
} from "./github";
const names = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
};
const icons = {
  windows: WindowsLogo,
  mac: AppleLogo,
  linux: LinuxLogo,
};
export function DownloadArea({ downloadRef }) {
  const { t } = useI18n();
  const [platform, setPlatform] = useState(() => detectPlatform());
  const [architecture, setArchitecture] = useState(() =>
    /aarch64|arm64|armv8l/i.test(navigator.platform + navigator.userAgent) &&
    detectPlatform() !== "mac"
      ? "arm64"
      : "",
  );
  const [release, setRelease] = useState(null);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const detailsRef = useRef(null);
  useEffect(() => {
    let alive = true;
    getRelease()
      .then((result) => {
        if (alive) {
          setRelease(result.release);
          setSource(result.source);
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    // Mac user agents report Intel even on Apple Silicon. Do not guess its CPU.
    if (navigator.userAgentData?.getHighEntropyValues)
      navigator.userAgentData
        .getHighEntropyValues(["architecture"])
        .then((data) => {
          if (alive && platform === "mac" && /arm/i.test(data.architecture))
            setArchitecture("arm64");
          if (alive && platform === "mac" && /x86/i.test(data.architecture))
            setArchitecture("x64");
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const asset = selectAsset(release, platform, architecture);
  const Icon = icons[platform] || DownloadSimple;
  const macChoice = platform === "mac" && !architecture;
  const label = loading
    ? t("Проверяем последний релиз…")
    : macChoice
      ? t("Скачать для macOS")
      : asset
        ? t("Скачать для ") + names[platform]
        : names[platform]
          ? t("Релизы для ") + names[platform]
          : t("Версии для компьютера");
  function chooseMac(event) {
    event.preventDefault();
    setExpanded(true);
    requestAnimationFrame(() =>
      detailsRef.current?.querySelector("select")?.focus(),
    );
  }
  return (
    <div
      className="download-area"
      ref={downloadRef}
      id="download"
      tabIndex={-1}
    >
      <a
        className="download-button"
        href={asset?.browser_download_url || RELEASES_URL}
        target={asset ? undefined : "_blank"}
        rel={asset ? undefined : "noopener noreferrer"}
        onClick={macChoice ? chooseMac : undefined}
      >
        <Icon size={28} weight="fill" />
        <span>{label}</span>
        {loading && <CircleNotch className="spinner" size={18} />}
      </a>
      <div className="download-caption">
        {t("Аккаунт нужен для синхронизации.")}
      </div>
      <details
        className="platform-picker"
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
        ref={detailsRef}
      >
        <summary>
          {t("Другие платформы ")}
          <CaretDown size={14} />
        </summary>
        <div className="platform-content">
          <div
            className="platform-options"
            aria-label={t("Операционная система")}
          >
            {Object.entries(names).map(([value, name]) => (
              <button
                type="button"
                key={value}
                aria-pressed={platform === value}
                onClick={() => setPlatform(value)}
              >
                {name}
              </button>
            ))}
          </div>
          {platform === "mac" && (
            <label className="architecture-label">
              {t("Процессор Mac")}
              <select
                aria-label={t("Процессор Mac")}
                value={architecture}
                onChange={(event) => setArchitecture(event.target.value)}
              >
                <option value="">{t("Выберите процессор")}</option>
                <option value="arm64">{t("Apple Silicon (M1 и новее)")}</option>
                <option value="x64">Intel</option>
              </select>
            </label>
          )}
          {platform === "mac" &&
            architecture === "x64" &&
            !asset &&
            !loading && (
              <p className="platform-note">
                {t(
                  "В последнем релизе нет сборки для Intel. Посмотрите доступные версии на GitHub.",
                )}
              </p>
            )}
          {platform === "mobile" && (
            <p className="platform-note">
              {t(
                "Hopdock работает на компьютере. Выберите нужную систему или откройте релизы.",
              )}
            </p>
          )}
          {release && (
            <p className="release-note">
              {source === "snapshot"
                ? t("Сохранённый релиз")
                : t("Последний релиз")}
              : {release.tag_name}
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                {t("Все файлы на GitHub ")}
              </a>
            </p>
          )}
          {!release && !loading && (
            <p className="platform-note">
              {t(
                "Не удалось получить список файлов. Скачать приложение можно на странице релизов.",
              )}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
