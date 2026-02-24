#!/usr/bin/env bash
set -euo pipefail

CLI_DIR="${PWD}"
CLI_PATH="${CLI_DIR}/dist/index.js"
TMP_HOME="$(mktemp -d)"
TMP_LOG_DIR="$(mktemp -d)"

PASSED=0
FAILED=0

cleanup() {
  rm -rf "${TMP_HOME}" "${TMP_LOG_DIR}"
}
trap cleanup EXIT

pass() {
  echo "PASS: $1"
  PASSED=$((PASSED + 1))
}

fail() {
  echo "FAIL: $1"
  FAILED=$((FAILED + 1))
}

assert_contains() {
  local text="$1"
  local needle="$2"
  local label="$3"
  if echo "${text}" | grep -q "${needle}"; then
    pass "${label}"
  else
    fail "${label}"
    echo "  expected to find: ${needle}"
  fi
}

run_cli() {
  local render_serve_bin="${CLI_DIR}/../render/dist/serve-cli.js"
  if [[ -f "${render_serve_bin}" ]]; then
    HOME="${TMP_HOME}" AGENTSTAGE_RENDER_SERVE_BIN="${render_serve_bin}" node "${CLI_PATH}" "$@"
    return
  fi
  HOME="${TMP_HOME}" node "${CLI_PATH}" "$@"
}

echo "E2E: agentstage CLI"
echo "CLI: ${CLI_PATH}"
echo "HOME: ${TMP_HOME}"

if [[ ! -f "${CLI_PATH}" ]]; then
  echo "CLI not built. Run: pnpm -C packages/cli build"
  exit 1
fi

PKG_VERSION="$(node -p "require('${CLI_DIR}/package.json').version")"
CLI_VERSION="$(run_cli --version 2>/dev/null || true)"
if [[ "${CLI_VERSION}" == "${PKG_VERSION}" ]]; then
  pass "version matches package.json"
else
  fail "version matches package.json"
fi

HELP_OUTPUT="$(run_cli --help 2>&1 || true)"
assert_contains "${HELP_OUTPUT}" "serve" "help contains serve command"
assert_contains "${HELP_OUTPUT}" "init" "help contains init command"

if command -v bun >/dev/null 2>&1; then
  echo "Bun detected. Running full E2E flow."
  TEST_PORT=$((30000 + RANDOM % 20000))

  run_cli init -y --skip-cloudflared-check >/dev/null
  WS_DIR="${TMP_HOME}/.agentstage/webapp"

  if [[ -f "${WS_DIR}/package.json" && -d "${WS_DIR}/pages" ]]; then
    pass "init creates minimal workspace"
  else
    fail "init creates minimal workspace"
  fi

  run_cli page add counter >/dev/null
  if [[ -f "${WS_DIR}/pages/counter/ui.json" && -f "${WS_DIR}/pages/counter/store.json" ]]; then
    pass "page add creates pages/counter/{ui,store}.json"
  else
    fail "page add creates pages/counter/{ui,store}.json"
  fi

  run_cli serve counter --port "${TEST_PORT}" >"${TMP_LOG_DIR}/serve.log" 2>&1 || true
  STATUS_OUTPUT="$(run_cli status 2>&1 || true)"
  assert_contains "${STATUS_OUTPUT}" "running" "status shows runtime running after serve"
  assert_contains "${STATUS_OUTPUT}" "${TEST_PORT}" "status shows configured port"

  run_cli run set-state counter '{"count":1}' >/dev/null
  STATE_FILE_CONTENT="$(cat "${WS_DIR}/pages/counter/store.json" 2>/dev/null || true)"
  assert_contains "${STATE_FILE_CONTENT}" "\"count\": 1" "run set-state writes file state"

  run_cli stop >/dev/null
  STATUS_AFTER_STOP="$(run_cli status 2>&1 || true)"
  assert_contains "${STATUS_AFTER_STOP}" "stopped" "status shows stopped after stop"
else
  echo "Bun not detected. Running Bun-missing branch checks."

  INIT_OUTPUT="$(run_cli init -y --skip-cloudflared-check 2>&1 || true)"
  assert_contains "${INIT_OUTPUT}" "Bun is required" "init fails with bun required message"

  WS_DIR="$(mktemp -d)"
  mkdir -p "${WS_DIR}/pages/counter" "${TMP_HOME}/.config/agentstage"
  printf '{"name":"ws"}\n' > "${WS_DIR}/package.json"
  printf '{"root":"main","elements":{"main":{"type":"Text","props":{"text":"hi"}}}}\n' > "${WS_DIR}/pages/counter/ui.json"
  printf '%s' "${WS_DIR}" > "${TMP_HOME}/.config/agentstage/workspace"

  SERVE_OUTPUT="$(run_cli serve counter 2>&1 || true)"
  assert_contains "${SERVE_OUTPUT}" "Bun is required" "serve fails with bun required message"
  rm -rf "${WS_DIR}"
fi

echo
echo "Summary:"
echo "  passed: ${PASSED}"
echo "  failed: ${FAILED}"

if [[ ${FAILED} -gt 0 ]]; then
  exit 1
fi
