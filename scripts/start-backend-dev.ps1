$ErrorActionPreference = 'Stop'
$veduProjectRoot = Split-Path -Parent $PSScriptRoot
$veduSettings = Get-Content -LiteralPath (Join-Path $veduProjectRoot '.env') -Raw | ConvertFrom-StringData
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '5432'
$env:DB_USERNAME = $veduSettings.POSTGRES_USER
$env:DB_PASSWORD = $veduSettings.POSTGRES_PASSWORD
$env:DB_DATABASE = $veduSettings.POSTGRES_DB
$env:JWT_SECRET = $veduSettings.JWT_SECRET
$env:ML_SERVICE_URL = 'http://127.0.0.1:8001'
if ($veduSettings.ML_INTERNAL_TOKEN) { $env:ML_INTERNAL_TOKEN = $veduSettings.ML_INTERNAL_TOKEN }
foreach ($veduPathSetting in @('PATH_EXPLAIN_PROVIDER','PATH_EXPLAIN_URL','PATH_EXPLAIN_API_KEY','MOMO_PAYMENT_MODE','MOMO_ENV','MOMO_PARTNER_CODE','MOMO_ACCESS_KEY','MOMO_SECRET_KEY','MOMO_IPN_URL','MOMO_REDIRECT_URL')) {
    if ($veduSettings[$veduPathSetting]) { Set-Item -Path "Env:$veduPathSetting" -Value $veduSettings[$veduPathSetting] }
}
# Only stop this project's containers to release development ports; never remove volumes.
Set-Location $veduProjectRoot
docker compose stop backend frontend
Set-Location (Join-Path $veduProjectRoot 'backend')
npm run start:dev
