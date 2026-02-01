#!/bin/bash
set -e

# Load environment variables if present
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

echo "Starting Ollama Rebuild & Model Setup..."

# 1. Pull latest images
echo "Pulling Docker images..."
docker compose pull ollama

# 2. Recreate containers
echo "Recreating Ollama container..."
docker compose up -d --force-recreate ollama

# 3. Wait for Ollama to be healthy
echo "Waiting for Ollama service to start..."
# Loop check for 30 seconds
MAX_RETRIES=15
COUNT=0
until curl -s -f http://localhost:11434/api/version > /dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
    echo "Waiting for Ollama API (Attempt $((COUNT+1))/$MAX_RETRIES)..."
    sleep 2
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Ollama failed to start within 30 seconds."
    docker compose logs ollama
    exit 1
fi

echo "Ollama is running."

# 4. Pull Models
echo "----------------------------------------"
echo "Ensuring 'llama3' (Standard Model) is present..."
docker exec ollama ollama pull llama3

echo "----------------------------------------"
echo "Ensuring 'qwen2.5-coder' (Coding Model) is present..."
docker exec ollama ollama pull qwen2.5-coder

# 5. Update API Gateway linkage
echo "----------------------------------------"
echo "Updating API Gateway linkage..."
docker compose up -d --no-deps api-gateway

echo "----------------------------------------"
echo "Ollama Rebuild Complete!"
echo "Models Available:"
docker exec ollama ollama list
echo "----------------------------------------"
