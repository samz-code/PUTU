# Run this from your project root (C:\xampp\htdocs\PUTU_TRAVELS)
# Detects @/ import paths whose casing doesn't match the actual file on disk.

$srcRoot = "src"
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path $srcRoot

# Build a lookup of actual file paths (relative to src, no extension), case-preserved
$actualFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path $srcRoot | ForEach-Object {
    $rel = $_.FullName.Substring((Resolve-Path $srcRoot).Path.Length + 1)
    $rel = $rel -replace '\\', '/' -replace '\.tsx?$', ''
    $rel
}

$mismatches = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $importMatches = [regex]::Matches($content, "from\s+['""]@/([^'""]+)['""]")
    foreach ($m in $importMatches) {
        $importPath = $m.Groups[1].Value

        # find case-insensitive match among actual files
        $match = $actualFiles | Where-Object { $_ -ieq $importPath }

        if ($match -and $match -ne $importPath) {
            $mismatches += [PSCustomObject]@{
                File       = $file.FullName.Substring((Resolve-Path .).Path.Length + 1)
                ImportPath = $importPath
                ActualPath = $match
            }
        }
    }
}

if ($mismatches.Count -eq 0) {
    Write-Host "No casing mismatches found." -ForegroundColor Green
} else {
    Write-Host "Found $($mismatches.Count) casing mismatch(es):" -ForegroundColor Yellow
    $mismatches | Format-Table -AutoSize
}