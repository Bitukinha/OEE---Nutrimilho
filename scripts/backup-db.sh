#!/bin/bash
# Simple database backup script using pg_dump (Supabase/Postgres)
# Usage: ./scripts/backup-db.sh /path/to/output.sql

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"

# Read connection info from environment variables (set by supabase CLI or manually)
# SUPABASE_DB_URL should be in format: postgres://user:pass@host:port/dbname

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL environment variable is not set."
  exit 1
fi

# perform pg_dump
PGPASSWORD=$(echo "$SUPABASE_DB_URL" | sed -n 's#.*://[^:]*:\([^@]*\)@.*#\1#p')

# Extract host, port, user, dbname
# this is naïve but works for standard URLs
USER=$(echo "$SUPABASE_DB_URL" | sed -n 's#.*://\([^:]*\):.*#\1#p')
HOST=$(echo "$SUPABASE_DB_URL" | sed -n 's#.*@\([^:/]*\).*#\1#p')
PORT=$(echo "$SUPABASE_DB_URL" | sed -n 's#.*:\([0-9]*\)/.*#\1#p')
DBNAME=$(echo "$SUPABASE_DB_URL" | sed -n 's#.*/\([^?]*\).*#\1#p')

echo "Backing up database $DBNAME from $HOST:$PORT as $USER to $BACKUP_FILE"

pg_dump --host="$HOST" --port="$PORT" --username="$USER" --dbname="$DBNAME" --format=custom --file="$BACKUP_FILE"

echo "Backup completed."
