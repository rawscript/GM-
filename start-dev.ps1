# Start GM Frontend Vite dev server proxying to port 8083
Set-Location -Path $PSScriptRoot
$env:GM_PLATFORM_URL = 'http://127.0.0.1:8083'
Write-Host "Starting Vite dev server (proxying /api to http://127.0.0.1:8083)..." -ForegroundColor Cyan
npm run dev
