# ─────────────────────────────────────────────────────────────────
#  BotDesk V2 — Full restart + Cloudflare public tunnel
#  Run: .\restart-demo.ps1
# ─────────────────────────────────────────────────────────────────

Write-Host "`n[1/4] Stopping any running node processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 600

Write-Host "[2/4] Building frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\v2\client"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }

Write-Host "[3/4] Starting backend server on port 4000..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\v2\server"
$server = Start-Process -FilePath "node" -ArgumentList "src/server.js" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

$health = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($health.StatusCode -ne 200) {
    Write-Host "Server failed to start!" -ForegroundColor Red; exit 1
}
Write-Host "   Server OK" -ForegroundColor Green

Write-Host "[4/4] Opening Cloudflare public tunnel..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot"
Write-Host "`n─────────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host " Your public URL will appear below (share with friend):" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────`n" -ForegroundColor Yellow
cloudflared tunnel --url http://localhost:4000
