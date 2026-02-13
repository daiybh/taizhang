#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 <local-tarball> <remote-host> [remote-user] [remote-dir] [service-name]

Example:
  ./upload_and_deploy.sh release/taizhang-server-20260213-linux-amd64.tar.gz 1.2.3.4 deployer /opt/taizhang taizhang

Environment variables supported:
  SSH_PORT - SSH port (default 22)
  IDENTITY - path to ssh private key file (optional)
EOF
  exit 1
}

if [ "$#" -lt 2 ]; then
  usage
fi

LOCAL_TAR=$1
REMOTE_HOST=$2
REMOTE_USER=${3:-root}
REMOTE_DIR=${4:-/opt/taizhang}
SERVICE_NAME=${5:-taizhang}
SSH_PORT=${SSH_PORT:-22}
IDENTITY=${IDENTITY:-}

if [ ! -f "$LOCAL_TAR" ]; then
  echo "Local tarball not found: $LOCAL_TAR"
  exit 2
fi

SSH_OPTS=( -p "$SSH_PORT" )
if [ -n "$IDENTITY" ]; then
  SSH_OPTS+=( -i "$IDENTITY" )
fi

REMOTE_TMP="/tmp/$(basename "$LOCAL_TAR")-$$"
RELEASE_TMP_DIR="/tmp/taizhang_release_$$"

echo "Uploading $LOCAL_TAR to $REMOTE_USER@$REMOTE_HOST:$REMOTE_TMP..."
scp -P "$SSH_PORT" ${IDENTITY:+-i "$IDENTITY"} "$LOCAL_TAR" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_TMP"

echo "Deploying on remote host $REMOTE_HOST..."
ssh -p "$SSH_PORT" ${IDENTITY:+-i "$IDENTITY"} "$REMOTE_USER@$REMOTE_HOST" bash -s <<'REMOTE_EOF'
set -euo pipefail
REMOTE_TMP="'$REMOTE_TMP'"
RELEASE_TMP_DIR="'$RELEASE_TMP_DIR'"
REMOTE_DIR="'$REMOTE_DIR'"
SERVICE_NAME="'$SERVICE_NAME'"

echo "Creating temp dir $RELEASE_TMP_DIR"
sudo rm -rf "$RELEASE_TMP_DIR" || true
sudo mkdir -p "$RELEASE_TMP_DIR"

echo "Extracting $REMOTE_TMP to $RELEASE_TMP_DIR"
sudo tar -xzf "$REMOTE_TMP" -C "$RELEASE_TMP_DIR"

echo "Backing up current deployment (if exists)"
if [ -d "$REMOTE_DIR" ]; then
  BACKUP_DIR="${REMOTE_DIR}_backup_$(date +%Y%m%d%H%M%S)"
  sudo mv "$REMOTE_DIR" "$BACKUP_DIR" || true
  echo "Moved existing $REMOTE_DIR to $BACKUP_DIR"
fi

echo "Moving new release into place: $REMOTE_DIR"
sudo mkdir -p "$REMOTE_DIR"
sudo cp -r "$RELEASE_TMP_DIR"/* "$REMOTE_DIR/"
sudo chmod -R 755 "$REMOTE_DIR/bin" || true
sudo chown -R root:root "$REMOTE_DIR"

echo "Cleaning up temporary files"
sudo rm -f "$REMOTE_TMP" || true
sudo rm -rf "$RELEASE_TMP_DIR" || true

echo "Restarting service $SERVICE_NAME"
sudo systemctl daemon-reload || true
sudo systemctl restart "$SERVICE_NAME" || { echo "Failed to restart $SERVICE_NAME"; exit 3; }
sudo systemctl status "$SERVICE_NAME" --no-pager
REMOTE_EOF

echo "Deployment finished. Check service logs on remote host if needed:"
echo "  ssh -p $SSH_PORT ${REMOTE_USER}@${REMOTE_HOST} 'sudo journalctl -u $SERVICE_NAME -f'"
