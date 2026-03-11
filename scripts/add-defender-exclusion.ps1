# Add Windows Defender exclusion for project folder
# Run as Administrator: Right-click PowerShell -> Run as administrator, then:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\add-defender-exclusion.ps1

$projectPath = "$PSScriptRoot\.."
$resolvedPath = Resolve-Path $projectPath -ErrorAction SilentlyContinue

if (-not $resolvedPath) {
    Write-Host "Error: Could not resolve project path: $projectPath" -ForegroundColor Red
    exit 1
}

$path = $resolvedPath.Path

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script must be run as Administrator." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as administrator', then run:" -ForegroundColor Yellow
    Write-Host "  cd '$path'" -ForegroundColor Cyan
    Write-Host "  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass" -ForegroundColor Cyan
    Write-Host "  .\scripts\add-defender-exclusion.ps1" -ForegroundColor Cyan
    exit 1
}

try {
    Add-MpPreference -ExclusionPath $path
    Write-Host "Success: Added '$path' to Windows Defender exclusions." -ForegroundColor Green
    Write-Host "You can now run: npm run dev" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
