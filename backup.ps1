# Script de Respaldo Local para Google Drive (Disco G:) - Versión de Sobrescritura

$zipName = "Respaldo_Colegio.zip"
$destinationPath = "G:\Mi unidad\Escuela"
$tempZip = ".\$zipName"

# Verificar si la carpeta destino existe, si no, crearla
if (!(Test-Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath -Force
}

Write-Host "Iniciando empaquetado del proyecto: $zipName..." -ForegroundColor Cyan

# Comprimir el proyecto actual excluyendo carpetas pesadas
# Usamos un filtro para excluir lo innecesario
Get-ChildItem -Path . -Exclude "node_modules", ".git", ".wrangler", "dist", ".gemini", "reports", "public" | 
    Compress-Archive -DestinationPath $tempZip -Force

Write-Host "Sincronizando con Google Drive ($destinationPath)..." -ForegroundColor Yellow

# Mover el ZIP a Google Drive (Sobrescribe el anterior)
Move-Item -Path $tempZip -Destination "$destinationPath\$zipName" -Force

Write-Host "¡Sincronización con Drive completada con éxito!" -ForegroundColor Green
Write-Host "Archivo actualizado en: $destinationPath\$zipName"
