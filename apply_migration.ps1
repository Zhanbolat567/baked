# Apply delivery fields migration to the database
# Usage: .\apply_migration.ps1

Write-Host "Applying database migration..." -ForegroundColor Cyan

# Check if Docker container is running
$containerStatus = docker ps --filter "name=social_db" --format "{{.Status}}"

if (-not $containerStatus) {
    Write-Host "Error: Docker container 'social_db' is not running!" -ForegroundColor Red
    Write-Host "Please start the containers first: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Container status: $containerStatus" -ForegroundColor Green
Write-Host "Applying migration from add_delivery_fields.sql..." -ForegroundColor Cyan

# Execute migration SQL file
Get-Content add_delivery_fields.sql | docker exec -i social_db psql -U social_user -d social_db

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Migration applied." -ForegroundColor Green
    Write-Host "`nNew fields added to 'orders' table:" -ForegroundColor Cyan
    Write-Host "  - delivery_type (pickup/delivery/dine_in)" -ForegroundColor White
    Write-Host "  - delivery_address" -ForegroundColor White
    Write-Host "  - delivery_apartment" -ForegroundColor White
    Write-Host "  - delivery_entrance" -ForegroundColor White
    Write-Host "  - delivery_floor" -ForegroundColor White
    Write-Host "  - delivery_latitude" -ForegroundColor White
    Write-Host "  - delivery_longitude" -ForegroundColor White
} else {
    Write-Host "`nError: Failed to apply migration!" -ForegroundColor Red
    exit 1
}
