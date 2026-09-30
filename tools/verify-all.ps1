# Run every Plugin Finder check in sequence.
#
#   pwsh -File tools/verify-all.ps1            # offline checks only
#   pwsh -File tools/verify-all.ps1 -Live      # also rebuild the index from the network
#
# Each check is a separate Node process, so one failure cannot hide another.
param(
  [switch]$Live,
  [string]$Node = ''
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

if (-not $Node) {
  $candidates = @(
    (Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'),
    (Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\runtime\bin\node.exe')
  )
  $Node = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $Node) { $Node = 'node' }
}

Write-Host "node: $Node" -ForegroundColor DarkGray
$failed = @()

$checks = @('selfcheck', 'preinstall', 'clientcheck')
if ($Live) { $checks += 'livecheck' }

foreach ($check in $checks) {
  Write-Host "`n===== $check =====" -ForegroundColor Cyan
  & $Node (Join-Path $root "tools\$check.mjs")
  if ($LASTEXITCODE -ne 0) { $failed += $check }
}

if ($Live) {
  Write-Host "`n===== report =====" -ForegroundColor Cyan
  & $Node (Join-Path $root 'tools\report.mjs')
  if ($LASTEXITCODE -ne 0) { $failed += 'report' }
}

Write-Host ''
if ($failed.Count -eq 0) {
  Write-Host 'ALL CHECKS PASSED' -ForegroundColor Green
  exit 0
}
Write-Host ("FAILED: " + ($failed -join ', ')) -ForegroundColor Red
exit 1
