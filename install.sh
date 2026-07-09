#!/usr/bin/env bash
# Install the openclaw-pwm launcher into a bin directory on PATH.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/bin/openclaw-pwm"
DEST_DIR="${1:-/usr/local/bin}"

echo "Installing openclaw-pwm to $DEST_DIR ..."
install -m 0755 "$SRC" "$DEST_DIR/openclaw-pwm"

echo ""
echo "Done. Prerequisites:"
echo "  1. Install OpenClaw:  npm install -g openclaw"
echo "  2. Set your PWM key:  export PWM_API_KEY=sk-pwm-your_key_here"
echo "  3. Run:               openclaw-pwm"
echo ""
echo "Get a PWM key at https://token.comparegpt.io"
