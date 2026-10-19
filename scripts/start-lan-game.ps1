$ErrorActionPreference = "Stop"

$projectPath = "C:\Users\ADMIN\OneDrive\Learn\connector"
$lanPort = 3100

if (-not (Test-Path -LiteralPath $projectPath)) {
    throw "Game folder not found: $projectPath"
}

$lanAddress = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|Docker|Tailscale|Bluetooth"
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

Set-Location -LiteralPath $projectPath

Write-Host ""
Write-Host "Hridhaan's Maths & Science Adventure is starting..." -ForegroundColor Cyan
if ($lanAddress) {
    Write-Host "Open this on a phone connected to the same Wi-Fi:" -ForegroundColor Yellow
    Write-Host "http://$lanAddress`:$lanPort" -ForegroundColor Green
} else {
    Write-Host "Could not find a Wi-Fi address automatically. Run ipconfig to find your IPv4 address." -ForegroundColor Yellow
}
Write-Host "Keep this window open while playing. Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

node .\scripts\lan-server.mjs $lanPort
