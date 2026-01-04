# Start the Diyabetliyim backend server
$ErrorActionPreference = "Continue"

Write-Host "🚀 Starting Diyabetliyim Backend Server..." -ForegroundColor Cyan
Write-Host "📁 Working Directory: $PSScriptRoot" -ForegroundColor Gray

# Change to backend directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "`n✨ Starting server..." -ForegroundColor Green
node server.js
