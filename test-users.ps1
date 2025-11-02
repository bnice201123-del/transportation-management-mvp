# Test User Registration Script
# This PowerShell script creates test users with different roles

$baseUrl = "http://localhost:3001/api"

# Test users to create
$testUsers = @(
    @{
        firstName = "Admin"
        lastName = "User"
        email = "admin@test.com"
        password = "admin123"
        role = "admin"
        phone = "555-0001"
    },
    @{
        firstName = "Sarah"
        lastName = "Scheduler"
        email = "scheduler@test.com"
        password = "scheduler123"
        role = "scheduler"
        phone = "555-0002"
    },
    @{
        firstName = "Mike"
        lastName = "Dispatcher"
        email = "dispatcher@test.com"
        password = "dispatcher123"
        role = "dispatcher"
        phone = "555-0003"
    },
    @{
        firstName = "John"
        lastName = "Driver"
        email = "driver@test.com"
        password = "driver123"
        role = "driver"
        phone = "555-0004"
        licenseNumber = "DL123456789"
        vehicleInfo = "Toyota Camry 2020 - ABC123"
    }
)

Write-Host "🚀 Starting user registration test..." -ForegroundColor Green
Write-Host "Backend URL: $baseUrl" -ForegroundColor Yellow

# Test backend connection first
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Backend is running: $($healthCheck.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Register each test user
foreach ($user in $testUsers) {
    Write-Host "`n📝 Registering $($user.role): $($user.email)" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body ($user | ConvertTo-Json)
        Write-Host "✅ Successfully registered $($user.firstName) $($user.lastName) ($($user.role))" -ForegroundColor Green
        Write-Host "   User ID: $($response.user._id)" -ForegroundColor Gray
    } catch {
        $errorDetails = $_.Exception.Response
        if ($errorDetails) {
            $reader = New-Object System.IO.StreamReader($errorDetails.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "❌ Failed to register $($user.email): $errorBody" -ForegroundColor Red
        } else {
            Write-Host "❌ Failed to register $($user.email): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n🎯 Registration test complete!" -ForegroundColor Green
Write-Host "`n📋 Test Login Credentials:" -ForegroundColor Yellow
Write-Host "Admin:      admin@test.com / admin123" -ForegroundColor White
Write-Host "Scheduler:  scheduler@test.com / scheduler123" -ForegroundColor White
Write-Host "Dispatcher: dispatcher@test.com / dispatcher123" -ForegroundColor White
Write-Host "Driver:     driver@test.com / driver123" -ForegroundColor White
Write-Host "`n🌐 Frontend URL: http://localhost:5174" -ForegroundColor Cyan