# openclaw-pwm

**[OpenClaw](https://openclaw.ai) powered by PWM tokens** — run the OpenClaw
coding agent against Claude models, billed through the PWM token exchange
instead of a direct Anthropic key.

OpenClaw natively supports custom providers (`openclaw.json`, merge mode), so no
source patches are needed — this wrapper just injects the PWM provider config and
your PWM key, then delegates to the real `openclaw`. Same approach as
[`claude-pwm`](../claude-pwm).

## How it works

The PWM exchange exposes an Anthropic-compatible endpoint and accepts a PWM API
key in place of an Anthropic key. OpenClaw is pointed at it as a custom provider:

```
OpenClaw  ──anthropic-messages──▶  https://physicsworldmodel.org/api/v1/exchange/anthropic
           (api key = sk-pwm-...)   → meters usage, settles against your PWM balance
                                     → routes to a live Anthropic credential
```

## Install

```bash
# 1. Install OpenClaw itself
npm install -g openclaw

# 2. Install this launcher
./install.sh              # installs to /usr/local/bin (pass a dir to change)
```

On Windows, put `bin/openclaw-pwm.cmd` on your PATH (it copies the same config).

## Use

```bash
export PWM_API_KEY=sk-pwm-your_key_here     # from https://token.comparegpt.io
openclaw-pwm                                # any openclaw args are forwarded
```

On first run the launcher writes the PWM provider to
`~/.config/openclaw/openclaw.json` (merge mode — it augments, never replaces,
your own OpenClaw config). If that file already exists without a `pwm` provider,
the launcher tells you to add the block from `openclaw.pwm.json` yourself so your
config is not clobbered.

### Point at the dev/test exchange

```bash
export PWM_EXCHANGE_URL=https://test.physicsworldmodel.org/api/v1/exchange/anthropic
```

## Manual setup (no launcher)

If you'd rather configure OpenClaw directly, merge this into your `openclaw.json`
and set `PWM_API_KEY` — this is exactly what the launcher installs:

```json5
{
  models: {
    mode: "merge",
    providers: {
      pwm: {
        baseUrl: "https://physicsworldmodel.org/api/v1/exchange/anthropic",
        apiKey: "${PWM_API_KEY}",
        api: "anthropic-messages",
        models: [
          { id: "claude-opus-4-8",   name: "Claude Opus 4.8 (PWM)" },
          { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (PWM)" },
          { id: "claude-haiku-4-5",  name: "Claude Haiku 4.5 (PWM)" }
        ]
      }
    }
  },
  agents: { defaults: { model: { primary: "pwm/claude-opus-4-8" } } }
}
```

## Models

Any Claude model your PWM exchange has a live credential for. Defaults ship with
Opus 4.8, Sonnet 4.6, and Haiku 4.5; add more `id` entries as needed.

## Notes

- **User-Agent override (required today).** The PWM edge (Cloudflare) blocks
  the Anthropic SDK's default `User-Agent: Anthropic/JS …` with
  `403 Your request was blocked`. OpenClaw uses that SDK, so the config sets
  `headers: { "User-Agent": "openclaw-pwm/1.0" }` to get through. This is a
  client-side workaround — the proper fix is server-side: allowlist the
  `/api/v1/exchange/*` path in the Cloudflare WAF (or exempt `Anthropic/*`
  UAs) so the official SDKs work unmodified. Once that's done the header can be
  dropped.
- **Beta headers.** OpenClaw skips some provider-specific features on proxy
  routes. If you need Anthropic beta features (1M context, fast mode), set
  `models.providers.pwm.headers["anthropic-beta"]` in `openclaw.json`.
- **Billing.** Every request is metered and settled against your PWM balance; a
  402 means your balance is empty — top up at https://token.comparegpt.io.
- **Key format.** Both `sk-pwm-…` and legacy `pwm_…` keys are accepted.

## License

MIT
