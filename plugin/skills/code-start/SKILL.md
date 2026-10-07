---
name: code-start
description: "Crée ou met à jour le duo « fiche mémo (.txt) + lanceur » d'un projet de code (lanceur .bat sous Windows, .command sous macOS, .sh sous Linux), dans __recap-system-100s/1-demarrer/ du projet et, si l'utilisateur a réglé un dossier des fiches, dans une copie <projet>-<AAAA_MM_JJ> de ce dossier, pour retrouver d'un coup d'œil où est rangé chaque composant, quoi lancer et sur quel port, où c'est hébergé, la dernière mise à jour et les prochaines idées. Utiliser ce skill dès que l'utilisateur parle de lanceur, de .bat, de fiche projet, de readme court, de « garder une trace », de démarrer un projet en un clic, de /recap-system-100s -sc, ou dès qu'un projet vient d'être créé ou vient de recevoir une mise à jour notable (refonte, nouveau module, idée à noter), même s'il ne demande pas explicitement la fiche."
---

# code-start : fiche mémo + lanceur d'un projet

## Pourquoi

On mène plusieurs projets de code en parallèle et on revient dessus après des semaines. À
chaque retour, les mêmes questions : où est le code, qu'est-ce qui se lance (« back + front ? ou
que front ? »), sur quel port, où c'est hébergé, qu'est-ce qui a été fait en dernier, qu'est-ce
qui était prévu ensuite.

La réponse tient sur un écran : une **fiche** de quelques lignes et un **lanceur** à
double-cliquer. Ce skill produit ce duo et le tient à jour. Le but est la trace, pas la
documentation : tout ce qui dépasse une vingtaine de lignes a sa place dans le README du dépôt,
pas ici.

## Emplacement et nommage

- **Dans le projet** : `__recap-system-100s/1-demarrer/` (le dossier du récap, skill
  `recap-system-100s`). C'est la version de référence, elle suit le projet.
- **Une copie pour le double-clic**, si l'utilisateur a réglé un dossier des fiches (réglage
  `fiches`, lu par `node "${CLAUDE_SKILL_DIR}/../recap-system-100s/reglages.mjs"`) : un
  sous-dossier par projet, `<nom-projet>-<AAAA_MM_JJ>`, la date étant celle de la **création du
  sous-dossier**. Nom court, minuscules, tirets. Regarder d'abord s'il existe déjà (même préfixe,
  autre date) : travailler dedans, ne jamais en créer un second ; sa date ne change pas.
- Deux fichiers et rien d'autre, aux deux endroits, à l'identique :
  - `<nom-projet> - readme.txt` : la fiche ;
  - le lanceur, selon le système de l'utilisateur : `<nom-projet> - demarrer.bat` (Windows),
    `<nom-projet> - demarrer.command` (macOS, s'ouvre d'un double-clic dans le Finder) ou
    `<nom-projet> - demarrer.sh` (Linux).
- Le tableau de bord du récap signale une copie qui diffère de la fiche du projet.
- Sous Windows, depuis une session ouverte dans un dépôt, le shell peut refuser d'écrire hors du
  dépôt (« Permission denied » sur `cat >` ou `Out-File`). Utiliser l'outil d'écriture de
  fichiers, qui passe.

## Étape 1 : inventaire

Avant d'écrire quoi que ce soit, rassembler dans le dépôt :

- **Les commandes de démarrage** : scripts de `package.json`, `docker-compose.yml`, `Makefile`,
  `.claude/launch.json`, section « lancer en local » du README.
- **Ce qui tourne en local et ce qui est hébergé.** Un projet sur Supabase, Firebase ou une API
  tierce n'a pas de back à lancer : l'écrire noir sur blanc dans la fiche, c'est précisément la
  question qu'on se pose en revenant.
- **Les ports** : config Vite / Next / Express, `PORT` dans `.env.example`. Ports par défaut si
  rien n'est fixé (Vite 5173, Next 3000).
- **L'hébergement et l'URL publique** : `wrangler.toml`, `vercel.json`, `netlify.toml`, workflow
  de déploiement dans `.github/workflows/`, journaux de déploiement (`gh run view --log`). Si
  l'URL n'est nulle part, écrire le motif attendu suivi de « à compléter » plutôt que d'inventer
  un lien.
- **Le dépôt git** : `git remote -v`, branche courante, et si des changements ne sont pas commités
  (à savoir en revenant).
- **La dernière évolution notable** : `git log`, ROADMAP ou CHANGELOG, et ce qui vient d'être fait
  dans la conversation en cours.
- **Les prochaines idées** : ce que l'utilisateur a dit ou demandé de noter, dans la conversation
  ou en mémoire. S'il n'a rien dit, écrire « à définir » et le lui signaler dans le compte-rendu.
  Ne pas inventer de roadmap.
