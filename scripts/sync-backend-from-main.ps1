$ErrorActionPreference = "Stop"

# Sync backend + required monorepo packages into:
#   D:\Tempwallets-mobile\server\
#
# Source monorepo on your machine (current structure):
#   D:\Tempwallets.com-main\Tempwallets.com-main\

$mobileRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileRoot = Split-Path -Parent $mobileRoot  # go up from scripts/ to project root

$sourceRoot = "D:\Tempwallets.com-main\Tempwallets.com-main"
$destRoot = Join-Path $mobileRoot "server"

Write-Host "Mobile root: $mobileRoot"
Write-Host "Source root: $sourceRoot"
Write-Host "Dest root  : $destRoot"

if (!(Test-Path $sourceRoot)) {
  throw "Source monorepo not found at: $sourceRoot"
}

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

function Mirror-Folder($src, $dst, $excludeDirs = @("node_modules","dist",".next",".turbo","coverage",".git")) {
  if (!(Test-Path $src)) {
    throw "Missing source folder: $src"
  }
  New-Item -ItemType Directory -Force -Path $dst | Out-Null

  $xd = @()
  foreach ($d in $excludeDirs) { $xd += @("/XD", $d) }

  # /MIR mirrors directory tree, /R:1 retry once, /W:1 wait 1s
  $args = @($src, $dst, "/MIR", "/R:1", "/W:1") + $xd
  & robocopy @args | Out-Null
}

Write-Host "Syncing monorepo root files..."
Copy-Item -Force (Join-Path $sourceRoot "package.json") (Join-Path $destRoot "package.json")
Copy-Item -Force (Join-Path $sourceRoot "pnpm-lock.yaml") (Join-Path $destRoot "pnpm-lock.yaml")
Copy-Item -Force (Join-Path $sourceRoot "pnpm-workspace.yaml") (Join-Path $destRoot "pnpm-workspace.yaml")
Copy-Item -Force (Join-Path $sourceRoot "turbo.json") (Join-Path $destRoot "turbo.json")

Write-Host "Syncing backend app..."
Mirror-Folder (Join-Path $sourceRoot "apps\\backend") (Join-Path $destRoot "apps\\backend")

Write-Host "Syncing shared packages required by backend..."
Mirror-Folder (Join-Path $sourceRoot "packages\\types") (Join-Path $destRoot "packages\\types")
Mirror-Folder (Join-Path $sourceRoot "packages\\typescript-config") (Join-Path $destRoot "packages\\typescript-config")

Write-Host ""
Write-Host "Done."
Write-Host "Backend is now available at:"
Write-Host "  $destRoot\\apps\\backend"
Write-Host ""
Write-Host "Next: commit/push this repo, then deploy from Railway with root directory = server"

