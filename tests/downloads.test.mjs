import test from "node:test";
import assert from "node:assert/strict";
import {
  detectPlatform,
  selectAsset,
  isDownloadUrl,
  validRelease,
} from "../src/github.js";
const asset = (name) => ({
  name,
  browser_download_url:
    "https://github.com/king-of-Jupiter/hopdock/releases/download/v1/" + name,
});
const release = {
  tag_name: "v1",
  assets: [
    asset("Hopdock-Setup-1.exe"),
    asset("Hopdock-Setup-1.exe.blockmap"),
    asset("Hopdock-1-arm64.dmg"),
    asset("Hopdock-1.AppImage"),
  ],
};
test("detect desktop systems and do not classify phones as desktop Linux/Mac", () => {
  for (const [nav, expected] of [
    [{ platform: "Win32", userAgent: "Windows NT 10.0" }, "windows"],
    [{ platform: "MacIntel", userAgent: "Mac OS X", maxTouchPoints: 0 }, "mac"],
    [{ platform: "Linux x86_64", userAgent: "X11 Linux" }, "linux"],
    [{ platform: "Linux", userAgent: "Android" }, "mobile"],
    [{ platform: "MacIntel", maxTouchPoints: 5 }, "mobile"],
    [{ platform: "", userAgent: "" }, "unknown"],
  ])
    assert.equal(detectPlatform(nav), expected);
});
test("select actual release artifacts and ignore update metadata", () => {
  assert.equal(selectAsset(release, "windows").name, "Hopdock-Setup-1.exe");
  assert.equal(selectAsset(release, "linux").name, "Hopdock-1.AppImage");
  assert.equal(selectAsset(release, "linux", "arm64"), null);
  assert.equal(
    selectAsset(release, "mac", "arm64").name,
    "Hopdock-1-arm64.dmg",
  );
  assert.equal(selectAsset(release, "mac"), null);
  assert.equal(selectAsset(release, "mac", "x64"), null);
  assert.equal(selectAsset(release, "mobile"), null);
});
test("downloads accept only HTTPS assets belonging to the Hopdock repo", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://evil.test/a.exe",
    "https://github.com/other/repo/releases/download/v1/a.exe",
    "http://github.com/king-of-Jupiter/hopdock/releases/download/v1/a.exe",
  ])
    assert.equal(isDownloadUrl(value), false);
  assert.equal(validRelease(release), true);
  assert.equal(
    validRelease({
      ...release,
      assets: [
        { name: "bad.exe", browser_download_url: "https://evil.test/bad.exe" },
      ],
    }),
    false,
  );
});