- **Ce que le lanceur doit vérifier** : présence de `.env`, de `node_modules`, du dossier lui-même.

## Étape 2 : la fiche `<nom-projet> - readme.txt`

Très courte : une vingtaine de lignes au plus, lisible dans n'importe quel éditeur, sans mise en
forme. Accents autorisés (UTF-8). **Aucun secret** : ni clé, ni mot de passe, ni jeton ; le `.env`
reste dans le dépôt. Dates au format `AAAA_MM_JJ`. Une ligne par information, dans cet ordre :

```
<Nom du projet>

Dossier code : <chemin absolu du dépôt ; un chemin par composant s'il y en a plusieurs>
Dépôt : <URL git> (branche <nom>)
Lancer : <nom-projet> - demarrer.<bat|command|sh>  (= <la commande réelle, ex. npm run dev dans <dossier>>)

Front : <port> (<techno>, http://localhost:<port>)
Back : <port> (<techno>)          ou bien : aucun en local (<service hébergé>)
Bdd : <techno ou service, identifiant du projet s'il est utile>
Internet : <hébergeur, mode de déploiement> + <URL publique>

Projet : <une phrase : ce que fait le projet, pour qui>
Last update : <ce qui a changé en dernier, en quelques mots>
Last update date : <AAAA_MM_JJ>
Next update : <prochaine idée notée>
À ne pas oublier : <optionnel : action en suspens, ex. un script SQL pas encore appliqué, des changements non commités>
```

Garder les libellés tels quels (« Front », « Back », « Bdd », « Internet », « Projet »,
« Last update », « Last update date », « Next update ») : on les cherche des yeux d'une fiche à
l'autre, et le tableau de bord du récap lit « Last update date ». La première ligne commence par
le nom d'usage du projet.

## Étape 3 : le lanceur

Un double-clic doit suffire, et une erreur doit rester lisible. Pour tous les systèmes :

- Vérifier le dossier, le `.env`, `node_modules` ; lancer `npm install` s'il manque. Un message
  clair vaut mieux qu'une pile d'erreurs npm.
- Ouvrir le navigateur quand le serveur est prêt : `npm run dev -- --open` pour Vite ; pour une
  autre stack, ouvrir `http://localhost:<port>` après quelques secondes.
