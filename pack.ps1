$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$zip = Join-Path $root "upwork-job-tile-minimizer.zip"
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
