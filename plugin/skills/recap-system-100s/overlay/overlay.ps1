# Overlay du mode recap-system-100s, sur l'écran de Windows.
#
# Une petite fenêtre toujours au premier plan, en haut à gauche, comme l'overlay d'un salon vocal :
# une ligne par projet en cours dans une session Claude Code, avec son nom, ses 5 barres de
# fraîcheur et la prochaine commande. Elle lit les « présences » que le bandeau de chaque session
# dépose dans %USERPROFILE%\.claude\recap-system-100s\presence\, et se cache quand aucune session
# n'est en cours.
# Pas dans %LOCALAPPDATA% : l'application Claude (paquet MSIX) le redirige vers son dossier privé,
# et un overlay lancé au démarrage de Windows ne verrait pas ce que les sessions y écrivent. Les
# anciennes versions du bandeau (0.2.0) y écrivaient : on relit aussi ces dossiers-là.
#
# Glisser pour la déplacer. La croix d'une ligne masque ce projet jusqu'à sa prochaine session ;
# la croix du titre ferme l'overlay. Clic droit : mode compact, opacité, réafficher les projets
# masqués, quitter. Survoler une barre : son détail.
#
#   overlay.ps1                      la fenêtre
#   overlay.ps1 -Capture <png>       dessine une fois dans une image, sans fenêtre (pour vérifier)
#
# Fichier en UTF-8 avec BOM : Windows PowerShell 5.1 lit les accents de travers sans lui.

param(
  [string]$Dossier = (Join-Path $env:USERPROFILE '.claude\recap-system-100s\presence'),
  [string]$Capture,
  [int]$FraicheurMinutes = 6
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$Base = Join-Path $env:USERPROFILE '.claude\recap-system-100s'
$Reglages = Join-Path $Base 'overlay.json'
$Journal = Join-Path $Base 'overlay.log'

# Les dossiers de présences : le bon, puis ceux des anciennes versions du bandeau.
$Dossiers = @($Dossier)
if (-not $PSBoundParameters.ContainsKey('Dossier') -and $env:LOCALAPPDATA) {
  $Dossiers += Join-Path $env:LOCALAPPDATA 'recap-system-100s\presence'
  $paquets = Join-Path $env:LOCALAPPDATA 'Packages'
  if (Test-Path $paquets) {
    foreach ($p in Get-ChildItem $paquets -Directory -Filter 'Claude_*' -ErrorAction SilentlyContinue) {
      $Dossiers += Join-Path $p.FullName 'LocalCache\Local\recap-system-100s\presence'
    }
  }
}

# Une seule fenêtre à la fois.
if (-not $Capture) {
  $nouvelle = $false
  $script:verrou = New-Object System.Threading.Mutex($true, 'Local\recap-system-100s-overlay', [ref]$nouvelle)
  if (-not $nouvelle) { return }
}

$reg = @{ left = 12; top = 12; compact = $false; opacite = 0.92; masques = @{} }
if (Test-Path $Reglages) {
  try {
    $lu = Get-Content $Reglages -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($k in @('left', 'top', 'compact', 'opacite')) { if ($null -ne $lu.$k) { $reg[$k] = $lu.$k } }
    if ($lu.masques) { foreach ($m in $lu.masques.PSObject.Properties) { $reg.masques[$m.Name] = [double]$m.Value } }
  } catch { }
}

function Enregistrer {
  New-Item -ItemType Directory -Force $Base | Out-Null
  ($reg | ConvertTo-Json) | Set-Content $Reglages -Encoding UTF8
}

function Noter([string]$texte) {
  try { New-Item -ItemType Directory -Force $Base | Out-Null; Add-Content $Journal "$(Get-Date -Format s) $texte" -Encoding UTF8 } catch { }
}

function Pinceau([string]$hex) {
  $b = New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.ColorConverter]::ConvertFromString($hex))
  $b.Freeze()
  $b
}

$ORANGE = Pinceau '#FF5F00'
$VERT = Pinceau '#22C55E'
$JAUNE = Pinceau '#EAB308'
$ROUGE = Pinceau '#EF4444'
$GRIS = Pinceau '#9CA3AF'
$PALE = Pinceau '#6B7280'
$FOND_BARRE = Pinceau '#3A3A3A'
$FONTE_TEXTE = New-Object System.Windows.Media.FontFamily 'Segoe UI'
$FONTE_MONO = New-Object System.Windows.Media.FontFamily 'Cascadia Mono, Consolas'

