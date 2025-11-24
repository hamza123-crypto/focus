# Focus App Setup Script for Windows PowerShell
# To run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then: .\setup.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Focus App - Windows Setup Script              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "✓ Checking Node.js..." -ForegroundColor Green
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "  Found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit
}

# Install dependencies
Write-Host ""
Write-Host "✓ Installing dependencies..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    exit
}

# Copy .env.example to .env
Write-Host ""
Write-Host "✓ Setting up environment..." -ForegroundColor Green
if (-Not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "  Created .env file" -ForegroundColor Green
    Write-Host "  ⚠️  Please edit .env with your database credentials!" -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists" -ForegroundColor Gray
}

# Sync database
Write-Host ""
Write-Host "✓ Syncing database..." -ForegroundColor Green
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Database sync failed. Make sure PostgreSQL is running!" -ForegroundColor Yellow
} else {
    Write-Host "  Database synced successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 Setup Complete! ✓                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: Run 'npm run dev' to start the application" -ForegroundColor Cyan
Write-Host ""
