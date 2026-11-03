#!/usr/bin/env bash
# Environment self-check for AI_STORIES. Run: npm run verify
set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
line() { printf '%-26s %s\n' "$1" "$2"; }
check() { # label, command...
  local label="$1"; shift
  if out=$("$@" 2>&1); then
    line "$label" "OK  ${out%%$'\n'*}"
  else
    line "$label" "FAIL ${out%%$'\n'*}"
    FAIL=1
  fi
}

echo "== hardware / OS =="
line "Chip" "$(sysctl -n machdep.cpu.brand_string)"
line "Architecture" "$(uname -m)"
line "macOS" "$(sw_vers -productVersion) ($(sw_vers -buildVersion))"
line "RAM" "$(echo "$(($(sysctl -n hw.memsize) / 1073741824))") GB"
line "CPU cores" "$(sysctl -n hw.ncpu)"
line "Free disk" "$(df -h . | awk 'NR==2 {print $4}')"

echo
echo "== toolchain =="
check "Node.js" node -v
check "npm" npm -v
check "FFmpeg" ffmpeg -version
check "ffprobe" ffprobe -version
check "TypeScript" npx --no-install tsc --version

echo
echo "== project =="
check "Remotion versions" npx remotion versions
check "Typecheck" npx tsc --noEmit
check "Compositions" npx remotion compositions src/remotion/index.ts
check "Headless browser" sh -c "ls node_modules/.remotion/chrome-headless-shell/*/*/chrome-headless-shell"

echo
echo "== optional: system Chrome for GPU diagnostics =="
if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  line "Google Chrome" "found — npx remotion gpu --browser-executable=\"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\""
else
  line "Google Chrome" "not found (remotion gpu needs it; renders do not)"
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "SOME CHECKS FAILED — see above"
fi
exit "$FAIL"
