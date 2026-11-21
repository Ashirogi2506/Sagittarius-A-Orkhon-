# Sets GEMINI_API_KEY for the live site (Vercel Production) and .env.local, then redeploys.
# The key is typed hidden and never printed. Run:
#   powershell -ExecutionPolicy Bypass -File scripts\set-gemini-key.ps1
# Leave the prompt empty to reuse the key that already works in .env.local.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$npx = "C:\Program Files\nodejs\npx.cmd"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$local = ".env.local"

$secure = Read-Host "Шинэ Gemini API түлхүүрээ paste хийгээд Enter дарна уу (харагдахгүй). Хоосон бол .env.local-ийнхийг ашиглана" -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)).Trim().Trim('"').Trim("'")
if (-not $key -and (Test-Path $local)) {
  foreach ($line in Get-Content $local -Encoding UTF8) {
    if ($line -match '^\s*GEMINI_API_KEY\s*=(.*)$') { $key = $matches[1].Trim().Trim('"').Trim("'") }
  }
}
if (-not $key) { Write-Host "x Түлхүүр олдсонгүй." -ForegroundColor Red; exit 1 }

# Ask Google whether the key works before saving it anywhere.
try {
  Invoke-WebRequest -UseBasicParsing -Uri "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1" -Headers @{ "x-goog-api-key" = $key } | Out-Null
  Write-Host "OK  Google түлхүүрийг зөвшөөрлөө" -ForegroundColor Green
} catch {
  $code = $null; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  Write-Host "x   Google түлхүүрийг татгалзлаа (HTTP $code). AI Studio-оос шинэ түлхүүр үүсгээд дахин ажиллуулна уу." -ForegroundColor Red
  exit 1
}

$ErrorActionPreference = "Continue"   # Vercel CLI writes progress to stderr
& $npx --yes vercel env rm GEMINI_API_KEY production --yes *> $null
$key | & $npx --yes vercel env add GEMINI_API_KEY production *> $null
if ($LASTEXITCODE -ne 0) { Write-Host "x   Vercel-д хадгалж чадсангүй" -ForegroundColor Red; exit 1 }
Write-Host "OK  Vercel (Production) шинэчлэгдлээ" -ForegroundColor Green

# Keep the local dev server on the same key.
$lines = @(); $found = $false
if (Test-Path $local) {
  foreach ($line in Get-Content $local -Encoding UTF8) {
    if ($line -match '^\s*GEMINI_API_KEY\s*=') { $lines += "GEMINI_API_KEY=$key"; $found = $true } else { $lines += $line }
  }
}
if (-not $found) { $lines += "GEMINI_API_KEY=$key" }
[IO.File]::WriteAllLines((Join-Path (Get-Location) $local), $lines, (New-Object Text.UTF8Encoding $false))
Write-Host "OK  .env.local шинэчлэгдлээ" -ForegroundColor Green
$key = $null

Write-Host "Сайтыг дахин байршуулж байна (1 минут орчим)..." -ForegroundColor Cyan
& $npx --yes vercel deploy --prod --yes
Write-Host ""
Write-Host "Дууслаа. Claude-д 'Done' гэж хэлнэ үү." -ForegroundColor Cyan
