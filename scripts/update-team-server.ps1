param([switch]$Pull, [string]$BindAddress = '')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$script:VeduComposeFiles = @('-f','docker-compose.yml')
function Invoke-Docker {
    $DockerArguments = @($args)
    if ($DockerArguments[0] -eq 'compose') { $DockerArguments = @('compose') + $script:VeduComposeFiles + $DockerArguments[1..($DockerArguments.Length-1)] }
    & docker @DockerArguments
    if ($LASTEXITCODE -ne 0) { throw 'Docker command failed. Existing volumes were retained; inspect the preceding error.' }
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install and open Docker Desktop first.' }
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Open Docker Desktop and wait for Engine running.' }
if ($Pull) {
    if (git status --porcelain) { throw 'Commit or preserve local changes before using -Pull. No files were reset.' }
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'Git pull failed; resolve the branch/update before deploying.' }
}
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    $initial = [IO.File]::ReadAllText((Join-Path (Get-Location) '.env'))
    foreach ($key in @('POSTGRES_PASSWORD','JWT_SECRET','ML_INTERNAL_TOKEN')) {
        $bytes = New-Object byte[] 32
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
        $initial = [regex]::Replace($initial, "(?m)^$key=.*$", "$key=$secret")
    }
    [IO.File]::WriteAllText((Join-Path (Get-Location) '.env'),$initial)
    Write-Host 'Created local .env; generated secrets are not printed.'
}
$settings = Get-Content -LiteralPath '.env' -Raw | ConvertFrom-StringData
if ($BindAddress) {
    $parsed = $null
    if (-not [Net.IPAddress]::TryParse($BindAddress,[ref]$parsed) -or $parsed.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { throw 'BindAddress must be a private IPv4 of this server.' }
    $octets = $parsed.GetAddressBytes()
    $private = $octets[0] -eq 10 -or $octets[0] -eq 127 -or ($octets[0] -eq 192 -and $octets[1] -eq 168) -or ($octets[0] -eq 172 -and $octets[1] -ge 16 -and $octets[1] -le 31) -or ($octets[0] -eq 100 -and $octets[1] -ge 64 -and $octets[1] -le 127)
    $local = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress)
    if (-not $private -or $local -notcontains $BindAddress) { throw 'Use a private LAN/VPN IPv4 actually assigned to this server. Database/API ports remain on localhost.' }
    $url = "http://${BindAddress}:$($settings.VEDU_WEB_PORT)"
    $configPath = Join-Path (Get-Location) '.env'
    $configText = [IO.File]::ReadAllText($configPath)
    foreach ($entry in @(@('VEDU_TEAM_BIND',$BindAddress),@('VEDU_PUBLIC_URL',$url),@('VEDU_CORS_ORIGINS',"http://localhost:$($settings.VEDU_WEB_PORT),$url"))) {
        if ($configText -match "(?m)^$($entry[0])=") { $configText = [regex]::Replace($configText,"(?m)^$($entry[0])=.*$","$($entry[0])=$($entry[1])") }
        else { $configText = $configText.TrimEnd()+"`n$($entry[0])=$($entry[1])`n" }
    }
    [IO.File]::WriteAllText($configPath,$configText)
    $settings = Get-Content -LiteralPath '.env' -Raw | ConvertFrom-StringData
}
if ($settings.VEDU_TEAM_BIND -and $settings.VEDU_TEAM_BIND -ne '127.0.0.1') { $script:VeduComposeFiles += @('-f','docker-compose.team.yml') }
Invoke-Docker compose up -d --wait db ml
# Write the binary dump inside the container, then copy it. Never pipe it through PowerShell text encoding.
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path (Get-Location) '.work\backups'
New-Item -ItemType Directory -Force -Path $backup | Out-Null
$containerDump = "/tmp/vedu-before-update-$stamp.dump"
Invoke-Docker compose exec -T db pg_dump -U $settings.POSTGRES_USER -d $settings.POSTGRES_DB -Fc -f $containerDump
Invoke-Docker compose cp "db:$containerDump" (Join-Path $backup "vedu-$stamp.dump")
Invoke-Docker compose exec -T db rm -- $containerDump
Write-Host "Database backup saved under .work\backups\vedu-$stamp.dump"
Invoke-Docker compose build backend frontend ml
Invoke-Docker compose run --rm --no-deps demo-seed
Invoke-Docker compose up -d --no-deps --force-recreate --wait ml backend frontend
Write-Host 'Server updated. Accounts, learning progress, payment history, media and model volumes were retained.'
Write-Host "Team members open the SAME URL: $($settings.VEDU_PUBLIC_URL)"
Write-Host 'Git does not synchronize database volumes. Run this update on the shared server only; other members use their own role accounts in the browser.'
