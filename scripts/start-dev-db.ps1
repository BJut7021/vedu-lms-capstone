$ErrorActionPreference = 'Continue'

Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI not found. Install and open Docker Desktop.'
}

docker version *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'Docker engine is not running.' -ForegroundColor Red
    Write-Host '1. Run: wsl --status'
    Write-Host '2. If no distribution exists, open Administrator PowerShell and run: wsl --install -d Ubuntu'
    Write-Host '3. Restart Windows, open Docker Desktop, and wait for Engine running.'
    exit 1
}

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host 'Created .env from .env.example. Change passwords and secrets before deployment.' -ForegroundColor Yellow
}

$databaseSettings = Get-Content -LiteralPath '.env' -Raw | ConvertFrom-StringData
$databaseUser = $databaseSettings.POSTGRES_USER
$databaseName = $databaseSettings.POSTGRES_DB

docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

for ($attempt = 1; $attempt -le 30; $attempt++) {
    docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db pg_isready -U $databaseUser -d $databaseName *> $null
    if ($LASTEXITCODE -eq 0) {
        docker compose -f docker-compose.yml -f docker-compose.dev.yml cp database/vedu/portal_demo_seed.sql db:/tmp/portal_demo_seed.sql *> $null
        if ($LASTEXITCODE -eq 0) {
            docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -v ON_ERROR_STOP=1 -U $databaseUser -d $databaseName -f /tmp/portal_demo_seed.sql *> $null
        }

        if ($LASTEXITCODE -ne 0) {
            Write-Host 'PostgreSQL is ready, but the role demo seed failed. Run docker compose logs db.' -ForegroundColor Red
            exit 1
        }

        docker compose -f docker-compose.yml -f docker-compose.dev.yml cp database/vedu/platform_upgrade.sql db:/tmp/platform_upgrade.sql
        docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -v ON_ERROR_STOP=1 -U $databaseUser -d $databaseName -f /tmp/platform_upgrade.sql
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        docker compose -f docker-compose.yml -f docker-compose.dev.yml cp database/vedu/content_workflow.sql db:/tmp/content_workflow.sql
        docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -v ON_ERROR_STOP=1 -U $databaseUser -d $databaseName -f /tmp/content_workflow.sql
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        docker compose -f docker-compose.yml -f docker-compose.dev.yml cp database/vedu/curated_catalog.sql db:/tmp/curated_catalog.sql
        docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T db psql -v ON_ERROR_STOP=1 -U $databaseUser -d $databaseName -f /tmp/curated_catalog.sql
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm --no-deps course-materials
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Write-Host 'Vedu PostgreSQL is ready at localhost:5432.' -ForegroundColor Green
        Write-Host 'Vedu database is ready. Use the student guest sign-in or your role account.' -ForegroundColor Cyan
        exit 0
    }

    Start-Sleep -Seconds 2
}

Write-Host 'PostgreSQL was not ready after 60 seconds. Run docker compose logs db.' -ForegroundColor Red
exit 1
