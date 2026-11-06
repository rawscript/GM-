# Start GM Platform Go backend on port 8083 with environment loaded
Set-Location -Path $PSScriptRoot

if (Test-Path ".env.local") {
    Get-Content ".env.local" | Where-Object { $_ -match '^\s*[^#][^=]*=' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

$env:GM_HTTP_ADDR = ':8083'
Set-Location -Path "services\platform-go"
Write-Host "Starting GM platform backend on port 8083..." -ForegroundColor Green
.\platform.exe
