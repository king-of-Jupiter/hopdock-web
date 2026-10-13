import { mkdir, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const definitions = [
  [
    "confirmation",
    "Подтвердите email",
    "Confirm your email",
    "Подтвердите адрес и завершите создание аккаунта Hopdock.",
    "Confirm your address to finish creating your Hopdock account.",
    "Подтвердить email",
    "Confirm email",
  ],
  [
    "recovery",
    "Восстановление пароля",
    "Reset your password",
    "Получен запрос на смену пароля аккаунта Hopdock. Пароль шифрования хранилища останется прежним.",
    "We received a request to reset your Hopdock account password. Your vault encryption password will stay the same.",
    "Выбрать новый пароль",
    "Choose a new password",
  ],
  [
    "invite",
    "Вас пригласили в Hopdock",
    "You are invited to Hopdock",
    "Примите приглашение и задайте пароль для вашего аккаунта Hopdock.",
    "Accept the invitation and set a password for your Hopdock account.",
    "Принять приглашение",
    "Accept invitation",
  ],
  [
    "magic_link",
    "Вход в Hopdock",
    "Sign in to Hopdock",
    "Используйте эту одноразовую ссылку, чтобы войти в аккаунт Hopdock.",
    "Use this one-time link to sign in to your Hopdock account.",
    "Войти в Hopdock",
    "Sign in to Hopdock",
  ],
  [
    "email_change",
    "Подтвердите смену email",
    "Confirm your email change",
    "Подтвердите изменение адреса аккаунта на {{ .NewEmail }}.",
    "Confirm the change of your account email to {{ .NewEmail }}.",
    "Подтвердить адрес",
    "Confirm address",
  ],
  [
    "reauthentication",
    "Код подтверждения",
    "Your verification code",
    "Используйте этот код для подтверждения действия в аккаунте Hopdock. Никому его не сообщайте.",
    "Use this code to confirm an action in your Hopdock account. Never share it with anyone.",
    "",
    "",
  ],
  [
    "password_changed_notification",
    "Пароль аккаунта изменён",
    "Account password changed",
    "Пароль аккаунта {{ .Email }} изменён. Если это сделали не вы, восстановите пароль. Пароль шифрования хранилища не изменяется.",
    "The password for {{ .Email }} was changed. If you did not make this change, reset your password. Your vault encryption password is not affected.",
    "Восстановить пароль",
    "Reset password",
  ],
  [
    "email_changed_notification",
    "Адрес аккаунта изменён",
    "Account email changed",
    "Email аккаунта изменён с {{ .OldEmail }} на {{ .Email }}. Если это сделали не вы, восстановите доступ и проверьте безопасность аккаунта.",
    "Your account email changed from {{ .OldEmail }} to {{ .Email }}. If you did not make this change, recover access and review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
  [
    "phone_changed_notification",
    "Телефон аккаунта изменён",
    "Account phone changed",
    "Номер телефона изменён с {{ .OldPhone }} на {{ .Phone }}. Если это сделали не вы, проверьте безопасность аккаунта.",
    "Your phone number changed from {{ .OldPhone }} to {{ .Phone }}. If you did not make this change, review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
  [
    "identity_linked_notification",
    "Добавлен способ входа",
    "Sign-in method added",
    "К аккаунту добавлен способ входа {{ .Provider }}. Если это сделали не вы, проверьте безопасность аккаунта.",
    "The {{ .Provider }} sign-in method was linked to your account. If you did not make this change, review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
  [
    "identity_unlinked_notification",
    "Удалён способ входа",
    "Sign-in method removed",
    "От аккаунта отсоединён способ входа {{ .Provider }}. Если это сделали не вы, проверьте безопасность аккаунта.",
    "The {{ .Provider }} sign-in method was removed from your account. If you did not make this change, review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
  [
    "mfa_factor_enrolled_notification",
    "Добавлен способ проверки",
    "Verification method added",
    "Добавлен способ проверки входа {{ .FactorType }}. Если это сделали не вы, проверьте безопасность аккаунта.",
    "The {{ .FactorType }} verification method was added. If you did not make this change, review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
  [
    "mfa_factor_unenrolled_notification",
    "Удалён способ проверки",
    "Verification method removed",
    "Удалён способ проверки входа {{ .FactorType }}. Если это сделали не вы, проверьте безопасность аккаунта.",
    "The {{ .FactorType }} verification method was removed. If you did not make this change, review your account security.",
    "Открыть Hopdock",
    "Open Hopdock",
  ],
];
function render(definition, language) {
  const [name, ruTitle, enTitle, ruText, enText, ruButton, enButton] =
    definition;
  const ru = language === "ru",
    title = ru ? ruTitle : enTitle,
    text = ru ? ruText : enText,
    button = ru ? ruButton : enButton;
  const notification = name.endsWith("_notification");
  const action = notification
    ? name === "password_changed_notification"
      ? "{{ .SiteURL }}?mode=recover"
      : "{{ .SiteURL }}"
    : "{{ .ConfirmationURL }}";
  const caution = notification
    ? ru
      ? "Это уведомление о безопасности вашего аккаунта."
      : "This is a security notification for your account."
    : ru
      ? "Если вы не запрашивали это письмо, просто проигнорируйте его. Никому не пересылайте ссылку или код."
      : "If you did not request this email, you can ignore it. Never forward this link or code.";
  return `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${title} · Hopdock</title></head>
<body style="margin:0;padding:0;background:#efede5;color:#29261f;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${title} — Hopdock</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#efede5"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background:#faf9f5;border:1px solid #e3dfd5;border-radius:12px">
<tr><td style="padding:28px 36px;background:#262624;border-radius:12px 12px 0 0">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="38" style="vertical-align:middle"><img src="{{ .SiteURL }}/assets/hopdock-icon.png" width="34" height="34" alt="" style="display:block;border:0"></td><td style="padding-left:11px;color:#ece9e0;font-family:Georgia,serif;font-size:30px;line-height:38px">hopdock</td></tr></table>
</td></tr>
<tr><td style="padding:36px">
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;line-height:1.25;font-weight:normal">${title}</h1>
<p style="margin:0 0 28px;color:#706c62;font-size:16px;line-height:1.65">${text}</p>
${name === "reauthentication" ? '<p style="margin:0 0 28px;padding:20px;background:#efede5;border-radius:8px;font-family:monospace;font-size:34px;letter-spacing:8px;text-align:center;color:#596345">{{ .Token }}</p>' : `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#596345" style="border-radius:8px"><a href="${action}" style="display:inline-block;padding:16px 24px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border:1px solid #596345;border-radius:8px">${button}</a></td></tr></table>`}
<p style="margin:28px 0 0;color:#706c62;font-size:14px;line-height:1.65">${caution}</p>
${!notification && name !== "reauthentication" ? `<p style="margin:24px 0 8px;color:#706c62;font-size:13px;line-height:1.5">${ru ? "Кнопка не работает? Скопируйте ссылку в браузер:" : "Button not working? Copy this link into your browser:"}</p><a href="{{ .ConfirmationURL }}" style="color:#596345;font-size:12px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere">{{ .ConfirmationURL }}</a>` : ""}
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #e3dfd5;color:#706c62;font-size:12px;line-height:1.65"><a href="{{ .SiteURL }}" style="color:#596345;text-decoration:none">Hopdock</a> · ${ru ? "Ваши серверы. Ваш порядок." : "Your servers. Your workspace."}<br>${ru ? "Письмо отправлено автоматически. Отвечать на него не нужно." : "This is an automated email. No reply is needed."}</td></tr>
</table></td></tr></table></body></html>`;
}
const manifest = [];
for (const definition of definitions) {
  const name = definition[0];
  const localized = {};
  for (const language of ["ru", "en"]) {
    const dir = new URL("supabase/templates/" + language + "/", root);
    await mkdir(dir, { recursive: true });
    const html = render(definition, language);
    localized[language] = html;
    await writeFile(new URL(name + ".html", dir), html);
    const previewDir = new URL("public/email-previews/" + language + "/", root);
    await mkdir(previewDir, { recursive: true });
    await writeFile(
      new URL(name + ".html", previewDir),
      html
        .replaceAll("{{ .SiteURL }}/assets", "../../assets")
        .replaceAll("{{ .SiteURL }}", "../../../")
        .replaceAll("{{ .ConfirmationURL }}", "#preview-only")
        .replaceAll("{{ .Email }}", "you@example.com")
        .replaceAll("{{ .NewEmail }}", "new@example.com")
        .replaceAll("{{ .OldEmail }}", "old@example.com")
        .replaceAll("{{ .Token }}", "123456")
        .replaceAll("{{ .OldPhone }}", "+1 ••• ••• 0100")
        .replaceAll("{{ .Phone }}", "+1 ••• ••• 0200")
        .replaceAll("{{ .Provider }}", "GitHub")
        .replaceAll("{{ .FactorType }}", "TOTP"),
    );
  }
  const conditional =
    '{{ if eq .Data.language "ru" }}\n' +
    localized.ru +
    "\n{{ else }}\n" +
    localized.en +
    "\n{{ end }}";
  await writeFile(
    new URL("supabase/templates/" + name + ".html", root),
    conditional,
  );
  const subject =
    '{{ if eq .Data.language "ru" }}' +
    definition[1] +
    "{{ else }}" +
    definition[2] +
    "{{ end }} · Hopdock";
  manifest.push({
    name,
    subject,
    content_path: "supabase/templates/" + name + ".html",
    notification: name.endsWith("_notification"),
  });
}
await writeFile(
  new URL("supabase/templates/manifest.json", root),
  JSON.stringify(manifest, null, 2) + "\n",
);
const previewIndex =
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hopdock email previews</title><body style="font:18px Arial;background:#faf9f5;color:#29261f;margin:40px;line-height:1.8"><h1>Hopdock email previews</h1><p>Preview samples only. Links do not perform authentication.</p>' +
  manifest
    .map(
      (item) =>
        "<div>" +
        item.name +
        ' — <a href="ru/' +
        item.name +
        '.html">RU</a> · <a href="en/' +
        item.name +
        '.html">EN</a></div>',
    )
    .join("") +
  "</body></html>";
await writeFile(
  new URL("public/email-previews/index.html", root),
  previewIndex,
);
console.log(
  "Generated " +
    manifest.length +
    " Supabase templates in RU/EN and preview samples.",
);
