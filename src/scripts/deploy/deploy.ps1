
# Deployment Script for Retirement Bucket Survivor
# Usage: .\src\scripts\deploy\deploy.ps1

Write-Host "🚀 Starting Deployment to Google Cloud Run..." -ForegroundColor Cyan

# 1. Configuration
$PROJECT_ID = "retirement-survivor-game" # Replace with your actual Project ID if different
$SERVICE_NAME = "retirement-game"
$REGION = "asia-south1"

# 2. Check GCP Login
Write-Host "Checking gcloud authentication..."
$auth = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $auth) {
    Write-Host "⚠️  Please login to gcloud first:" -ForegroundColor Yellow
    Write-Host "   gcloud auth login"
    exit
}
Write-Host "✅ Logged in as $auth" -ForegroundColor Green

# 3. Build and Deploy
Write-Host "📦 Building and Deploying to Cloud Run (Source)..." -ForegroundColor Cyan
Write-Host "   Service: $SERVICE_NAME"
Write-Host "   Region: $REGION"
Write-Host "   Project: $PROJECT_ID"
Write-Host ""

# Command: Deploy from source (uses Dockerfile automatically)
gcloud run deploy $SERVICE_NAME `
    --source . `
    --project $PROJECT_ID `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✨ Deployment Successful!" -ForegroundColor Green
    Write-Host "Current Date: $(Get-Date)"
} else {
    Write-Host ""
    Write-Host "❌ Deployment Failed." -ForegroundColor Red
}
