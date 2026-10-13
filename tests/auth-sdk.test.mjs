import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createClient } from "@supabase/supabase-js";
test("actual Supabase SDK: confirmation, failed login, recovery, password update, session and logout against isolated local auth", async () => {
  const fixture = spawn(process.execPath, ["scripts/auth-fixture.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: { ...process.env, HOPDOCK_FIXTURE_PORT: "54330" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    await Promise.race([
      once(fixture.stdout, "data"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Fixture did not start")),
          5000,
        ).unref(),
      ),
    ]);
    const client = createClient(
      "http://127.0.0.1:54330",
      "fixture-public-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: "implicit",
        },
      },
    );
    const signup = await client.auth.signUp({
      email: "sdk@example.invalid",
      password: "Fixture-password-2026!",
      options: {
        emailRedirectTo: "http://127.0.0.1:4174/?flow=confirmed&lang=en",
        data: { language: "en" },
      },
    });
    assert.equal(signup.error, null);
    assert.equal(signup.data.session, null);
    assert.equal(signup.data.user.user_metadata.language, "en");
    const bad = await client.auth.signInWithPassword({
      email: "sdk@example.invalid",
      password: "wrong",
    });
    assert.equal(bad.error.code, "invalid_credentials");
    assert.equal(
      (
        await client.auth.resend({
          type: "signup",
          email: "sdk@example.invalid",
        })
      ).error,
      null,
    );
    assert.equal(
      (
        await client.auth.resetPasswordForEmail("sdk@example.invalid", {
          redirectTo: "http://127.0.0.1:4174/?flow=recovery",
        })
      ).error,
      null,
    );
    const { recoveryToken } = await (
      await fetch("http://127.0.0.1:54330/test/status")
    ).json();
    assert.equal(
      (
        await client.auth.setSession({
          access_token: recoveryToken,
          refresh_token: "fixture-refresh-token",
        })
      ).error,
      null,
    );
    assert.equal(
      (await client.auth.updateUser({ password: "Fixture-new-password-2026!" }))
        .error,
      null,
    );
    assert.equal((await client.auth.signOut()).error, null);
    assert.equal((await client.auth.getSession()).data.session, null);
    const login = await client.auth.signInWithPassword({
      email: "sdk@example.invalid",
      password: "Fixture-new-password-2026!",
    });
    assert.equal(login.error, null);
    assert.equal(login.data.session.user.email, "sdk@example.invalid");
    await client.auth.signOut();
  } finally {
    fixture.kill();
    await once(fixture, "exit").catch(() => {});
  }
});
