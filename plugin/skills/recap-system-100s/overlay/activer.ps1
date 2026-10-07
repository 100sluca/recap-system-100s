# Allume ou éteint l'overlay du mode recap-system-100s sur l'écran de Windows.
#
#   activer.ps1          lance l'overlay et le relance à chaque ouverture de session Windows
#   activer.ps1 -Off     l'arrête et le retire du démarrage
#
# overlay.ps1 est d'abord recopié dans %USERPROFILE%\.claude\recap-system-100s\overlay\ : un
# chemin qui ne change pas quand le plugin est mis à jour, pour le raccourci de démarrage.
# Le relancement passe par un raccourci dans le dossier Démarrage de l'utilisateur
# (shell:startup) : rien dans le registre, rien pour les autres comptes.
# Fichier en UTF-8 avec BOM : Windows PowerShell 5.1 lit les accents de travers sans lui.

param([switch]$Off)

# Les messages en UTF-8 : activer.mjs les relit ainsi.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ici = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path $env:USERPROFILE '.claude\recap-system-100s\overlay'
$overlay = Join-Path $dest 'overlay.ps1'
$raccourci = Join-Path ([Environment]::GetFolderPath('Startup')) 'recap-system-100s overlay.lnk'
$powershell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$overlay`""

# L'overlay déjà lancé, s'il y en a un (ancien emplacement compris).
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*recap-system-100s*overlay.ps1*' -and $_.CommandLine -notlike '*-Capture*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

if ($Off) {
  if (Test-Path $raccourci) { Remove-Item $raccourci -Force }
  'Overlay arrêté, et retiré du démarrage de Windows.'
  return
}

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Join-Path $ici 'overlay.ps1') $overlay -Force

Start-Process -FilePath $powershell -ArgumentList $arguments -WindowStyle Hidden
$coquille = New-Object -ComObject WScript.Shell
$lien = $coquille.CreateShortcut($raccourci)
$lien.TargetPath = $powershell
$lien.Arguments = $arguments
$lien.WindowStyle = 7
$lien.Description = 'Overlay du mode recap-system-100s'
$lien.Save()
"Overlay lancé. Il revient à chaque ouverture de session Windows (raccourci : $raccourci)."
