# Replaces the Turso database URL + token on the live site (Vercel Production), then redeploys.
# Both prompts are hidden and accept either value in any order (URL starts with libsql://, token with eyJ).
# Run:  powershell -ExecutionPolicy Bypass -File scripts\set-turso-token.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$npx = "C:\Program Files\nodejs\npx.cmd"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Read-Hidden([string]$prompt) {
  $s = Read-Host $prompt -AsSecureString
  return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)).Trim().Trim('"').Trim("'")
}

Write-Host ""
Write-Host "Turso-гаас 2 зүйл paste хийнэ: сангийн URL (libsql://...) болон token (eyJ...)." -ForegroundColor Cyan
Write-Host "Аль нь ч дэлгэцэнд харагдахгүй. Дарааллыг андуурсан ч болно, скрипт өөрөө танина." -ForegroundColor Cyan
$url = $null; $token = $null
for ($i = 0; $i -lt 6 -and (-not $url -or -not $token); $i++) {
  $need = if (-not $url -and -not $token) { "URL эсвэл token" } elseif (-not $url) { "URL (libsql://...)" } else { "token (eyJ...)" }
  $v = Read-Hidden "$need paste хийгээд Enter"
  if ($v -match '^libsql://[A-Za-z0-9.-]+/?$') { $url = $v.TrimEnd('/'); Write-Host "OK  URL авлаа" -ForegroundColor Green }
  elseif ($v -match '^https://[A-Za-z0-9.-]+\.turso\.io/?$') { $url = ($v.TrimEnd('/') -replace '^https://', 'libsql://'); Write-Host "OK  URL авлаа" -ForegroundColor Green }
  elseif ($v -match '^eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$') { $token = $v; Write-Host "OK  token авлаа" -ForegroundColor Green }
  elseif (-not $v) { Write-Host "x   Хоосон байна, дахин paste хийнэ үү." -ForegroundColor Yellow }
  else { Write-Host "x   Энэ URL ч биш, token ч биш байна. Дахин paste хийнэ үү." -ForegroundColor Yellow }
}
if (-not $url -or -not $token) { Write-Host "x Дутуу байна. Скриптийг дахин ажиллуулна уу." -ForegroundColor Red; exit 1 }

# Ask Turso whether the token opens this database before saving it anywhere.
$http = $url -replace '^libsql://', 'https://'
$body = '{"requests":[{"type":"execute","stmt":{"sql":"SELECT 1"}},{"type":"close"}]}'
try {
  Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$http/v2/pipeline" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body | Out-Null
  Write-Host "OK  Turso token-ийг зөвшөөрлөө" -ForegroundColor Green
} catch {
  $code = $null; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  Write-Host "x   Turso татгалзлаа (HTTP $code). Token хүчинтэй эсэх, энэ сангийнх эсэхийг шалгана уу. Vercel-д юу ч өөрчлөөгүй." -ForegroundColor Red
  exit 1
}

$ErrorActionPreference = "Continue"   # Vercel CLI writes progress to stderr
foreach ($pair in @(@("TURSO_DATABASE_URL", $url), @("TURSO_AUTH_TOKEN", $token))) {
  & $npx --yes vercel env rm $pair[0] production --yes *> $null
  $pair[1] | & $npx --yes vercel env add $pair[0] production *> $null
  if ($LASTEXITCODE -ne 0) { Write-Host "x   $($pair[0]) хадгалж чадсангүй" -ForegroundColor Red; exit 1 }
  Write-Host "OK  $($pair[0]) шинэчлэгдлээ" -ForegroundColor Green
}
$token = $null

Write-Host "Сайтыг дахин байршуулж байна (1 минут орчим)..." -ForegroundColor Cyan
& $npx --yes vercel deploy --prod --yes
Write-Host ""
Write-Host "Дууслаа. Claude-д 'Done' гэж хэлнэ үү." -ForegroundColor Cyan