function Couleur($score) {
  if ($null -eq $score) { $PALE } elseif ($score -ge 100) { $VERT } elseif ($score -ge 60) { $JAUNE } else { $ROUGE }
}

function Cle([string]$racine) { $racine.Replace('\', '/').TrimEnd('/').ToLower() }

# Les sessions en cours : présence ni finie ni trop vieille, une par projet (la plus récente),
# sauf les projets masqués depuis le début de leur session.
function Lire-Presences {
  $maintenant = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $parProjet = @{}
  foreach ($d in $Dossiers) {
    if (-not (Test-Path $d)) { continue }
    foreach ($f in Get-ChildItem $d -Filter *.json -File) {
      try { $p = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { continue }
      if ($p.fin -or -not $p.racine) { continue }
      if (($maintenant - [double]$p.maj) -gt $FraicheurMinutes * 60000) { continue }
      $cle = Cle ([string]$p.racine)
      if (-not $parProjet.ContainsKey($cle) -or [double]$parProjet[$cle].maj -lt [double]$p.maj) { $parProjet[$cle] = $p }
    }
  }
  @($parProjet.Values | Where-Object {
      $masque = $reg.masques[(Cle ([string]$_.racine))]
      -not $masque -or [double]$_.debut -gt $masque
    } | Sort-Object { $_.nom })
}

function Texte([string]$t, [double]$taille, $pinceau, [switch]$Gras, [switch]$Mono) {
  $tb = New-Object System.Windows.Controls.TextBlock
  $tb.Text = $t
  $tb.FontSize = $taille
  $tb.Foreground = $pinceau
  $tb.FontFamily = if ($Mono) { $FONTE_MONO } else { $FONTE_TEXTE }
  if ($Gras) { $tb.FontWeight = [System.Windows.FontWeights]::SemiBold }
  $tb.VerticalAlignment = 'Center'
  $tb
}

# Une petite croix : grise, orange au survol ; le clic ne déplace pas la fenêtre.
function Croix([string]$aide, [scriptblock]$action) {
  $x = Texte '×' 14 $PALE
  $x.Margin = '8,-2,0,0'
  $x.Cursor = [System.Windows.Input.Cursors]::Hand
  $x.ToolTip = $aide
  $x.Add_MouseEnter({ $this.Foreground = $ORANGE })
  $x.Add_MouseLeave({ $this.Foreground = $PALE })
  $x.Add_MouseLeftButtonDown({ param($s, $e) $e.Handled = $true })
  $x.Add_MouseLeftButtonUp($action)
  $x
}

function Barre($piece) {
  $largeur = 30
  $g = New-Object System.Windows.Controls.Grid
  $g.Width = $largeur
  $g.Height = 6
  $g.VerticalAlignment = 'Center'
  $fond = New-Object System.Windows.Shapes.Rectangle
  $fond.RadiusX = 3; $fond.RadiusY = 3; $fond.Fill = $FOND_BARRE
  [void]$g.Children.Add($fond)
  if ($null -ne $piece.score) {
    $plein = New-Object System.Windows.Shapes.Rectangle
    $plein.RadiusX = 3; $plein.RadiusY = 3; $plein.Fill = (Couleur $piece.score)
    $plein.HorizontalAlignment = 'Left'
    $plein.Width = [math]::Max(4, $largeur * [double]$piece.score / 100)
    [void]$g.Children.Add($plein)
  }
  $g
}

function Ligne($p) {
  $colonne = New-Object System.Windows.Controls.StackPanel
  $colonne.Margin = '0,5,0,3'
  # Trois colonnes : le nom, dont la largeur est partagée par toutes les lignes, les barres, la croix.
  $haut = New-Object System.Windows.Controls.Grid
  $colNom = New-Object System.Windows.Controls.ColumnDefinition
  $colNom.Width = [System.Windows.GridLength]::Auto
  $colNom.SharedSizeGroup = 'Nom'
  [void]$haut.ColumnDefinitions.Add($colNom)
  [void]$haut.ColumnDefinitions.Add((New-Object System.Windows.Controls.ColumnDefinition))
  $colCroix = New-Object System.Windows.Controls.ColumnDefinition
  $colCroix.Width = [System.Windows.GridLength]::Auto
  [void]$haut.ColumnDefinitions.Add($colCroix)
  $tete = New-Object System.Windows.Controls.StackPanel
  $tete.Orientation = 'Horizontal'
  $nom = Texte ([string]$p.nom) 13 $ORANGE -Gras
  $nom.Margin = '5,0,14,0'
  $nom.ToolTip = [string]$p.racine
  [void]$tete.Children.Add((Texte '●' 9 $ORANGE))
  [void]$tete.Children.Add($nom)
  [void]$haut.Children.Add($tete)
  $barres = New-Object System.Windows.Controls.StackPanel
  $barres.Orientation = 'Horizontal'
  [System.Windows.Controls.Grid]::SetColumn($barres, 1)
  [void]$haut.Children.Add($barres)
  foreach ($piece in $p.pieces) {
    $bloc = New-Object System.Windows.Controls.StackPanel
    $bloc.Orientation = 'Horizontal'
    $bloc.Margin = '0,0,9,0'
    $bloc.Background = [System.Windows.Media.Brushes]::Transparent
    $numero = Texte ([string]$piece.numero) 10 $GRIS -Mono
    $numero.Margin = '0,0,3,0'
    [void]$bloc.Children.Add($numero)
    [void]$bloc.Children.Add((Barre $piece))
    $note = if ($null -eq $piece.score) { 'pas encore le moment' } else { "$($piece.score)/100" }
    $bloc.ToolTip = "$($piece.numero) · $($piece.nom) : $note`n$($piece.detail)"
    [void]$barres.Children.Add($bloc)
  }
  $cle = Cle ([string]$p.racine)
  $croix = Croix "Masquer $($p.nom) (il revient à sa prochaine session)" ({
      $reg.masques[$cle] = [double][DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
      Enregistrer
      Rafraichir -Force
    }.GetNewClosure())
  [System.Windows.Controls.Grid]::SetColumn($croix, 2)
  [void]$haut.Children.Add($croix)
  [void]$colonne.Children.Add($haut)
  if (-not $reg.compact -and $p.suite) {
    $suite = Texte ('→ ' + $p.suite.action) 11 $GRIS -Mono
    $suite.Margin = '14,2,0,0'
    [void]$colonne.Children.Add($suite)
  }
  $colonne
}

$cadre = New-Object System.Windows.Controls.Border
$cadre.CornerRadius = 10
$cadre.Padding = '12,7,12,7'
$cadre.Background = Pinceau '#E6141414'
$cadre.BorderBrush = Pinceau '#33FFFFFF'
$cadre.BorderThickness = 1
$pile = New-Object System.Windows.Controls.StackPanel
[System.Windows.Controls.Grid]::SetIsSharedSizeScope($pile, $true)
$cadre.Child = $pile

function Construire($presences) {
  $pile.Children.Clear()
  $entete = New-Object System.Windows.Controls.DockPanel
  $entete.LastChildFill = $false
  $fermer = Croix "Fermer l'overlay (il revient à la prochaine ouverture de session ; /recap-system-100s -overlay off l'éteint)" { if ($script:fen) { $script:fen.Close() } }
  [System.Windows.Controls.DockPanel]::SetDock($fermer, 'Right')
  $titre = Texte 'RECAP-SYSTEM-100S' 9 $PALE -Mono
  [void]$entete.Children.Add($fermer)
  [void]$entete.Children.Add($titre)
  [void]$pile.Children.Add($entete)
  foreach ($p in $presences) { [void]$pile.Children.Add((Ligne $p)) }
}

# Vérification : une image du rendu, sans fenêtre.
if ($Capture) {
  Construire @(Lire-Presences)
  $cadre.Measure((New-Object System.Windows.Size ([double]::PositiveInfinity), ([double]::PositiveInfinity)))
  $cadre.Arrange((New-Object System.Windows.Rect (New-Object System.Windows.Point 0, 0), $cadre.DesiredSize))
  $cadre.UpdateLayout()
  $image = New-Object System.Windows.Media.Imaging.RenderTargetBitmap ([int][math]::Ceiling($cadre.ActualWidth * 2)), ([int][math]::Ceiling($cadre.ActualHeight * 2)), 192, 192, ([System.Windows.Media.PixelFormats]::Pbgra32)
  $image.Render($cadre)
  $png = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $png.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($image))
  $flux = [System.IO.File]::Create($Capture)
  $png.Save($flux)
  $flux.Close()
  return
}

Add-Type -Namespace Recap100s -Name Fenetre -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern int GetWindowLong(System.IntPtr h, int i);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern int SetWindowLong(System.IntPtr h, int i, int v);
'@

$app = New-Object System.Windows.Application
$app.ShutdownMode = 'OnExplicitShutdown'

$script:fen = New-Object System.Windows.Window
$fen = $script:fen
$fen.Title = 'recap-system-100s'
$fen.WindowStyle = 'None'
$fen.AllowsTransparency = $true
$fen.Background = [System.Windows.Media.Brushes]::Transparent
$fen.Topmost = $true
$fen.ShowInTaskbar = $false
$fen.ShowActivated = $false
$fen.SizeToContent = 'WidthAndHeight'
$fen.ResizeMode = 'NoResize'
$fen.Left = [double]$reg.left
$fen.Top = [double]$reg.top
$fen.Opacity = [double]$reg.opacite
$fen.Content = $cadre

# Hors de Alt+Tab, et sans voler le focus à la fenêtre où l'on tape.
$fen.Add_SourceInitialized({
  $h = (New-Object System.Windows.Interop.WindowInteropHelper $fen).Handle
  $style = [Recap100s.Fenetre]::GetWindowLong($h, -20)
  [void][Recap100s.Fenetre]::SetWindowLong($h, -20, ($style -bor 0x80 -bor 0x08000000))
})

$fen.Add_MouseLeftButtonDown({
  try { $fen.DragMove() } catch { }
  $reg.left = $fen.Left
  $reg.top = $fen.Top
  Enregistrer
})

$menu = New-Object System.Windows.Controls.ContextMenu
function Choix([string]$texte, [scriptblock]$action) {
  $item = New-Object System.Windows.Controls.MenuItem
  $item.Header = $texte
  $item.Add_Click($action)
  [void]$menu.Items.Add($item)
  $item
}
$script:choixCompact = Choix 'Mode compact' { $reg.compact = -not $reg.compact; $script:choixCompact.IsChecked = $reg.compact; Enregistrer; Rafraichir -Force }
$script:choixCompact.IsChecked = [bool]$reg.compact
[void]$menu.Items.Add((New-Object System.Windows.Controls.Separator))
foreach ($o in @(1.0, 0.8, 0.6)) {
  $valeur = $o
  [void](Choix ('Opacité ' + [int]($valeur * 100) + ' %') ({ $reg.opacite = $valeur; $fen.Opacity = $valeur; Enregistrer }.GetNewClosure()))
}
[void]$menu.Items.Add((New-Object System.Windows.Controls.Separator))
[void](Choix 'Réafficher les projets masqués' { $reg.masques = @{}; Enregistrer; Rafraichir -Force })
[void](Choix "Quitter l'overlay" { $fen.Close() })
$cadre.ContextMenu = $menu

$fen.Add_Closed({ $app.Shutdown() })

$script:derniere = ''
$script:tours = 0
function Rafraichir([switch]$Force) {
  try {
    $presences = @(Lire-Presences)
    $empreinte = ($presences | ForEach-Object { "$($_.racine)|$($_.nom)|$(($_.pieces | ForEach-Object { $_.score }) -join ',')|$($_.suite.action)" }) -join ';'
    if ($Force -or $empreinte -ne $script:derniere) {
      $script:derniere = $empreinte
      Construire $presences
    }
    if ($presences.Count -eq 0) {
      if ($fen.IsVisible) { $fen.Hide() }
    } else {
      if (-not $fen.IsVisible) { $fen.Show() }
      # Toutes les 30 s, se remettre au-dessus des fenêtres qui auraient pris la place.
      $script:tours++
      if ($script:tours % 10 -eq 0) { $fen.Topmost = $false; $fen.Topmost = $true }
    }
  } catch {
    Noter "erreur : $($_.Exception.Message)"
  }
}

$minuterie = New-Object System.Windows.Threading.DispatcherTimer
$minuterie.Interval = [TimeSpan]::FromSeconds(3)
$minuterie.Add_Tick({ Rafraichir })
Rafraichir -Force
$minuterie.Start()
Noter 'overlay démarré'
[void]$app.Run()
