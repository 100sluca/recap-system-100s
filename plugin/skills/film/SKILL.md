---
name: film
description: "Fait la vidéo de présentation d'un projet en motion design (Remotion, en 2D et en 3D avec Three.js), dans la DA du projet (sinon la charte par défaut du système), calée sur une musique de la banque-son de l'utilisateur ou un fichier qu'il donne, avec des bruitages, et la range dans __recap-system-100s/5-video/ du projet (v1, v2… jamais écrasées) avec son storyboard, son code et son bilan (temps par étape, appels au modèle, agents, jetons, durée du rendu). À utiliser dès que l'utilisateur demande une vidéo, un film, un teaser, une bande-annonce, du motion design, une présentation animée d'un projet ou d'un site, /recap-system-100s -video ou -v, ou veut refaire, améliorer ou mettre à jour une vidéo existante, même s'il ne dit ni « film » ni « Remotion »."
---

# film : la vidéo d'un projet, en motion design

## Pourquoi

À la fin d'un projet, on veut pouvoir le montrer : 40 à 60 secondes de motion design qui
racontent ce que fait le projet, dans sa DA, avec du mouvement en 3D, une musique et des
bruitages. Et on veut savoir ce que chaque vidéo a coûté.

## Comment c'est fait

- **Le moteur : [Remotion](https://www.remotion.dev)** (4.0.534). Une vidéo y est un composant
  React : chaque image est calculée à partir de son numéro. Remotion ouvre ce code dans un
  Chrome sans fenêtre, photographie chaque image, et son ffmpeg assemble les images et le son.
  Il télécharge lui-même ce Chrome et ce ffmpeg dans l'atelier : rien d'autre à installer que
  Node et npm.
- **La 3D : Three.js** par `@remotion/three` : vrais volumes, ombres, caméra qui vole.
- **Claude écrit l'animation** : le storyboard, puis le code de chaque scène. Aucune IA
  générative de vidéo : le même code redonne toujours la même vidéo, retouchable image par image.
- **Ce que le skill fournit**, pour ne pas repartir de zéro :
  - `modele/` : un projet Remotion prêt : `charte.ts` (couleurs, polices, grille de temps
    `t(n)`), `elements.tsx` (étiquettes, barres de surlignage, compteurs à rouleaux, logo en
    pixels, fenêtre de capture, volet de pixels), `monde/` (le kit 3D : scène papier, caméra à
    clés, cubes instanciés, pages à coins arrondis debout ou couchées, lettres 3D, chiffres en
    cubes), `Son.tsx` (musique et bruitages), un petit film de départ. Sa charte par défaut est
    celle de 100s (papier, encre, un seul orange).
  - `outils/` : `nouveau.mjs` (crée l'atelier), `capturer.mjs` (captures du vrai site),
    `tempo.mjs` (tempo de la musique), `rendre.mjs` (planches et film), `livrer.mjs` (rangement
    + bilan), `bilan.mjs` (le coût, lu dans les journaux de Claude Code), `typeface.mjs` (une
    police en lettres 3D).
  - `references/` : la charte par défaut en mouvement, les recettes 3D, le modèle de
    storyboard, les pièges connus.
  - `exemples/` : deux films réels (le site luca100s.fr : v1 en 2D, v2 en 3D), à lire pour s'en
    inspirer, pas pour les recopier.

Dans les commandes, `OUTILS` désigne `"${CLAUDE_SKILL_DIR}/outils"`.

## Où vivent les choses

- **L'atelier** (le projet Remotion d'une vidéo) : `<ateliers>/<projet>-v<N>/`, `ateliers` étant
  un réglage de l'utilisateur (par défaut `~/recap-film/`). Hors des dépôts : ses `node_modules`
  pèsent 300 Mo. Sous Windows, ni sous Documents (l'accès contrôlé aux dossiers y bloque le
  ffmpeg de Remotion) ni sous `%LOCALAPPDATA%` (l'application Claude y redirige ses écritures).
  Une fois la vidéo livrée, son code est dans `5-video/` : l'atelier peut être supprimé.
- **La livraison** : `<projet>/__recap-system-100s/5-video/` : `<projet>-vN.mp4`, plus
  `-storyboard.md`, `-source/` et `-bilan.md`. Une nouvelle version n'efface jamais la précédente.
- **Les sons** : la banque-son de l'utilisateur (réglage `banqueSon` : un dossier avec `musique/`
  et, pour les bruitages, un `bruitages.json` qui nomme ses fichiers), ou un fichier audio qu'il
  donne. Les réglages : `node "${CLAUDE_SKILL_DIR}/../recap-system-100s/reglages.mjs"`.

## Le circuit

Noter chaque étape dans le journal **au moment où elle commence** : c'est ce qui découpe le bilan.
`node OUTILS/bilan.mjs etape <atelier>/journal.jsonl "<étape>"`

1. **Préparation.** La musique d'abord : celle que l'utilisateur nomme, sinon son réglage
   `musique`. S'il n'y en a pas, `nouveau.mjs` liste les morceaux de sa banque-son ; sans
   banque-son, lui demander un fichier audio dont il a les droits (ne jamais en télécharger un),
   ou faire un film muet avec `--muet`.
   `node OUTILS/nouveau.mjs --projet <nom> --version <N> [--musique "<fichier>"] [--muet]`
   copie le modèle, les sons, installe les paquets, mesure le tempo (écrit dans
   `src/reglages.ts`) et ouvre le journal (« Préparation »). Puis lire le projet : fiche de
   `1-demarrer/`, cartes de `4-archi/`, README, le site s'il existe. Relever les vrais chiffres
   (jamais inventés).
2. **La DA du projet.** Si le projet a la sienne (variables CSS, thème Tailwind, `components.json`,
   polices du site, logo), la reporter dans `src/charte.ts` : couleurs `C`, polices `POLICE`
   (fichiers `.woff2` du projet copiés dans `public/fonts/`), et remplacer le logo de
   `elements.tsx` par celui du projet (ou son nom). Sinon garder la charte par défaut.
3. **Matière.** Captures du vrai site : `node OUTILS/capturer.mjs <url> <atelier>/public/captures . page/ … --long .`
   (chemins sans « / » initial en Git Bash). Si les chiffres doivent rester à jour, écrire
   `<atelier>/donnees.mjs` qui les relit (`export default async () => ({…})`) ; `rendre.mjs`
   l'appelle avant chaque rendu.
4. **Storyboard** (étape « Storyboard »). `<atelier>/STORYBOARD.md`, d'après
   `references/storyboard.md`. **Une histoire propre à ce projet** : ce qu'il fait vraiment, pas
   une trame recyclée d'un autre film. Du mouvement en 3D. Durée en temps de musique, coupes sur
   les mesures. Montrer à l'utilisateur le storyboard en quelques lignes et continuer sans attendre.
5. **Plans** (étape « Plans »). Écrire le film dans `src/` : `Film.tsx`, et pour la 3D une
   chorégraphie (`etat(i, f)` pour les cubes, clés de caméra) sur le modèle de
   `exemples/100s-v2/`. `NB_TEMPS` dans `reglages.ts` = durée du film. Lire
   `references/regles-100s.md` et `references/recettes-3d.md` avant d'écrire.
   Vérifier : `npx tsc` dans l'atelier.
6. **Contrôles** (étape « Contrôles »). Planche d'images clés, une par moment fort :
   `node OUTILS/rendre.mjs <atelier> --temps 2,4.5,8.5,14,22,…` → `out/planche-…/planche.png`.
   La regarder vraiment : textes lisibles et dans le cadre, rien de coupé, rien qui recouvre un
   titre, DA respectée. Corriger, refaire la planche. Le Studio (`npx remotion studio --port=3073`
   dans l'atelier) sert à l'utilisateur pour regarder et régler.
7. **Rendu** (étape « Rendu »). `node OUTILS/rendre.mjs <atelier>` → `renders/film.mp4` (durée du
   rendu notée seule dans le journal). Contrôler le MP4 : durée, son, quelques images extraites.
   Si ffmpeg est installé sur la machine, mesurer le volume (`ffmpeg -i film.mp4 -af ebur128 -f null -`,
   viser −16 à −14 LUFS).
8. **Livraison.** `node OUTILS/livrer.mjs <atelier> <racine du projet>` : range la vidéo, le
   storyboard, la source, clôt le journal et écrit le bilan. Envoyer la vidéo à l'utilisateur
   avec **le tableau du bilan dans la réponse**.

Pour un simple réglage sur une vidéo existante : rouvrir son atelier (ou le recréer depuis
`-source/`), corriger, refaire planche, rendu et livraison (nouvelle version).

## Le bilan

Toujours donné à la livraison. `bilan.mjs` lit les journaux de Claude Code
(`~/.claude/projects/…/<session>.jsonl` et les sous-agents) : pour chaque étape, la durée, le
temps actif (sans les silences de plus de 5 min), les appels au modèle, les agents, les jetons
écrits par le modèle et les jetons traités (dont les relus en cache, qui dominent car le modèle
relit la conversation à chaque appel). Plus le nombre et la durée des rendus.

Repères (bilans réels, films du site luca100s.fr) :

| Vidéo | Durée | Temps actif | Agents | Appels | Jetons traités | Rendu |
|---|--:|--:|--:|--:|--:|--:|
| v1 (2D, son) | 39 min | 33 min | 0 | 102 | 26,0 M | 35 s |
| v2 (3D, son) | 22 min | 22 min | 0 | 42 | 19,1 M | 2 × 1 min |
| v3 = v2 + retouches | 12 min | 12 min | 0 | 24 | 15,2 M | 58 s |
| v4 = le site en quatre lieux (64 s) | 14 min | 14 min | 0 | 38 | 29,7 M | 74 s |

La v2 a réutilisé ce que la v1 avait installé (charte, sons, captures) : une première vidéo
pour un nouveau projet coûte plutôt la somme des deux.

## Règles

- La DA du projet, sinon la charte par défaut (`references/regles-100s.md`) ; dans tous les cas
  ses règles de mouvement : longue traîne, jamais de rebond, tout sur la grille de la musique ;
  ni dégradé « IA », ni fond animé gratuit.
- Que du vrai : chiffres, pages, noms relevés sur le projet ou son site.
- Rien de confidentiel à l'écran : ni secret, ni donnée personnelle, ni compte privé.
- Les sons appartiennent à l'utilisateur : n'utiliser que sa banque-son ou les fichiers qu'il
  donne, jamais une musique téléchargée sans droits. Rien de payant.
- Remotion est gratuit pour une personne ou une entreprise de 3 salariés au plus : à revoir
  avant tout usage pour une entreprise plus grande.
- Ne rien commiter sans l'accord de l'utilisateur.
