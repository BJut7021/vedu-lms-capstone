param(
    [Parameter(Mandatory = $true)][ValidateSet('Export','Import')][string]$Mode,
    [string]$Path = '',
    [ValidatePattern('^vedu-[a-z0-9-]+$')][string]$ProjectName = 'vedu-team-copy',
    [ValidateRange(1024,65535)][int]$WebPort = 8081,
    [ValidateRange(1024,65535)][int]$ApiPort = 3001
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$root = (Get-Location).Path
$script:composeArguments = @('compose','-f','docker-compose.yml')
function Invoke-Compose {
    $arguments = $script:composeArguments + @($args)
    & docker @arguments
    if ($LASTEXITCODE -ne 0) { throw 'Docker operation failed. No existing database was deleted.' }
}
function New-LocalSecret {
    $bytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    return (-join ($bytes | ForEach-Object { $_.ToString('x2') }))
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Open Docker Desktop first.' }
if ($Mode -eq 'Export') {
    if (-not (Test-Path -LiteralPath '.env')) { throw 'Source .env is missing.' }
    $settings = Get-Content -LiteralPath '.env' -Raw | ConvertFrom-StringData
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $folder = Join-Path $root ".work\team-snapshots\$stamp"
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    foreach ($name in @('media','ml-artifacts','ml-data')) {
        New-Item -ItemType Directory -Path (Join-Path $folder $name) | Out-Null
    }
    $dump = "/tmp/vedu-team-$stamp.dump"
    Invoke-Compose exec -T db pg_dump -U $settings.POSTGRES_USER -d $settings.POSTGRES_DB --no-owner --no-privileges -Fc -f $dump
    Invoke-Compose cp "db:$dump" (Join-Path $folder 'database.dump')
    Invoke-Compose exec -T db rm -- $dump
    Invoke-Compose cp 'backend:/app/media/.' (Join-Path $folder 'media')
    Invoke-Compose cp 'ml:/app/artifacts/.' (Join-Path $folder 'ml-artifacts')
    Invoke-Compose cp 'ml:/data/.' (Join-Path $folder 'ml-data')
    $revision = & git rev-parse HEAD
    @{
        format = 1
        exportedAt = (Get-Date).ToUniversalTime().ToString('o')
        sourceRevision = $revision
        databaseSha256 = (Get-FileHash -LiteralPath (Join-Path $folder 'database.dump') -Algorithm SHA256).Hash
        note = 'Private team copy. Source working tree may contain uncommitted code. Share matching source separately. No .env included.'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $folder 'manifest.json') -Encoding UTF8
    if (-not $Path) { $Path = "$folder.zip" }
    $destination = [IO.Path]::GetFullPath($Path)
    if (Test-Path -LiteralPath $destination) { throw 'Output already exists; choose another archive path.' }
    Compress-Archive -Path (Join-Path $folder '*') -DestinationPath $destination -CompressionLevel Optimal
    Write-Host "Export complete: $destination"
    Write-Host 'Contains accounts, course/progress/payment data, uploads, ML artifacts and datasets. Share privately, never commit this archive or .env.'
    exit 0
}
if (-not $Path -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw 'Supply -Path to the received snapshot ZIP.' }
if ($WebPort -eq $ApiPort) { throw 'WebPort and ApiPort must differ.' }
$existingVolumes = & docker volume ls --filter "label=com.docker.compose.project=$ProjectName" --format '{{.Name}}'
if ($LASTEXITCODE -ne 0 -or $existingVolumes) { throw 'This project already has data. Choose another -ProjectName; existing data will not be overwritten.' }
$existingContainers = & docker ps -a -q --filter "label=com.docker.compose.project=$ProjectName"
if ($LASTEXITCODE -ne 0 -or $existingContainers) { throw 'This project already has containers. Choose another -ProjectName.' }
$folder = Join-Path $root ".work\team-copies\$ProjectName"
$envFile = ".env.$ProjectName"
if ((Test-Path -LiteralPath $folder) -or (Test-Path -LiteralPath $envFile)) { throw 'Import folder/config already exists. Choose another -ProjectName.' }
foreach ($port in @($WebPort,$ApiPort)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is busy. Choose other -WebPort and -ApiPort values." }
}
Expand-Archive -LiteralPath ([IO.Path]::GetFullPath($Path)) -DestinationPath $folder
$manifest = Get-Content -LiteralPath (Join-Path $folder 'manifest.json') -Raw | ConvertFrom-Json
if ($manifest.format -ne 1 -or (Get-FileHash -LiteralPath (Join-Path $folder 'database.dump') -Algorithm SHA256).Hash -ne $manifest.databaseSha256) {
    throw 'Snapshot version/hash is invalid; import stopped.'
}
$datasetDirectory = (Join-Path $folder 'ml-data').Replace('\','/')
@(
    'POSTGRES_DB=vedu', 'POSTGRES_USER=vedu_app', "POSTGRES_PASSWORD=$(New-LocalSecret)",
    "JWT_SECRET=$(New-LocalSecret)", "ML_INTERNAL_TOKEN=$(New-LocalSecret)",
    "VEDU_WEB_PORT=$WebPort", "VEDU_API_PORT=$ApiPort", "VEDU_PUBLIC_URL=http://localhost:$WebPort",
    "VEDU_CORS_ORIGINS=http://localhost:$WebPort", 'MOMO_PAYMENT_MODE=personal', 'PATH_EXPLAIN_PROVIDER=disabled',
    "VEDU_SNAPSHOT_DATA_DIR=$datasetDirectory"
) | Set-Content -LiteralPath $envFile -Encoding ASCII
$script:composeArguments = @('compose','--env-file',$envFile,'-p',$ProjectName,'-f','docker-compose.yml','-f','docker-compose.snapshot.yml')
Invoke-Compose up -d --wait db
Invoke-Compose cp (Join-Path $folder 'database.dump') 'db:/tmp/vedu-team-restore.dump'
Invoke-Compose exec -T db pg_restore -U vedu_app -d vedu --no-owner --no-privileges --exit-on-error /tmp/vedu-team-restore.dump
Invoke-Compose exec -T db rm -- /tmp/vedu-team-restore.dump
Invoke-Compose build backend frontend ml
Invoke-Compose create ml backend frontend
Invoke-Compose cp (Join-Path $folder 'media\.') 'backend:/app/media'
Invoke-Compose cp (Join-Path $folder 'ml-artifacts\.') 'ml:/app/artifacts'
# Files copied from another host can have different UID ownership.
Invoke-Compose run --rm --no-deps --user root --entrypoint chown backend -R node:node /app/media
Invoke-Compose run --rm --no-deps --user root --entrypoint chown ml -R worker:worker /app/artifacts
Invoke-Compose up -d --no-deps --wait ml backend frontend
Write-Host "Independent team copy ready: http://localhost:$WebPort"
Write-Host "Project: $ProjectName; environment file: $envFile. Use BOTH compose files and this env/project when rebuilding."
Write-Host 'The source database was not touched. Keep .work/team-copies: it holds the copied ML datasets.'
