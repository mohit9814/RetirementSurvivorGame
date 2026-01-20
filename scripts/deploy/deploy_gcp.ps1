# Google Cloud Deployment Script for Retirement Survivor Game

# --- Configuration ---
$PROJECT_ID = "retirement-survivor-game"
$SERVICE_NAME = "retirement-survivor-ui"
$REGION = "us-central1"
$IMAGE_TAG = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Starting Deployment for $SERVICE_NAME to Project $PROJECT_ID..." -ForegroundColor Cyan

# 1. Set Project
Write-Host "1. Setting active project..."
gcloud config set project $PROJECT_ID

# 2. Enable Services (Idempotent)
Write-Host "2. Ensuring APIs are enabled..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# 3. Build & Push Container (Using Cloud Build)
Write-Host "3. Building container in Cloud Build (this may take a few minutes)..."
cmd /c "gcloud builds submit --tag $IMAGE_TAG ."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Check output above." -ForegroundColor Red
    exit 1
}

# 4. Deploy to Cloud Run
Write-Host "4. Deploying to Cloud Run..."
cmd /c "gcloud run deploy $SERVICE_NAME --image $IMAGE_TAG --platform managed --region $REGION --allow-unauthenticated"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "check the URL above to view your app." -ForegroundColor Cyan
