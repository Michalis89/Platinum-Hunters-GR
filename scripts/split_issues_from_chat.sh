#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-generated_issues.txt}"

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "❌ Input file not found: $INPUT_FILE"
  echo "Usage: $0 generated_issues.txt"
  exit 1
fi

mkdir -p issues

# Split file by lines starting with "# File: issues/....md"
# Each section becomes its own file in ./issues/
awk '
  BEGIN {
    out=""
  }
  /^# File: issues\// {
    # close previous file
    if (out != "") close(out)

    # parse filename after "# File: "
    out=$3

    # Normalize to local path (strip "issues/")
    sub(/^issues\//, "", out)

    # Prepend output directory
    out="issues/" out

    # Start writing new file (truncate)
    print "" > out
    next
  }
  {
    if (out != "") print $0 >> out
  }
' "$INPUT_FILE"

echo "✅ Split complete. Created files:"
ls -1 issues/HOB-*.md 2>/dev/null || echo "(No HOB-*.md files found)"
