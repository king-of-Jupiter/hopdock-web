import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("supabase/templates/manifest.json", root), "utf8"),
);
const payload = {};
for (const template of manifest) {
  payload["mailer_subjects_" + template.name] = template.subject;
  payload["mailer_templates_" + template.name + "_content"] = await readFile(
    new URL(template.content_path, root),
    "utf8",
  );
}
if (process.argv.includes("--dry-run")) {
  console.log(
    "Ready: " +
      manifest.length +
      " templates, " +
      Object.keys(payload).length +
      " configuration fields. No cloud changes.",
  );
  process.exit(0);
}
const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token)
  throw new Error(
    "Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN locally. Never commit the token.",
  );
if (!/^[a-z0-9]+$/.test(ref)) throw new Error("Invalid project ref.");
const response = await fetch(
  "https://api.supabase.com/v1/projects/" + ref + "/config/auth",
  {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  },
);
if (!response.ok)
  throw new Error(
    "Supabase template update failed (HTTP " +
      response.status +
      "). Response content is not logged.",
  );
const verify = await fetch(
  "https://api.supabase.com/v1/projects/" + ref + "/config/auth",
  { headers: { Authorization: "Bearer " + token } },
);
if (!verify.ok)
  throw new Error(
    "Templates sent, but verification failed (HTTP " + verify.status + ").",
  );
const actual = await verify.json();
if (!Object.entries(payload).every(([key, value]) => actual[key] === value))
  throw new Error("Template verification mismatch. Check the dashboard.");
console.log(
  "Verified " +
    manifest.length +
    " templates on project " +
    ref +
    ". SMTP and existing auth settings were preserved.",
);
