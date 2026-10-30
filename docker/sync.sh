#!/bin/sh
set -e

# `help-center-sync`: run a Notion sync inside the container, e.g.
#   docker exec <container> help-center-sync
#
# `docker exec` (and Coolify's terminal) start as root. Files a root sync
# creates in /app/data and /app/media would be unwritable for the server, which
# runs as `node`, so drop to that user first, like the entrypoint does.
#
# This is a separate process: it does not share the server's sync lock. Do not
# start it while "Sync now" in /admin or a scheduled sync is running.
cd /app
if [ "$(id -u)" = "0" ]; then
  exec setpriv --reuid=node --regid=node --init-groups -- node --disable-warning=DEP0040 /app/dist/sync-notion.js "$@"
fi
exec node --disable-warning=DEP0040 /app/dist/sync-notion.js "$@"
