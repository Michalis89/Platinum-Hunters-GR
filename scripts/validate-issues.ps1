$ErrorActionPreference = "Stop"
$failed = $false

Write-Host "🔎 Validating issue files..." -ForegroundColor Cyan

Get-ChildItem "issues\HOB-*.md" | Sort-Object Name | ForEach-Object {
  $file = $_.FullName
  $name = $_.BaseName # HOB-37
  $content = Get-Content $file -Raw

  Write-Host "• $($_.Name)"

  # 1) Title
  if ($content -notmatch "\*\*Title:\*\*\s*(HOB-\d+):") {
    Write-Host "  ❌ Missing or invalid **Title:**" -ForegroundColor Red
    $failed = $true
    return
  }

  $titleId = $Matches[1]

  # 2) ID field
  if ($content -notmatch "- \*\*ID:\*\*\s*(HOB-\d+)") {
    Write-Host "  ❌ Missing or invalid **ID:** field" -ForegroundColor Red
    $failed = $true
    return
  }

  $idField = $Matches[1]

  # 3) Filename vs ID
  if ($name -ne $idField) {
    Write-Host "  ❌ Filename ($name) does not match ID ($idField)" -ForegroundColor Red
    $failed = $true
  }

  # 4) Title vs ID
  if ($titleId -ne $idField) {
    Write-Host "  ❌ Title ID ($titleId) does not match ID field ($idField)" -ForegroundColor Red
    $failed = $true
  }

  # 5) Required sections
  $requiredSections = @(
    "## Goal",
    "## Affected Path",
    "## Scope",
    "## Acceptance Criteria"
  )

  foreach ($section in $requiredSections) {
    if ($content -notmatch [regex]::Escape($section)) {
      Write-Host "  ❌ Missing section: $section" -ForegroundColor Red
      $failed = $true
    }
  }

  # 6) Emoji / smart-quote guard
  if ($content -match "[\u2018\u2019\u201C\u201D]") {
    Write-Host "  ❌ Smart quotes detected (encoding risk)" -ForegroundColor Red
    $failed = $true
  }

  if ($content -match "[\p{So}\p{Cs}]") {
    Write-Host "  ❌ Emoji or non-ASCII symbols detected" -ForegroundColor Red
    $failed = $true
  }
}

if ($failed) {
  Write-Host "`n❌ Issue validation FAILED" -ForegroundColor Red
  exit 1
}

Write-Host "`n✅ All issues valid" -ForegroundColor Green
