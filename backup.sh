#!/usr/bin/env bash
set -euo pipefail
cd /srv/oh2021
docker compose exec -T db pg_dump -U oh oh2021 | gzip > /var/backups/oh2021/oh2021-$(date +%F-%H%M).sql.gz
find /var/backups/oh2021 -name '*.sql.gz' -mtime +14 -delete
