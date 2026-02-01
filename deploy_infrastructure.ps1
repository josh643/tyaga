$VPS_IP = "76.13.113.206"
$USER = "root"

# Clear old host key to prevent verification errors
Write-Host "Clearing old host key for $VPS_IP..."
ssh-keygen -R $VPS_IP

Write-Host "1. Copying setup script to VPS ($VPS_IP)..."
Write-Host "You will be asked for the password."
scp -o StrictHostKeyChecking=no infra/setup_vps.sh "${USER}@${VPS_IP}:~/setup_vps.sh"

Write-Host "2. Running setup script on VPS..."
Write-Host "You will be asked for the password again."
ssh -o StrictHostKeyChecking=no "${USER}@${VPS_IP}" "chmod +x ~/setup_vps.sh && ~/setup_vps.sh"

Write-Host "3. Copying infra configuration..."
Write-Host "You will be asked for the password."
# Create directories
ssh -o StrictHostKeyChecking=no "${USER}@${VPS_IP}" "mkdir -p ~/tyaga/infra && mkdir -p ~/tyaga/apps/desktop && mkdir -p ~/tyaga/services"
scp -o StrictHostKeyChecking=no -r infra/* "${USER}@${VPS_IP}:~/tyaga/infra/"

Write-Host "3b. Copying Services (Excluding node_modules)..."
# Using a loop to copy services individually to avoid huge node_modules if present locally, 
# or just excluding them if possible. Since standard scp lacks --exclude, we copy specific files/folders.
# A better approach for frequent deploys is rsync, but sticking to scp for compatibility.
# We will copy src, package.json, Dockerfile, tsconfig.json for each service.

$services = "api-gateway", "auth", "brand-management", "rights-tracking"
foreach ($service in $services) {
    Write-Host "Copying $service..."
    ssh -o StrictHostKeyChecking=no "${USER}@${VPS_IP}" "mkdir -p ~/tyaga/services/$service"
    scp -o StrictHostKeyChecking=no services/$service/package.json "${USER}@${VPS_IP}:~/tyaga/services/$service/"
    scp -o StrictHostKeyChecking=no services/$service/tsconfig.json "${USER}@${VPS_IP}:~/tyaga/services/$service/"
    scp -o StrictHostKeyChecking=no services/$service/Dockerfile "${USER}@${VPS_IP}:~/tyaga/services/$service/"
    scp -o StrictHostKeyChecking=no -r services/$service/src "${USER}@${VPS_IP}:~/tyaga/services/$service/"
}

Write-Host "4. Copying web dashboard assets..."
Write-Host "You will be asked for the password."
scp -o StrictHostKeyChecking=no -r apps/desktop/dist-renderer "${USER}@${VPS_IP}:~/tyaga/apps/desktop/"

Write-Host "5. Starting Docker services..."
Write-Host "You will be asked for the password one last time."
ssh -o StrictHostKeyChecking=no "${USER}@${VPS_IP}" "cd ~/tyaga/infra && docker compose up -d --build"

Write-Host "Deployment Complete!"
Write-Host "Your API is available at: http://${VPS_IP}/"
Write-Host "n8n is available at: http://${VPS_IP}/n8n/"
