# Reads .env.production.local and stores its 4 values in Vercel (Production) as secrets.
# Values are never printed. Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File scripts\push-env.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$file = ".env.production.local"
$npx = "C:\Program Files\nodejs\npx.cmd"
$names = @("GEMINI_API_KEY", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "ADMIN_EMAILS")

if (-not (Test-Path $file)) { Write-Host "$file олдсонгүй." -ForegroundColor Red; exit 1 }
$vals = @{}
foreach ($line in Get-Content $file -Encoding UTF8) {
  if ($line -match '^\s*([A-Z_]+)\s*=(.*)$') { $vals[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") }
}

# Check before sending anything.
$bad = @()
foreach ($n in $names) { if (-not $vals[$n]) { $bad += "$n хоосон байна" } }
if ($vals["TURSO_DATABASE_URL"] -and $vals["TURSO_DATABASE_URL"] -notmatch '^libsql://') { $bad += "TURSO_DATABASE_URL нь libsql:// гэж эхлэх ёстой" }
if ($vals["ADMIN_EMAILS"] -and $vals["ADMIN_EMAILS"] -notmatch '@') { $bad += "ADMIN_EMAILS имэйл биш байна" }
if ($vals["GEMINI_API_KEY"] -and $vals["GEMINI_API_KEY"] -eq $vals["TURSO_AUTH_TOKEN"]) { $bad += "GEMINI_API_KEY болон TURSO_AUTH_TOKEN ижил байна" }
if ($bad.Count) { $bad | ForEach-Object { Write-Host "x $_" -ForegroundColor Red }; Write-Host "$file-ээ засаад дахин ажиллуулна уу."; exit 1 }

# The Vercel CLI writes normal progress to stderr; Windows PowerShell 5.1 would treat that as an error.
$ErrorActionPreference = "Continue"
foreach ($n in $names) {
  # Replace an older value if there is one.
  & $npx --yes vercel env rm $n production --yes *> $null
  $vals[$n] | & $npx --yes vercel env add $n production *> $null
  if ($LASTEXITCODE -eq 0) { Write-Host "OK  $n" -ForegroundColor Green } else { Write-Host "x   $n хадгалж чадсангүй" -ForegroundColor Red; exit 1 }
}
# The values now live in Vercel; blank them here so secrets don't sit in a local file.
$text = (Get-Content $file -Encoding UTF8) | ForEach-Object { if ($_ -match '^\s*([A-Z_]+)\s*=') { "$($matches[1])=" } else { $_ } }
[IO.File]::WriteAllLines((Resolve-Path $file), $text, (New-Object Text.UTF8Encoding $false))
Write-Host ""
Write-Host "Бүгд Vercel-д хадгалагдлаа (файл дахь утгуудыг цэвэрлэв). Claude-д 'Entered them' гэж хэлнэ үү." -ForegroundColor Cyan
