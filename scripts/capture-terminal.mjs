// A real Electron capture, with a real SSH connection to an explicitly local fixture.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { generateKeyPairSync, createHash } from "node:crypto";
import assert from "node:assert/strict";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.env.HOPDOCK_SOURCE || join(site, "../hopdock"));
const require = createRequire(join(source, "package.json"));
const { _electron: electron } = require("playwright");
const ssh2 = require("ssh2");
const profile = mkdtempSync(join(tmpdir(), "hopdock-web-capture-"));
mkdirSync(join(profile, "hopdock"), { recursive: true });
const hostKey = generateKeyPairSync("rsa", {
  modulusLength: 2048,
}).privateKey.export({ type: "pkcs1", format: "pem" });
const connections = new Set();
const metrics = { authenticated: 0, commands: [], resizes: [] };
const prompt =
  "\x1b[38;2;145;177;125mubuntu@web-02\x1b[0m:\x1b[38;2;145;177;125m~\x1b[0m$ ";
const outputs = {
  "uname -a": "Linux web-02 6.8.0-60-generic #63-Ubuntu SMP x86_64 GNU/Linux",
  "df -h":
    "Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/sda1        100G   24G   71G  26% /\r\ntmpfs           1.9G  1.1M  1.9G   1% /dev/shm\r\n/dev/sda2        200G  118G   79G  60% /data",
  uptime:
    " 12:42:08 up 21 days,  4:16,  2 users,  load average: 0.08, 0.12, 0.09",
  "docker ps":
    "CONTAINER ID   IMAGE          STATUS         PORTS\r\n7d2a05b4f831   nginx:alpine   Up 21 days     80/tcp\r\n2c19f6a89203   postgres:16    Up 21 days     5432/tcp",
};
const server = new ssh2.Server({ hostKeys: [hostKey] }, (client) => {
  connections.add(client);
  client.on("error", () => {});
  client.on("close", () => connections.delete(client));
  client.on("authentication", (ctx) => {
    if (
      ctx.method === "password" &&
      ctx.username === "ubuntu" &&
      ctx.password === "capture-fixture-only"
    ) {
      metrics.authenticated++;
      ctx.accept();
    } else ctx.reject(["password"]);
  });
  client.on("session", (accept) => {
    const session = accept();
    session.on("pty", (acceptPty) => acceptPty());
    session.on("window-change", (acceptChange, _reject, info) => {
      metrics.resizes.push(info);
      acceptChange?.();
    });
    session.on("exec", (acceptExec, _reject, info) => {
      const stream = acceptExec();
      if (info.command === "uname -s") stream.write("Linux\n");
      else if (info.command === "cat /etc/os-release")
        stream.write(
          'ID=ubuntu\nPRETTY_NAME="Ubuntu 24.04 LTS"\nVERSION_ID="24.04"\n',
        );
      stream.exit(0);
      stream.end();
    });
    session.on("shell", (acceptShell) => {
      const stream = acceptShell();
      let input = "";
      stream.write("\x1b[2J\x1b[H" + prompt);
      stream.on("data", (data) => {
        for (const char of data.toString()) {
          if (char === "\r" || char === "\n") {
            if (!input) continue;
            const command = input;
            input = "";
            metrics.commands.push(command);
            stream.write(
              "\r\n" +
                (outputs[command] || "Fixture: command unavailable") +
                "\r\n\r\n" +
                prompt,
            );
          } else {
            input += char;
            stream.write(char);
          }
        }
      });
    });
  });
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const port = server.address().port;
const now = new Date().toISOString();
writeFileSync(
  join(profile, "hopdock/hopdock-vault.json"),
  JSON.stringify({
    hosts: [],
    groups: [
      {
        id: "capture-production",
        vaultId: "v-personal",
        name: "Production",
        sort: 0,
        updatedAt: now,
      },
    ],
    keys: [],
    snippets: [
      {
        id: "capture-info",
        vaultId: "v-personal",
        folder: "Diagnostics",
        name: "System overview",
        script: "uname -a",
        vars: [],
        updatedAt: now,
      },
      {
        id: "capture-disk",
        vaultId: "v-personal",
        folder: "Diagnostics",
        name: "Disk usage",
        script: "df -h",
        vars: [],
        updatedAt: now,
      },
      {
        id: "capture-containers",
        vaultId: "v-personal",
        folder: "Docker",
        name: "Running containers",
        script: "docker ps",
        vars: [],
        updatedAt: now,
      },
    ],
    lastSyncAt: new Date(0).toISOString(),
  }),
);
let app;
try {
  app = await electron.launch({
    args: [join(site, "scripts/capture-entry.cjs")],
    executablePath: require("electron"),
    env: {
      ...process.env,
      HOPDOCK_SOURCE: source,
      HOPDOCK_CAPTURE_PROFILE: profile,
      ELECTRON_RENDERER_URL: "",
    },
    timeout: 30000,
  });
  const page = await app.firstWindow();
  page.setDefaultTimeout(12000);
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setContentSize(1440, 580),
  );
  await page.waitForLoadState();
  await page.evaluate(() => {
    localStorage.setItem("hopdock.theme", "dark");
    localStorage.setItem("hopdock.welcomeDismissed", "true");
  });
  const hostId = await page.evaluate(
    async (port) =>
      (
        await window.hopdock.vault.saveHost({
          name: "web-02",
          host: "127.0.0.1",
          port,
          username: "ubuntu",
          auth: { type: "password" },
          password: "capture-fixture-only",
          groupId: "capture-production",
          tags: [],
        })
      ).id,
    port,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Connect to web-02", exact: true })
    .click();
  await page.locator("[data-testid=terminal][data-status=live]").waitFor();
  await page.waitForFunction(() =>
    document.querySelector('.hd-session-pill [data-os="ubuntu"]'),
  );
  for (const command of ["uname -a", "df -h", "uptime"]) {
    await page
      .locator(".xterm-helper-textarea")
      .pressSequentially(command, { delay: 12 });
    await page.locator(".xterm-helper-textarea").press("Enter");
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(900);
  assert.deepEqual(metrics.commands, ["uname -a", "df -h", "uptime"]);
  assert.ok(metrics.authenticated >= 1);
  assert.equal(
    await page
      .getByRole("complementary", { name: "Terminal snippets" })
      .count(),
    1,
  );
  const png = await app.evaluate(async ({ BrowserWindow }) =>
    (await BrowserWindow.getAllWindows()[0].webContents.capturePage())
      .toPNG()
      .toString("base64"),
  );
  const output = join(site, "public/assets/terminal-preview.png");
  writeFileSync(output, Buffer.from(png, "base64"));
  const version = await page.evaluate(() => window.hopdock.version);
  const sha256 = createHash("sha256")
    .update(readFileSync(output))
    .digest("hex");
  writeFileSync(
    join(site, "docs/terminal-capture.json"),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        captureMethod: "Electron BrowserWindow.webContents.capturePage()",
        version,
        viewport: { width: 1440, height: 580 },
        sha256,
        profile: "Temporary isolated profile; no normal user data accessed",
        ssh: "Real localhost SSH2 transport and PTY; deterministic fixture command output, not an Ubuntu host",
        metrics,
        limitations: [
          "Fixture uname/df/uptime values are deterministic sample data.",
          "Cloud sync is not connected and not represented as enabled.",
          "No generative image processing or screenshot UI edits.",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ output, version, sha256, commands: metrics.commands }),
  );
} finally {
  if (app) {
    await app
      .evaluate(({ BrowserWindow }) => {
        for (const win of BrowserWindow.getAllWindows()) win.close();
      })
      .catch(() => {});
    await app.close().catch(() => {});
  }
  for (const client of connections) client.end();
  await new Promise((done) => server.close(done));
}
