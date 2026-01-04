Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DİYABETLİYİM Setup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit
}

# Check if MongoDB is running
Write-Host "`n[2/5] Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ MongoDB is not running. Please start MongoDB." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check MongoDB status" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n[3/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit
}

# Check if .env exists
Write-Host "`n[4/5] Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "✓ .env file created. Please update with your values." -ForegroundColor Green
}

# Generate encryption key if needed
Write-Host "`n[5/5] Checking encryption key..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -match "ENCRYPTION_KEY=generate-this") {
    Write-Host "⚠ Generating encryption key..." -ForegroundColor Yellow
    npm run generate-key
    Write-Host "⚠ Please copy the generated key to your .env file" -ForegroundColor Yellow
} else {
    Write-Host "✓ Encryption key configured" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your configuration"
Write-Host "2. Make sure MongoDB is running"
Write-Host "3. Run: npm start"
Write-Host "`nTo test the API, run: .\test-doctor-api.ps1" -ForegroundColor Cyan
