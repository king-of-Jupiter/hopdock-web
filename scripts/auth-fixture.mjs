// Isolated fixture for UI testing. Never forwards requests to Supabase.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const counts = {};
const users = new Map();
const token =
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ) +
  "." +
  Buffer.from(
    JSON.stringify({
      sub: "fixture-user",
      aud: "authenticated",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url") +
  ".fixture";
let currentUser = {
  id: "fixture-user",
  aud: "authenticated",
  role: "authenticated",
  email: "qa@example.invalid",
  app_metadata: { provider: "email" },
  user_metadata: { language: "en" },
  created_at: new Date().toISOString(),
};
const session = () => ({
  access_token: token,
  refresh_token: "fixture-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  user: currentUser,
});
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = new URL(req.url, "http://127.0.0.1");
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {}
  const send = (status, value) => {
    if (value?.code) value.error_code = value.code;
    res.writeHead(status);
    res.end(JSON.stringify(value));
  };
  const endpoint = url.pathname.replace("/auth/v1/", "");
  counts[endpoint] = (counts[endpoint] || 0) + 1;
  if (url.pathname === "/test/status") {
    send(200, { counts, recoveryToken: token });
    return;
  }
  if (endpoint === "signup") {
    if (body.email?.startsWith("mail-fail")) {
      send(500, { code: "unexpected_failure", msg: "mail fixture failure" });
      return;
    }
    currentUser = {
      ...currentUser,
      id: randomUUID(),
      email: body.email,
      user_metadata: body.data || {},
      identities: [{ id: "fixture-identity" }],
    };
    users.set(body.email, body.password);
    send(200, currentUser);
    return;
  }
  if (endpoint === "token") {
    if (url.searchParams.get("grant_type") === "refresh_token") {
      send(200, session());
      return;
    }
    if (users.get(body.email) !== body.password) {
      send(400, {
        code: "invalid_credentials",
        msg: "Invalid login credentials",
      });
      return;
    }
    currentUser = { ...currentUser, email: body.email };
    send(200, session());
    return;
  }
  if (endpoint === "user") {
    if (req.method === "PUT") {
      if (body.password) users.set(currentUser.email, body.password);
      send(200, currentUser);
      return;
    }
    send(200, currentUser);
    return;
  }
  if (["recover", "resend", "logout"].includes(endpoint)) {
    send(200, {});
    return;
  }
  send(404, { code: "fixture_not_found" });
});
const port = Number(process.env.HOPDOCK_FIXTURE_PORT || 54329);
server.listen(port, "127.0.0.1", () =>
  console.log("Local auth fixture on http://127.0.0.1:" + port),
);
process.on("SIGTERM", () => server.close());
