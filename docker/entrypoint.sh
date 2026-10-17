#!/bin/sh
set -e

# Volumes from older deployments may be owned by root. When the container starts
# as root, give the app's writable directories to the `node` user, then drop
# privileges. With `--user`, this step is skipped. `chown -h` changes symlinks
# themselves and never follows them out of the volume.
if [ "$(id -u)" = "0" ]; then
  for dir in /app/data /app/media /app/public; do
    mkdir -p "$dir"
    find "$dir" ! -user node -exec chown -h node:node {} + 2>/dev/null || true
  done
  exec setpriv --reuid=node --regid=node --init-groups -- "$@"
fi

exec "$@"
