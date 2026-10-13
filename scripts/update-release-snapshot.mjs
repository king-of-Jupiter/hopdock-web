import { writeFile } from "node:fs/promises";
const repo = "king-of-Jupiter/hopdock";
const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN)
  headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
const response = await fetch(
  "https://api.github.com/repos/" + repo + "/releases/latest",
  { headers, signal: AbortSignal.timeout(10000) },
);
if (!response.ok)
  throw new Error("Release lookup failed: HTTP " + response.status);
const source = await response.json();
const release = {
  tag_name: source.tag_name,
  html_url: source.html_url,
  published_at: source.published_at,
  assets: source.assets.map(({ name, browser_download_url, size }) => ({
    name,
    browser_download_url,
    size,
  })),
};
if (!release.assets.length) throw new Error("The release contains no assets.");
await writeFile(
  new URL("../public/release.json", import.meta.url),
  JSON.stringify(release, null, 2) + "\n",
);
console.log(
  "Saved release " +
    release.tag_name +
    " (" +
    release.assets.length +
    " files).",
);
