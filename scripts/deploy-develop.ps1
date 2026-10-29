param([Parameter(Mandatory = $true)][string]$DeployPath, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
if (-not [IO.Path]::IsPathRooted($DeployPath)) { throw 'Use an absolute dedicated server path.' }
Set-Location -LiteralPath (Resolve-Path -LiteralPath $DeployPath).Path
$branch = & git branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'develop') {
    throw 'Deployment requires a dedicated checkout on develop. Your current branch was not changed.'
}
$tracking = & git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
if ($LASTEXITCODE -ne 0 -or $tracking -ne 'origin/develop') { throw 'develop must track origin/develop.' }
$changes = & git status --porcelain
if ($LASTEXITCODE -ne 0 -or $changes) { throw 'Server checkout has local changes. No files were reset or overwritten.' }
if (-not (Test-Path -LiteralPath '.env')) { throw 'Prepare the server .env locally before enabling deployment.' }
if (-not (Test-Path -LiteralPath 'ml-core\data' -PathType Container)) {
    throw 'Copy the shared ML datasets into ml-core\data before enabling deployment.'
}
if (-not (Test-Path -LiteralPath 'scripts\update-team-server.ps1')) { throw 'Update script is missing.' }
if ($CheckOnly) {
    Write-Host 'Deployment checkout checks passed. No code, containers, or data were changed.'
    exit 0
}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\scripts\update-team-server.ps1' -Pull
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed. See the job log; existing data volumes were retained.' }
