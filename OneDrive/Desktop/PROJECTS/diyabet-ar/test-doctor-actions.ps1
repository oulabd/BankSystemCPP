# Doctor Action Panel API Tests
# Usage: .\test-doctor-actions.ps1 -Token "your_jwt_token" -PatientId "patient_id"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$PatientId,
    
    [string]$BaseUrl = "http://localhost:3000/api/doctor"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "Testing Doctor Action Panel Endpoints..." -ForegroundColor Cyan
Write-Host "Patient ID: $PatientId" -ForegroundColor Yellow

# Test 1: Add Note
Write-Host "`n[1] Testing Add Doctor Note..." -ForegroundColor Green
try {
    $noteBody = @{
        patientId = $PatientId
        noteText = "Patient shows good glucose control. Continue current insulin regimen."
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$BaseUrl/note" `
        -Method Post `
        -Headers $headers `
        -Body $noteBody

    Write-Host "✓ Note created successfully" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Create Prescription
Write-Host "`n[2] Testing Create Prescription..." -ForegroundColor Green
try {
    $prescriptionBody = @{
        patientId = $PatientId
        insulinType = "Humalog"
        dosage = "10 units"
        startDate = "2024-01-15"
        endDate = "2024-02-15"
        notes = "Take before meals"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$BaseUrl/prescription" `
        -Method Post `
        -Headers $headers `
        -Body $prescriptionBody

    Write-Host "✓ Prescription created successfully" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Request Lab Test
Write-Host "`n[3] Testing Lab Request..." -ForegroundColor Green
try {
    $labBody = @{
        patientId = $PatientId
        testType = "HbA1c"
        instructions = "Fasting required. Schedule for morning."
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$BaseUrl/lab-request" `
        -Method Post `
        -Headers $headers `
        -Body $labBody

    Write-Host "✓ Lab request created successfully" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTests completed!" -ForegroundColor Cyan
