$ErrorActionPreference = "Stop"

Get-ChildItem "issues\HOB-*.md" | ForEach-Object {
  $file = $_.FullName
  $content = Get-Content $file -Raw

  if ($content -notmatch "\*\*Title:\*\*\s*(.+)") {
    Write-Host "❌ Missing Title in $file" -ForegroundColor Red
    return
  }

  $title = $Matches[1].Trim()

  Write-Host "🚀 Creating issue: $title"

  gh issue create `
    --title $title `
    --body-file $file `
    --label "ui,shadcn,migration"
}