- **Garantir le port annoncé.** Vite (et d'autres serveurs de dev) bascule en silence sur le port
  suivant si le sien est pris, souvent par un serveur lancé depuis une session Claude. La fiche
  promet alors un port faux. Vérifier le port avant de lancer (message clair avec le processus
  fautif et la commande pour l'arrêter), puis lancer Vite avec `--port <port> --strictPort` pour
  qu'il s'arrête au lieu de changer de port.
- La fenêtre reste ouverte à la fin, pour qu'une erreur reste lisible.
- Jamais de secret dans le lanceur : il lit le `.env` du dépôt, il ne le remplace pas.

### Windows : `.bat`

- **Sans accents.** `cmd.exe` lit les fichiers batch dans la page de code OEM, pas en UTF-8 : un
  accent devient du bruit, et un BOM casse la première ligne. Le dire en commentaire dans le
  fichier pour que personne ne les remette.
- `cd /d "<chemin>"` : le `/d` change aussi de lecteur.
- `call npm ...` (idem `npx`, `yarn`, `pnpm`) : ce sont des scripts `.cmd`, sans `call` le batch
  s'arrête après eux et le `pause` final ne s'exécute jamais.
- Port pris : `netstat -ano | findstr ":<port> .*LISTENING"`, puis `taskkill /PID … /T /F`.
- `pause` en fin de fichier.

```bat
@echo off
setlocal
title <Nom du projet> - serveur de dev

rem Demarre <nom du projet> en local : <ce qui est lance>.
rem <Ce qui est heberge et n'a donc pas a etre lance ici>.
rem Fichier volontairement sans accents : cmd.exe ne lit pas l'UTF-8 par defaut.

set "APP=<chemin absolu du composant>"

if not exist "%APP%\package.json" (
    echo [ERREUR] Dossier de l'application introuvable : %APP%
    pause
    exit /b 1
)

cd /d "%APP%"

if not exist ".env" (
    echo [ERREUR] Pas de fichier .env dans %APP%
    echo          Copier .env.example en .env et le renseigner.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Dependances absentes, installation : npm install
    call npm install
    if errorlevel 1 (
        echo [ERREUR] npm install a echoue.
        pause
        exit /b 1
    )
)

echo.
echo  <Nom du projet> - http://localhost:<port>
echo  Ctrl+C dans cette fenetre pour arreter le serveur.
echo.

call npm run dev -- --open

echo.
echo Serveur arrete.
pause
endlocal
```

Plusieurs composants locaux (un back et un front, par exemple) : une fenêtre par composant, le
back d'abord. `start` accepte `/D` pour le dossier de travail :

```bat
start "Back - <nom>" /D "%BACK%" cmd /k npm run dev
timeout /t 3 >nul
start "Front - <nom>" /D "%FRONT%" cmd /k npm run dev -- --open
```

### macOS `.command` et Linux `.sh`

Un script bash, rendu exécutable (`chmod +x`). Sous macOS, l'extension `.command` l'ouvre dans le
Terminal d'un double-clic. Port pris : `lsof -nP -iTCP:<port> -sTCP:LISTEN`, puis `kill <PID>`.

```bash
#!/usr/bin/env bash
# Demarre <nom du projet> en local : <ce qui est lance>.
# <Ce qui est heberge et n'a donc pas a etre lance ici>.
APP="<chemin absolu du composant>"
fin() { echo; read -n 1 -s -r -p "Touche pour fermer"; echo; exit "${1:-0}"; }

[ -f "$APP/package.json" ] || { echo "[ERREUR] Dossier de l'application introuvable : $APP"; fin 1; }
cd "$APP" || fin 1
[ -f .env ] || { echo "[ERREUR] Pas de .env dans $APP : copier .env.example en .env et le renseigner."; fin 1; }
if lsof -nP -iTCP:<port> -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[ERREUR] Le port <port> est pris :"; lsof -nP -iTCP:<port> -sTCP:LISTEN; echo "Arreter ce processus (kill <PID>), puis relancer."; fin 1
fi
[ -d node_modules ] || { echo "Dependances absentes : npm install"; npm install || fin 1; }

echo; echo " <Nom du projet> - http://localhost:<port>"; echo " Ctrl+C pour arreter le serveur."; echo
npm run dev -- --port <port> --strictPort --open
fin 0
```

Plusieurs composants : lancer le back en arrière-plan (`npm run dev &`, son PID dans une
variable, `trap "kill $PID" EXIT`), puis le front au premier plan.

## Étape 4 : tester le lanceur

Un lanceur non testé est une promesse. Le lancer une quinzaine de secondes, sans ouvrir d'onglet
chez l'utilisateur, lire la sortie, puis arrêter ce qu'il a lancé.

Windows (PowerShell) :

```powershell
$env:BROWSER = 'none'   # Vite respecte cette variable : pas d'onglet pendant le test
$p = Start-Process cmd.exe -ArgumentList '/c', '"<chemin complet du .bat>"' `
     -RedirectStandardOutput out.log -RedirectStandardError err.log -NoNewWindow -PassThru
Start-Sleep -Seconds 15
Get-Content out.log
taskkill /PID $p.Id /T /F
```

macOS et Linux : `BROWSER=none timeout 15 bash "<chemin du lanceur>" < /dev/null` (sous macOS
sans `timeout`, `gtimeout` de coreutils, ou lancer en arrière-plan puis `kill` après 15 s).

Attendu dans la sortie : les messages du lanceur, puis « ready » ou « listening » avec le port.
Vérifier ensuite qu'aucun port ne reste occupé. Si un serveur de dev tournait déjà depuis la
session, Vite bascule sur le port suivant : ce n'est pas un défaut du lanceur, mais le dire dans
le compte-rendu.

## Étape 5 : la copie pour le double-clic

Si le réglage `fiches` existe, recopier la fiche et le lanceur à l'identique dans
`<fiches>/<nom-projet>-<AAAA_MM_JJ>/` (le rendre exécutable aussi hors Windows).

## Étape 6 : compte-rendu

Donner les chemins des fichiers, dire s'ils ont été créés ou mis à jour, lister ce qui est marqué
« à compléter » ou « à définir » dans la fiche, et rappeler en une ligne ce qui se lance (et ce
qui ne se lance pas parce que c'est hébergé).

## Mise à jour d'un projet existant

Après une évolution notable (refonte, nouveau module, nouvelle idée notée) :

1. Rouvrir la fiche existante, ne pas la réécrire de zéro.
2. Remplacer l'ancien « Last update » (la trace historique vit dans git), écrire le nouveau et sa
   date.
3. Mettre à jour « Next update » avec ce que l'utilisateur a dit, et « À ne pas oublier » si une
   action en suspens a été réglée ou ajoutée.
4. Vérifier que le lanceur marche toujours : les ports et scripts changent parfois avec une
   refonte. Retester (étape 4) si un doute existe.
5. Recopier les deux fichiers à l'identique là où ils ont une copie.
