$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://127.0.0.1:8787"
$ExpectedTitle = "成都小升初数学出题助手"
$Node = (Get-Command node -ErrorAction Stop).Source

Set-Location $ProjectRoot

function Test-AppRunning {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content.Contains($ExpectedTitle)
  } catch {
    return $false
  }
}

function Test-PortOccupiedByOtherApp {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -eq 200 -and -not $response.Content.Contains($ExpectedTitle)
  } catch {
    return $false
  }
}

Write-Host "Starting Chengdu Xiaoshengchu Math Question Assistant..."

if (-not (Test-AppRunning)) {
  if (Test-PortOccupiedByOtherApp) {
    Write-Host "Port 8787 is occupied by another app. Please close it or change PORT before starting."
    exit 1
  }

  Start-Process -FilePath $Node -ArgumentList "src/server.js" -WorkingDirectory $ProjectRoot -WindowStyle Hidden

  $started = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-AppRunning) {
      $started = $true
      break
    }
  }

  if (-not $started) {
    Write-Host "Startup failed. Please run npm start in this folder to view the error."
    exit 1
  }
}

Write-Host "App is running: $Url"
Start-Process $Url
