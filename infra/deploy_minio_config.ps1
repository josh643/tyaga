$VPS_IP = "76.13.113.206"
$USER = "root"

Write-Host "1. Updating docker-compose.yml on VPS..."
scp -o StrictHostKeyChecking=no infra/docker-compose.yml "${USER}@${VPS_IP}:~/tyaga/infra/docker-compose.yml"

Write-Host "2. Copying setup_minio_updates.sh to VPS..."
scp -o StrictHostKeyChecking=no infra/setup_minio_updates.sh "${USER}@${VPS_IP}:~/tyaga/infra/setup_minio_updates.sh"

Write-Host "3. Applying changes on VPS (Restarting MinIO & Configuring Bucket)..."
Write-Host "You may be prompted for the VPS password."
ssh -o StrictHostKeyChecking=no "${USER}@${VPS_IP}" "cd ~/tyaga/infra && docker compose up -d christopher-vault && chmod +x setup_minio_updates.sh && ./setup_minio_updates.sh"

Write-Host "Done! MinIO is now configured for updates."