import test from "node:test";
import assert from "node:assert/strict";
import { getStars } from "../src/github.js";
test("star counter accepts zero, caches requests, refreshes expired data and survives rate limits", async () => {
  const originalFetch = globalThis.fetch,
    originalStorage = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
  const storage = new Map();
  let requests = 0;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  try {
    globalThis.fetch = async () => {
      requests++;
      return { ok: true, json: async () => ({ stargazers_count: 0 }) };
    };
    assert.equal(await getStars(), 0);
    assert.equal(await getStars(), 0);
    assert.equal(requests, 1);
    const cache = JSON.parse(storage.get("hopdock:stars"));
    cache.at = Date.now() - 6 * 60 * 1000;
    storage.set("hopdock:stars", JSON.stringify(cache));
    globalThis.fetch = async () => {
      requests++;
      return { ok: true, json: async () => ({ stargazers_count: 23 }) };
    };
    assert.equal(await getStars(), 23);
    assert.equal(requests, 2);
    storage.set(
      "hopdock:stars",
      JSON.stringify({ ...cache, data: { stargazers_count: 23 } }),
    );
    globalThis.fetch = async () => ({ ok: false, status: 403 });
    assert.equal(await getStars(), 23);
    storage.clear();
    await assert.rejects(getStars());
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage)
      Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
  }
});
