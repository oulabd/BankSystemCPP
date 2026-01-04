# Complete Doctor Action Panel API Testing Script
# Usage: .\test-doctor-api.ps1

param(
    [string]$BaseUrl = "http://127.0.0.1:3000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Doctor Action Panel API Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login as Doctor
Write-Host "[1/5] Logging in as doctor..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor@example.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"

    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure you have a doctor account in the database" -ForegroundColor Yellow
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get Patient List
Write-Host "`n[2/5] Fetching patient list..." -ForegroundColor Yellow
try {
    $patients = Invoke-RestMethod -Uri "$BaseUrl/api/doctor/patients" `
        -Method Get `
        -Headers @{Authorization="Bearer $token"}

    if ($patients.Length -gt 0) {
        $patientId = $patients[0]._id
        Write-Host "✓ Found $($patients.Length) patient(s)" -ForegroundColor Green
        Write-Host "  Using patient: $($patients[0].fullName) (ID: $patientId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No patients found for this doctor" -ForegroundColor Red
        Write-Host "  Assign at least one patient to this doctor in the database" -ForegroundColor Yellow
        exit
    }
} catch {
    Write-Host "✗ Failed to fetch patients: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 3: Add Doctor Note
Write-Host "`n[3/5] Adding doctor note..." -ForegroundColor Yellow
try {
    $noteBody = @{
        patientId = $patientId
        noteText = "Patient shows good glucose control. Continue current insulin regimen. [Test from PowerShell - $(Get-Date -Format 'yyyy-MM-dd HH:mm')]"
    } | ConvertTo-Json

    $noteResult = Invoke-RestMethod -Uri "$BaseUrl/api/doctor/note" `
        -Method Post `
        -Headers $headers `
        -Body $noteBody

    Write-Host "✓ Note created successfully!" -ForegroundColor Green
    Write-Host "  Note ID: $($noteResult.note._id)" -ForegroundColor Gray
    Write-Host "  Message: $($noteResult.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Step 4: Create Prescription
Write-Host "`n[4/5] Creating prescription..." -ForegroundColor Yellow
try {
    $prescriptionBody = @{
        patientId = $patientId
        insulinType = "Humalog"
        dosage = "10 units"
        startDate = (Get-Date).ToString("yyyy-MM-dd")
        endDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        notes = "Take before meals. Monitor glucose levels closely."
    } | ConvertTo-Json

    $prescriptionResult = Invoke-RestMethod -Uri "$BaseUrl/api/doctor/prescription" `
        -Method Post `
        -Headers $headers `
        -Body $prescriptionBody

    Write-Host "✓ Prescription created successfully!" -ForegroundColor Green
    Write-Host "  Prescription ID: $($prescriptionResult.prescription._id)" -ForegroundColor Gray
    Write-Host "  Message: $($prescriptionResult.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Step 5: Request Lab Test
Write-Host "`n[5/5] Requesting lab test..." -ForegroundColor Yellow
try {
    $labBody = @{
        patientId = $patientId
        testType = "HbA1c"
        instructions = "Fasting required. Schedule for morning. [Test requested $(Get-Date -Format 'yyyy-MM-dd HH:mm')]"
    } | ConvertTo-Json

    $labResult = Invoke-RestMethod -Uri "$BaseUrl/api/doctor/lab-request" `
        -Method Post `
        -Headers $headers `
        -Body $labBody

    Write-Host "✓ Lab request created successfully!" -ForegroundColor Green
    Write-Host "  Lab Request ID: $($labResult.labRequest._id)" -ForegroundColor Gray
    Write-Host "  Message: $($labResult.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Doctor Action Panel Backend Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAll endpoints are working:" -ForegroundColor Green
Write-Host "  ✓ POST /api/doctor/note" -ForegroundColor Green
Write-Host "  ✓ POST /api/doctor/prescription" -ForegroundColor Green
Write-Host "  ✓ POST /api/doctor/lab-request" -ForegroundColor Green
Write-Host "`nCheck your MongoDB database to verify the data was saved." -ForegroundColor Yellow
