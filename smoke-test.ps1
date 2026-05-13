$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$baseUrl = "http://localhost:5000"
$imgPath = Join-Path $PSScriptRoot "backend\public\images\pets\pet1.jpg"

Write-Host "== Smoke test API Pets ==" -ForegroundColor Cyan
Write-Host "BaseUrl: $baseUrl"

if (!(Test-Path $imgPath)) {
  throw "Imagem de teste não encontrada em: $imgPath"
}

function Invoke-JsonPost($url, $body) {
  return Invoke-RestMethod -Method Post -Uri $url -ContentType "application/json" -Body ($body | ConvertTo-Json -Depth 10)
}

function Ensure-ServerUp() {
  try {
    Invoke-RestMethod -Method Get -Uri "$baseUrl/pets" | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (-not (Ensure-ServerUp)) {
  Write-Host "Servidor não respondeu em $baseUrl. Suba o backend primeiro (npm run dev em backend/)." -ForegroundColor Yellow
  exit 1
}

$rand = Get-Random -Minimum 1000 -Maximum 9999

$user1 = @{
  name = "User1"
  email = "user1_$rand@email.com"
  phone = "11999990001"
  password = "123456"
  confirmpassword = "123456"
}

$user2 = @{
  name = "User2"
  email = "user2_$rand@email.com"
  phone = "11999990002"
  password = "123456"
  confirmpassword = "123456"
}

Write-Host "`n[1] Register user1" -ForegroundColor Green
Invoke-JsonPost "$baseUrl/users/register" $user1 | Out-Null

Write-Host "[2] Login user1" -ForegroundColor Green
$login1 = Invoke-JsonPost "$baseUrl/users/login" @{ email = $user1.email; password = $user1.password }
$token1 = $login1.token
if (-not $token1) { throw "Falha ao obter token do user1." }

Write-Host "[3] Create pet (multipart + upload)" -ForegroundColor Green
$createOut = & curl.exe `
  -s `
  -X POST "$baseUrl/pets/create" `
  -H "Authorization: Bearer $token1" `
  -F "name=Rex_$rand" `
  -F "age=2" `
  -F "weight=10" `
  -F "color=Caramelo" `
  -F ("images=@" + $imgPath)

$createJson = $createOut | ConvertFrom-Json
$petId = $createJson.pet._id
if (-not $petId) { throw "Falha ao criar pet. Resposta: $createOut" }
Write-Host "Pet criado: $petId"

Write-Host "[4] GET /pets" -ForegroundColor Green
$all = Invoke-RestMethod -Method Get -Uri "$baseUrl/pets"
Write-Host ("Total pets: " + $all.Count)

Write-Host "`n[5] Register user2 + Login" -ForegroundColor Green
Invoke-JsonPost "$baseUrl/users/register" $user2 | Out-Null
$login2 = Invoke-JsonPost "$baseUrl/users/login" @{ email = $user2.email; password = $user2.password }
$token2 = $login2.token
if (-not $token2) { throw "Falha ao obter token do user2." }

Write-Host "[6] Schedule adoption (user2)" -ForegroundColor Green
$sched = Invoke-RestMethod -Method Patch -Uri "$baseUrl/pets/schedule/$petId" -Headers @{ Authorization = "Bearer $token2" }
Write-Host $sched.message

Write-Host "[7] Conclude adoption (owner user1)" -ForegroundColor Green
$concl = Invoke-RestMethod -Method Patch -Uri "$baseUrl/pets/conclude/$petId" -Headers @{ Authorization = "Bearer $token1" }
Write-Host $concl.message

Write-Host "`nOK: fluxo básico (JWT + upload + CRUD + adoção) passou." -ForegroundColor Cyan
