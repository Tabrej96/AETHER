#!/usr/bin/env bash
# ==============================================================================
# AETHER v1.0 — Universal One-Command & Selective Installer
# Created by Tabrej (https://github.com/Tabrej96/AETHER)
# License: Apache-2.0
#
# Usage (Install All 711 Components + 8-Tool MCP Server):
#   ./install.sh --all
#   ./install.sh --all --target claude-code --write ./my-project
#
# Usage (Selective Pack or Harness Install):
#   ./install.sh --target cursor --packs aws-cloud-vps,design-ui,video-ffmpeg --mcp
#   ./install.sh --target codex --packs core-polyglot --mcp
# ==============================================================================

set -euo pipefail

MODE="SELECTIVE"
TARGET="all-harnesses"
PACKS="core-polyglot,design-ui,video-ffmpeg,aws-cloud-vps,mcp-tools"
WRITE_DIR=""
ENABLE_MCP="--mcp"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      MODE="ALL"
      shift
      ;;
    --target)
      TARGET="${2:-all-harnesses}"
      shift 2
      ;;
    --packs)
      PACKS="${2:-core-polyglot,design-ui,video-ffmpeg,aws-cloud-vps,mcp-tools}"
      shift 2
      ;;
    --write)
      WRITE_DIR="${2:-.}"
      shift 2
      ;;
    --mcp)
      ENABLE_MCP="--mcp"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo "================================================================================"
echo " AETHER v1.0 — The 100x Sovereign AI Engineering Harness (Created by Tabrej)"
echo " Mode: ${MODE} | Target: ${TARGET} | Packs: ${PACKS}"
echo "================================================================================"

if [[ "${MODE}" == "ALL" ]]; then
  if [[ -n "${WRITE_DIR}" ]]; then
    npx --yes tsx bin/aether.ts install --all --target "${TARGET}" --mcp --write "${WRITE_DIR}"
  else
    npx --yes tsx bin/aether.ts install --all --target "${TARGET}" --mcp
  fi
else
  if [[ -n "${WRITE_DIR}" ]]; then
    npx --yes tsx bin/aether.ts install --target "${TARGET}" --packs "${PACKS}" ${ENABLE_MCP} --write "${WRITE_DIR}"
  else
    npx --yes tsx bin/aether.ts install --target "${TARGET}" --packs "${PACKS}" ${ENABLE_MCP}
  fi
fi

echo "--------------------------------------------------------------------------------"
echo " AETHER v1.0 Installation Complete. All SPDX Open-Source Credits Verified."
echo "--------------------------------------------------------------------------------"
