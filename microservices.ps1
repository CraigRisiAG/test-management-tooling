# Test Management Platform - Microservices Architecture
# PowerShell Helper Script for Windows
# Run: .\microservices.ps1 <command>

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host "Test Management Microservices" -ForegroundColor Cyan
    Write-Host "================================`n" -ForegroundColor Cyan
    
    Write-Host "Development Commands:" -ForegroundColor Yellow
    Write-Host "  .\microservices.ps1 build        - Build all services"
    Write-Host "  .\microservices.ps1 up           - Start all services"
    Write-Host "  .\microservices.ps1 down         - Stop all services"
    Write-Host "  .\microservices.ps1 restart      - Restart all services"
    Write-Host "  .\microservices.ps1 logs         - View logs from all services"
    Write-Host "  .\microservices.ps1 health       - Check service health"
    Write-Host "  .\microservices.ps1 ps           - Show running containers"
    Write-Host "  .\microservices.ps1 clean        - Clean up containers and volumes"
    Write-Host "`n"
}

function Build-Services {
    Write-Host "Building all services..." -ForegroundColor Green
    docker-compose -f docker-compose.microservices.yml build
}

function Start-Services {
    Write-Host "Starting all services..." -ForegroundColor Green
    docker-compose -f docker-compose.microservices.yml up -d
    Write-Host "`nServices started! 🚀" -ForegroundColor Green
    Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nRun '.\microservices.ps1 logs' to view logs" -ForegroundColor Yellow
    Write-Host "Run '.\microservices.ps1 health' to check health`n" -ForegroundColor Yellow
}

function Stop-Services {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.microservices.yml down
}

function Restart-Services {
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Show-Logs {
    Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    docker-compose -f docker-compose.microservices.yml logs -f
}

function Check-Health {
    Write-Host "`nChecking service health...`n" -ForegroundColor Cyan
    
    $services = @(
        @{Name="API Gateway"; Port=3000},
        @{Name="User Admin"; Port=4001},
        @{Name="Agile Board"; Port=4002},
        @{Name="Code Tracer"; Port=4003},
        @{Name="Pipeline"; Port=4004},
        @{Name="Test Management"; Port=4005},
        @{Name="Reporting"; Port=4006}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 2
            Write-Host "✓ $($service.Name) (Port $($service.Port)): " -NoNewline -ForegroundColor Green
            Write-Host "Healthy" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ $($service.Name) (Port $($service.Port)): " -NoNewline -ForegroundColor Red
            Write-Host "Not responding" -ForegroundColor Red
        }
    }
    Write-Host ""
}

function Show-Containers {
    Write-Host "Running containers:`n" -ForegroundColor Cyan
    docker-compose -f docker-compose.microservices.yml ps
}

function Clean-Services {
    Write-Host "Cleaning up containers and volumes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.microservices.yml down -v
    Write-Host "Cleanup complete!" -ForegroundColor Green
}

function Quick-Start {
    Write-Host "`n🚀 Quick Start`n" -ForegroundColor Cyan
    Write-Host "1. Building services..." -ForegroundColor Yellow
    Build-Services
    Write-Host "`n2. Starting services..." -ForegroundColor Yellow
    Start-Services
    Write-Host "`n3. Waiting for services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Write-Host "`n4. Checking health..." -ForegroundColor Yellow
    Check-Health
    Write-Host "✅ Setup complete!`n" -ForegroundColor Green
}

function Reset-Database {
    Write-Host "Resetting databases..." -ForegroundColor Yellow
    docker-compose -f docker-compose.microservices.yml down -v
    docker-compose -f docker-compose.microservices.yml up -d postgres
    Start-Sleep -Seconds 5
    Write-Host "Database reset complete!" -ForegroundColor Green
}

# Main command router
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "build" { Build-Services }
    "up" { Start-Services }
    "down" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "health" { Check-Health }
    "ps" { Show-Containers }
    "clean" { Clean-Services }
    "quickstart" { Quick-Start }
    "db-reset" { Reset-Database }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
    }
}
