#!/usr/bin/env pwsh
# Pizza Ordering App - GitHub Push Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🍕 Pizza Ordering App - GitHub Push" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to app directory
cd "e:\OIBSIP\LEVEL 3\pizza-ordering-app"

# Check if .git exists
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
    Write-Host ""
}

# Configure Git (first time)
Write-Host "📝 Configuring Git..." -ForegroundColor Yellow
git config user.email "your-email@example.com"
git config user.name "Your Name"
Write-Host "✅ Git configured" -ForegroundColor Green
Write-Host ""

# Show current status
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
git status
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to push all changes to GitHub? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Push cancelled" -ForegroundColor Red
    exit 0
}

# Get commit message
Write-Host ""
$message = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Initial commit: Pizza ordering app with Streamlit deployment"
}

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stage all files
Write-Host "📝 Staging files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m $message

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nothing to commit or error occurred" -ForegroundColor Yellow
    exit 0
}

# Push
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow

# Check if remote exists
$remoteExists = git config --get remote.origin.url
if (-not $remoteExists) {
    Write-Host ""
    Write-Host "⚠️  Remote not set up yet!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Cyan
    Write-Host "1. Create a GitHub repository at https://github.com/new" -ForegroundColor White
    Write-Host "2. Run this command with your GitHub URL:" -ForegroundColor White
    Write-Host ""
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/pizza-ordering-app.git" -ForegroundColor Yellow
    Write-Host "   git branch -M main" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Push to remote
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Your repository is now online!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Go to your GitHub repository"
    Write-Host "2. Deploy frontend to Vercel"
    Write-Host "3. Deploy backend to Render"
    Write-Host "4. Setup MongoDB Atlas"
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "⚠️  Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "- Remote is set: git remote add origin <url>"
    Write-Host "- You have internet connection"
    Write-Host "- Your credentials are configured"
    Write-Host ""
}
