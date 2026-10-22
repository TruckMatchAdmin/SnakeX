# ==============================================================================
# SnakeX — Script de Déploiement Automatisé sur VPS OVH (Ubuntu 26.04)
# ==============================================================================

param(
    [string]$VpsHost = "152.228.137.4",
    [string]$VpsUser = "ubuntu",
    [string]$RemoteDir = "/var/www/snakex"
)

$ErrorActionPreference = "Stop"

Write-Host ">>> [SnakeX] Début du déploiement vers le VPS OVH..." -ForegroundColor Cyan

# 1. Compilation locale
Write-Host ">>> 1. Compilation des packages locaux..." -ForegroundColor Yellow
npm run build:shared
npm run build:server

# 2. Préparation du répertoire de déploiement
Write-Host ">>> 2. Préparation des fichiers de production..." -ForegroundColor Yellow
$deployDir = "$PSScriptRoot\..\bundle-deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

Copy-Item -Path "package.json" -Destination $deployDir
Copy-Item -Path ".env.local" -Destination "$deployDir\.env" -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path "$deployDir\packages\shared" -Force | Out-Null
Copy-Item -Path "packages\shared\package.json" -Destination "$deployDir\packages\shared"
Copy-Item -Path "packages\shared\dist" -Destination "$deployDir\packages\shared\dist" -Recurse

New-Item -ItemType Directory -Path "$deployDir\services\game-server" -Force | Out-Null
Copy-Item -Path "services\game-server\package.json" -Destination "$deployDir\services\game-server"
Copy-Item -Path "services\game-server\dist" -Destination "$deployDir\services\game-server\dist" -Recurse

# 3. Synchronisation instantanée vers le VPS OVH via flux tar
Write-Host ">>> 3. Transfert vers le VPS ($RemoteDir)..." -ForegroundColor Yellow
tar -czf - -C "$deployDir" . | ssh "$VpsUser@$VpsHost" "mkdir -p $RemoteDir && tar -xzf - -C $RemoteDir"

# 4. Installation & Démarrage sur le VPS
Write-Host ">>> 4. Installation dépendances & démarrage PM2..." -ForegroundColor Yellow
$cmd = "cd $RemoteDir && npm install --omit=dev && cd services/game-server && (pm2 restart snakex-server || pm2 start dist/index.js --name snakex-server --time) && pm2 save && pm2 status"
ssh "$VpsUser@$VpsHost" "$cmd"

# 5. Vérification
Write-Host ">>> 5. Test de santé HTTP sur le VPS..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$health = ssh "$VpsUser@$VpsHost" "curl -s http://localhost:3001/health"
Write-Host "Réponse du serveur OVH :`n$health" -ForegroundColor Green

# Nettoyage
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }

Write-Host ">>> [SnakeX] Déploiement terminé avec succès !" -ForegroundColor Green
