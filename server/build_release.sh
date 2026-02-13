#!/usr/bin/env bash
# 生成适用于 Linux 的发布包：编译二进制、拷贝静态资源并打包为 tar.gz
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

OUT_DIR="$ROOT_DIR/release"
BIN_NAME="taizhang-server"

# 版本信息（优先使用 git tag/commit）
if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  VERSION=$(git describe --tags --always --dirty 2>/dev/null || date +%Y%m%d%H%M%S)
else
  VERSION=$(date +%Y%m%d%H%M%S)
fi

echo "Building release: version=$VERSION"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/bin"
mkdir -p "$OUT_DIR/config"
mkdir -p "$OUT_DIR/web"

# 编译 Linux 静态二进制
echo "Compiling Go binary for linux/amd64..."
env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w -X main.BuildVersion=$VERSION" -o "$OUT_DIR/bin/$BIN_NAME" ./cmd

echo "Copying config files..."
if [ -d config ]; then
  cp -r config/* "$OUT_DIR/config/" || true
fi

echo "Copying web static files..."
if [ -d ../server/web ]; then
  # when script run from server/, web is under ./web
  cp -r web/* "$OUT_DIR/web/"
else
  cp -r web/* "$OUT_DIR/web/" || true
fi

echo "Creating tarball..."
tar -czf "$ROOT_DIR/${BIN_NAME}-${VERSION}-linux-amd64.tar.gz" -C "$OUT_DIR" .

echo "Release created: ${BIN_NAME}-${VERSION}-linux-amd64.tar.gz"
echo "Contents:"
tar -tf "${BIN_NAME}-${VERSION}-linux-amd64.tar.gz" | sed -n '1,200p'

echo "Done."
