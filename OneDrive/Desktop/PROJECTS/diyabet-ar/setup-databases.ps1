# MongoDB Database Creation Script
# PowerShell script to create both databases

Write-Host "Creating MongoDB Databases..." -ForegroundColor Cyan

# Check if MongoDB is installed and running
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue

if ($null -eq $mongoService) {
    Write-Host "⚠ MongoDB service not found. Please ensure MongoDB is installed." -ForegroundColor Yellow
    Write-Host "Visit: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

if ($mongoService.Status -ne "Running") {
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    Start-Service MongoDB
    Start-Sleep -Seconds 3
}

# Try mongosh first (newer versions)
$mongoshPath = (Get-Command mongosh -ErrorAction SilentlyContinue).Source
if ($mongoshPath) {
    Write-Host "Using mongosh..." -ForegroundColor Green
    Get-Content "setup-databases.mongodb" | mongosh --quiet
} else {
    # Try legacy mongo shell
    $mongoPath = (Get-Command mongo -ErrorAction SilentlyContinue).Source
    if ($mongoPath) {
        Write-Host "Using mongo shell..." -ForegroundColor Green
        Get-Content "setup-databases.mongodb" | mongo --quiet
    } else {
        Write-Host "⚠ MongoDB shell not found in PATH" -ForegroundColor Red
        Write-Host "The databases will be created automatically when the app first runs." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To manually create databases:" -ForegroundColor Cyan
        Write-Host "1. Open MongoDB Compass or MongoDB shell" -ForegroundColor White
        Write-Host "2. Run: use diyabet-tr" -ForegroundColor White
        Write-Host "3. Run: db.createCollection('users')" -ForegroundColor White
        Write-Host "4. Run: use diyabet-ar" -ForegroundColor White
        Write-Host "5. Run: db.createCollection('users')" -ForegroundColor White
        exit 0
    }
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host "   • diyabet-tr (Turkish version - port 3000)" -ForegroundColor White
Write-Host "   • diyabet-ar (Arabic version - port 3001)" -ForegroundColor White
