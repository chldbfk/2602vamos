#!/usr/bin/env bash
# Pushes this vamos repo's current `master` into the vamos/ subfolder of the shared
# chldbfk/2602vamos repo's `main` branch. GitHub Actions then auto-builds and deploys
# to https://chldbfk.github.io/2602vamos/ — no further steps needed after this script.
#
# Usage: from anywhere, run:  bash scripts/publish-to-2602vamos.sh

set -euo pipefail

REPO_URL="https://github.com/chldbfk/2602vamos.git"
VAMOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$VAMOS_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "커밋되지 않은 변경사항이 있어요. 먼저 커밋해주세요:" >&2
  echo "  git add -A && git commit -m \"...\"" >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "▸ chldbfk/2602vamos 클론 중..."
git clone -q "$REPO_URL" "$WORK_DIR"
cd "$WORK_DIR"
git config user.name "$(git -C "$VAMOS_DIR" config user.name)"
git config user.email "$(git -C "$VAMOS_DIR" config user.email)"

VAMOS_SHA="$(git -C "$VAMOS_DIR" rev-parse --short HEAD)"

echo "▸ vamos/ 서브트리 갱신 중 (vamos@$VAMOS_SHA)..."
git subtree pull --prefix=vamos "$VAMOS_DIR" master --squash \
  -m "Update vamos/ to $VAMOS_SHA

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

echo "▸ main에 푸시 중..."
git push origin main

echo ""
echo "✓ 완료. GitHub Actions가 자동으로 빌드해서 배포할 거예요 (1~2분 정도)."
echo "  진행 상황: https://github.com/chldbfk/2602vamos/actions"
echo "  배포되는 곳: https://chldbfk.github.io/2602vamos/"
