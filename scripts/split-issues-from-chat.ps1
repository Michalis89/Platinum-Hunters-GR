param (
  [Parameter(Mandatory = $true)]
  [string]$InputFile
)

if (!(Test-Path $InputFile)) {
  Write-Error "Input file not found: $InputFile"
  exit 1
}

$lines = Get-Content $InputFile
$currentFile = $null
$buffer = @()

foreach ($line in $lines) {
  if ($line -match '^# File:\s*(issues\/HOB-\d+\.md)') {
    if ($currentFile) {
      $outPath = $currentFile -replace '/', '\'
      New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
      $buffer | Set-Content $outPath -Encoding UTF8
      Write-Host "Created $outPath"
    }

    $currentFile = $Matches[1]
    $buffer = @()
  }
  else {
    if ($currentFile) {
      $buffer += $line
    }
  }
}

# flush last file
if ($currentFile) {
  $outPath = $currentFile -replace '/', '\'
  New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
  $buffer | Set-Content $outPath -Encoding UTF8
  Write-Host "Created $outPath"
}
