// This entry can only launch with an explicitly isolated capture profile.
const { app } = require("electron");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
if (!process.env.HOPDOCK_CAPTURE_PROFILE || !process.env.HOPDOCK_SOURCE)
  throw new Error("Capture profile/source required");
app.setPath("userData", resolve(process.env.HOPDOCK_CAPTURE_PROFILE));
import(
  pathToFileURL(
    resolve(process.env.HOPDOCK_SOURCE, "apps/desktop/out/main/index.js"),
  ).href
);
