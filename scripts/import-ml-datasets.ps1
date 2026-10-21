param([string]$SourceDirectory = 'C:\2025-2026_Dai_Hoc\hk1-2026-namcuoi\CNTT_KLCN_260_EDU\dataset_training')
$ErrorActionPreference = 'Stop'
$mlDataTarget = Join-Path (Split-Path -Parent $PSScriptRoot) 'ml-core\data'
New-Item -ItemType Directory -Force -Path $mlDataTarget | Out-Null
foreach ($mlFilename in @('student_learning_interaction_dataset.csv','implicit_ratings_en.csv','items_en.csv')) {
    $mlSource = Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File -Filter $mlFilename | Select-Object -First 1
    if (-not $mlSource) { throw "Missing $mlFilename in $SourceDirectory. Extract the original Kaggle ZIPs first." }
    Copy-Item -LiteralPath $mlSource.FullName -Destination (Join-Path $mlDataTarget $mlFilename)
    Get-FileHash -LiteralPath (Join-Path $mlDataTarget $mlFilename) -Algorithm SHA256 | Select-Object Hash,Path
}
Write-Host 'Dataset copies ready. Keep original archives and verify Kaggle license/provenance before redistributing.'
