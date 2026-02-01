# Push Update Script for Tyaga Desktop
# Usage: ./push_update.ps1

$MinioUser = "vault_admin"
$MinioPass = "SongVault2024!"
$VpsIp = "76.13.113.206"

Write-Host "Setting up environment for MinIO S3 Provider..."
$env:AWS_ACCESS_KEY_ID = $MinioUser
$env:AWS_SECRET_ACCESS_KEY = $MinioPass

Write-Host "Building and Pushing Update to MinIO at $VpsIp..."
# Run the build and publish command
# The -- -p always argument passes "-p always" to electron-builder, forcing publish
npm run build -- -p always

if ($LASTEXITCODE -eq 0) {
    Write-Host "Update Pushed Successfully! Christopher will receive it on next restart." -ForegroundColor Green
} else {
    Write-Host "Build/Publish Failed." -ForegroundColor Red
}
