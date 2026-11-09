$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$version = $manifest.version
if (-not $version) {
  throw "Version not found in manifest.json"
}

$zip = Join-Path $root ("upwork-job-tile-minimizer-{0}.zip" -f $version)
$files = @(
  "manifest.json",
  "content.js",
  "content.css",
  "icon-16.png",
  "icon-48.png",
  "icon-128.png"
)

foreach ($name in $files) {
  $path = Join-Path $root $name
  if (-not (Test-Path $path)) {
    throw "Missing required file: $name"
  }
}

if (Test-Path $zip) {
  Remove-Item $zip -Force
}

Compress-Archive -Path ($files | ForEach-Object { Join-Path $root $_ }) -DestinationPath $zip
Write-Host "Created $zip"
