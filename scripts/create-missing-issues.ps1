$ErrorActionPreference = "Stop"

Write-Host "Fetching existing issues from GitHub..."
$existingTitles = gh issue list --limit 200 --json title |
  ConvertFrom-Json |
  ForEach-Object { $_.title }

Get-ChildItem "issues\HOB-*.md" | Sort-Object Name | ForEach-Object {
  $file = $_.FullName
  $content = Get-Content $file -Raw

  if ($content -notmatch "\*\*Title:\*\*\s*(.+)") {
    Write-Host "Missing Title in $file" -ForegroundColor Red
    return
  }

  $title = $Matches[1].Trim()

  if ($existingTitles -contains $title) {
    Write-Host "Skipping existing issue: $title" -ForegroundColor Yellow
    return
  }

  Write-Host "Creating issue: $title" -ForegroundColor Green

  $args = @(
    "issue", "create",
    "--title", $title,
    "--body-file", $file,
    "--label", "ui,shadcn,migration"
  )

  gh @args
}
