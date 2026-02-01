#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
else
    echo "Error: .env file not found. Please ensure it exists in the current directory."
    exit 1
fi

echo "Starting Song Vault Update..."

# 1. Create persistent storage directory
# MinIO runs as user/group ID 1000 by default in many images, or root depending on config.
# We ensure the host directory exists.
if [ ! -d "/home/christopher/vault_data" ]; then
    echo "Creating persistent volume directory at /home/christopher/vault_data..."
    sudo mkdir -p /home/christopher/vault_data
    # Set permissions (assuming standard uid 1000 for container user)
    sudo chown -R 1000:1000 /home/christopher/vault_data
    echo "Directory created."
else
    echo "Persistent volume directory already exists."
fi

# 2. Pull the new image
echo "Pulling MinIO image..."
docker compose pull christopher-vault

# 3. Start the new service (detached)
echo "Deploying Christopher's Vault..."
docker compose up -d christopher-vault

# 4. Update Rights Tracking to pick up new configuration
echo "Updating Rights Tracking service..."
docker compose up -d rights-tracking

echo "-----------------------------------"
echo "Update Complete!"
echo "Status:"
docker compose ps | grep -E 'christopher-vault|rights-tracking'
echo "-----------------------------------"
echo "Note: Console is available at http://localhost:9001 (Requires SSH Tunnel)"
