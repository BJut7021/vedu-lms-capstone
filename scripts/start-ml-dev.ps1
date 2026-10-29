$ErrorActionPreference = 'Stop'
$veduProjectRoot = Split-Path -Parent $PSScriptRoot
$veduSettings = Get-Content -LiteralPath (Join-Path $veduProjectRoot '.env') -Raw | ConvertFrom-StringData
if ($veduSettings.ML_INTERNAL_TOKEN) { $env:ML_INTERNAL_TOKEN = $veduSettings.ML_INTERNAL_TOKEN }
Set-Location (Join-Path $veduProjectRoot 'ml-core')
if (Test-Path -LiteralPath '.venv\Scripts\python.exe') { & '.\.venv\Scripts\python.exe' server.py }
else { python server.py }
