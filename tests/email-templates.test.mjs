import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("supabase/templates/manifest.json", root), "utf8"),
);
test("all 13 templates have complete Russian/English HTML and correct Supabase placeholders", async () => {
  assert.equal(manifest.length, 13);
  for (const entry of manifest) {
    const routed = await readFile(new URL(entry.content_path, root), "utf8");
    assert.match(routed, /if eq .Data.language "ru"/);
    for (const language of ["ru", "en"]) {
      const html = await readFile(
        new URL(
          "supabase/templates/" + language + "/" + entry.name + ".html",
          root,
        ),
        "utf8",
      );
      assert.match(html, new RegExp('<html lang="' + language + '">'));
      assert.match(html, /role="presentation"/);
      assert.match(html, /<\/html>/);
      if (entry.name === "reauthentication") assert.match(html, /{{ .Token }}/);
      else if (!entry.notification)
        assert.match(html, /href="{{ .ConfirmationURL }}"/);
      else assert.doesNotMatch(html, /{{ .ConfirmationURL }}/);
      if (entry.name === "email_change") assert.match(html, /{{ .NewEmail }}/);
      if (entry.name === "email_changed_notification")
        assert.match(html, /{{ .OldEmail }}/);
      if (language === "en") assert.doesNotMatch(html, /[А-Яа-яЁё]/);
      assert.doesNotMatch(html, /<script|service_role|sb_secret_/);
    }
  }
});
