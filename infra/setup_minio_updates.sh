#!/bin/bash
set -e

# Load .env variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

echo "Waiting for MinIO to be ready..."
sleep 5

echo "Configuring MinIO Client (mc) and creating bucket..."
# We run all commands in a single container so the alias persists
# We use --network host to access localhost:9000
docker run --rm --network host --entrypoint /bin/sh minio/mc -c "
set -e
mc alias set myminio http://localhost:9000 \"$MINIO_ROOT_USER\" \"$MINIO_ROOT_PASSWORD\"
mc mb myminio/updates || true
mc anonymous set download myminio/updates
"

echo "MinIO Updates Bucket Configured Successfully!"