#!/usr/bin/env node
// openclaw-pwm — launch OpenClaw routed through the PWM token exchange.
//
// OpenClaw natively supports custom providers via ~/.openclaw/openclaw.json
// (merge mode), so no source patches are needed — this launcher injects the PWM
// provider config and your PWM key, then delegates to the real `openclaw`.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const EXCHANGE_URL =
  process.env.PWM_EXCHANGE_URL ||
  "https://physicsworldmodel.org/api/v1/exchange/anthropic";
const CONFIG_FILE =
  process.env.OPENCLAW_CONFIG_PATH ||
  path.join(os.homedir(), ".openclaw", "openclaw.json");

function fail(msg) {
  process.stderr.write("openclaw-pwm: " + msg + "\n");
  process.exit(1);
}

// 1. Require a PWM key.
if (!process.env.PWM_API_KEY) {
  process.stderr.write(
    "openclaw-pwm: PWM_API_KEY is not set.\n\n" +
      "Get a key at https://token.comparegpt.io then:\n" +
      "  export PWM_API_KEY=sk-pwm-your_key_here   (Windows: set PWM_API_KEY=...)\n" +
      "  openclaw-pwm\n"
  );
  process.exit(1);
}

// 2. Require the openclaw CLI on PATH.
const isWin = process.platform === "win32";
const probe = spawnSync("openclaw", ["--version"], {
  stdio: "ignore",
  shell: isWin,
});
if (probe.error && probe.error.code === "ENOENT") {
  fail(
    "the 'openclaw' CLI was not found on PATH. Install it first: npm install -g openclaw"
  );
}

// 3. Install the PWM provider config on first run (merge mode → safe alongside a
//    user's own openclaw.json). Never overwrite an existing config.
const CONFIG_DIR = path.dirname(CONFIG_FILE);
const CONFIG_BODY = `{
  // PWM provider for OpenClaw — routes Claude models through the PWM token exchange.
  // "merge" mode augments (does not replace) your existing OpenClaw config.
  models: {
    mode: "merge",
    providers: {
      pwm: {
        baseUrl: ${JSON.stringify(EXCHANGE_URL)},
        apiKey: "\${PWM_API_KEY}",
        api: "anthropic-messages",
        // The PWM edge WAF blocks the Anthropic SDK's default "Anthropic/JS"
        // User-Agent. Override it so requests are not 403'd.
        headers: { "User-Agent": "openclaw-pwm/1.0" },
        models: [
          { id: "claude-opus-4-8",   name: "Claude Opus 4.8 (PWM)",   contextWindow: 1000000, maxTokens: 128000 },
          { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (PWM)", contextWindow: 1000000, maxTokens: 128000 },
          { id: "claude-haiku-4-5",  name: "Claude Haiku 4.5 (PWM)",  contextWindow: 200000,  maxTokens: 64000 }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "pwm/claude-opus-4-8" }
    }
  }
}
`;

if (fs.existsSync(CONFIG_FILE)) {
  const existing = fs.readFileSync(CONFIG_FILE, "utf8");
  if (!/["']?pwm["']?\s*:/.test(existing)) {
    fail(
      CONFIG_FILE +
        " already exists but has no 'pwm' provider.\n" +
        "Add the provider block from the bundled openclaw.pwm.json so your config\n" +
        "is not clobbered, then re-run openclaw-pwm."
    );
  }
} else {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, CONFIG_BODY, { mode: 0o600 });
  process.stderr.write(
    "openclaw-pwm: wrote PWM provider config to " + CONFIG_FILE + "\n"
  );
}

if (EXCHANGE_URL !== "https://physicsworldmodel.org/api/v1/exchange/anthropic") {
  process.stderr.write(
    "openclaw-pwm: using exchange " +
      EXCHANGE_URL +
      " (edit " +
      CONFIG_FILE +
      " to persist)\n"
  );
}

// 4. Delegate to the real openclaw, forwarding all args.
const run = spawnSync("openclaw", process.argv.slice(2), {
  stdio: "inherit",
  shell: isWin,
});
process.exit(run.status === null ? 1 : run.status);
