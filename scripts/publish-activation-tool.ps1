$ErrorActionPreference = "Stop"
$projectPath = Join-Path $PSScriptRoot "..\activation-tool\TridevyatoeActivationTool\TridevyatoeActivationTool.csproj"
$outputDir = Join-Path $PSScriptRoot "..\release\activation-tool"
dotnet publish $projectPath -c Release --self-contained false -o $outputDir
if ($LASTEXITCODE -ne 0) { throw "Сборка активатора завершилась с ошибкой $LASTEXITCODE" }
Write-Host "Активатор собран: $outputDir"
