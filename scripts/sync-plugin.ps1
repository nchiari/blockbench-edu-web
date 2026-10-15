$ErrorActionPreference = 'Stop'
$eduRoot = Split-Path -Parent $PSScriptRoot
$eduSource = Join-Path $eduRoot 'blockbench_edu.js'
$eduDestination = Join-Path $env:APPDATA 'Blockbench/plugins/blockbench_edu.js'
if (-not (Test-Path -LiteralPath (Split-Path -Parent $eduDestination))) {
    throw 'No se encontró la carpeta de plugins de Blockbench.'
}
Copy-Item -LiteralPath $eduSource -Destination $eduDestination
function Get-EduHash([string]$eduPath) {
    $eduHasher = [System.Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($eduHasher.ComputeHash([IO.File]::ReadAllBytes($eduPath))) }
    finally { $eduHasher.Dispose() }
}
if ((Get-EduHash $eduSource) -ne (Get-EduHash $eduDestination)) {
    throw 'Las copias del plugin no coinciden.'
}
Write-Output 'Plugin sincronizado y hashes verificados.'
