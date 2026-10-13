export const REPOSITORY = "king-of-Jupiter/hopdock";
export const REPO_URL = `https://github.com/${REPOSITORY}`;
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
const TTL = 5 * 60 * 1000;
const pending = new Map();

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(`hopdock:${key}`));
  } catch {
    return null;
  }
}
function writeCache(key, data) {
  try {
    localStorage.setItem(
      `hopdock:${key}`,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    /* Storage is optional. */
  }
}
async function githubRequest(path, key, validate) {
  const cache = readCache(key);
  if (cache && Date.now() - cache.at < TTL && validate(cache.data))
    return cache.data;
  if (pending.has(key)) return pending.get(key);
  const request = (async () => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPOSITORY}${path}`,
        {
          headers: { Accept: "application/vnd.github+json" },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) throw new Error("github_unavailable");
      const data = await response.json();
      if (!validate(data)) throw new Error("github_invalid_response");
      writeCache(key, data);
      return data;
    } catch (error) {
      if (cache && validate(cache.data))
        return key === "release" ? { ...cache.data, _stale: true } : cache.data;
      throw error;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, request);
  return request;
}
export async function getStars() {
  const repo = await githubRequest(
    "",
    "stars",
    (value) =>
      Number.isSafeInteger(value?.stargazers_count) &&
      value.stargazers_count >= 0,
  );
  return repo.stargazers_count;
}
export function isDownloadUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.startsWith(`/${REPOSITORY}/releases/download/`)
    );
  } catch {
    return false;
  }
}
export function validRelease(value) {
  return (
    typeof value?.tag_name === "string" &&
    Array.isArray(value.assets) &&
    value.assets.every(
      (asset) =>
        typeof asset.name === "string" &&
        isDownloadUrl(asset.browser_download_url),
    )
  );
}
export async function getRelease() {
  try {
    const release = await githubRequest(
      "/releases/latest",
      "release",
      validRelease,
    );
    return { release, source: release._stale ? "snapshot" : "live" };
  } catch {
    const response = await fetch(`${import.meta.env.BASE_URL}release.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("release_unavailable");
    const release = await response.json();
    if (!validRelease(release)) throw new Error("release_invalid");
    return { release, source: "snapshot" };
  }
}
export function detectPlatform(nav = navigator) {
  const ua = nav.userAgent || "";
  const platform = nav.userAgentData?.platform || nav.platform || "";
  if (
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (/Mac/i.test(platform) && nav.maxTouchPoints > 1)
  )
    return "mobile";
  if (/Win/i.test(platform + ua)) return "windows";
  if (/Mac/i.test(platform + ua)) return "mac";
  if (/Linux|X11/i.test(platform + ua)) return "linux";
  return "unknown";
}
export function selectAsset(release, platform, architecture = "") {
  const assets = release?.assets || [];
  const matches = assets.filter(
    (asset) =>
      isDownloadUrl(asset.browser_download_url) &&
      !/\.blockmap$/i.test(asset.name),
  );
  if (platform === "windows")
    return (
      matches.find(
        (a) => /setup.*\.exe$/i.test(a.name) && !/arm64/i.test(a.name),
      ) || null
    );
  if (platform === "linux")
    return (
      matches.find(
        (a) =>
          /\.AppImage$/i.test(a.name) &&
          (architecture === "arm64"
            ? /arm64|aarch64/i.test(a.name)
            : !/arm64|aarch64/i.test(a.name)),
      ) || null
    );
  if (platform === "mac") {
    if (!["arm64", "x64"].includes(architecture)) return null;
    return (
      matches.find(
        (a) =>
          /\.dmg$/i.test(a.name) &&
          (architecture === "arm64"
            ? /arm64/i.test(a.name)
            : !/arm64/i.test(a.name)),
      ) || null
    );
  }
  return null;
}
