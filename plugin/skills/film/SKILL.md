---
name: film
description: "Fait la vidéo de présentation d'un projet en motion design (Remotion, en 2D et en 3D avec Three.js), dans la DA du projet ou d'un client (relevée sur son site : couleurs, polices, logo ; ou un duo client × entreprise), dans un style de motion choisi par l'utilisateur sur des aperçus (keynote, démo produit, fil conducteur, teaser, plan-séquence, et en option un court-métrage 3D), où l'on voit le produit s'utiliser, avec une caméra toujours en mouvement et du flou de mouvement, calée sur une musique de sa banque-son ou un fichier qu'il donne, avec des bruitages et, au choix, une voix off qui pitche le projet (problème, solution, comment ça marche : voix IA Gemini, ou la voix de l'utilisateur enregistrée en doublage sur le film), et la range dans __recap-system-100s/5-video/ du projet (v1, v2… jamais écrasées) avec son storyboard, son code et son bilan (temps par étape, appels au modèle, agents, jetons, durée du rendu). À utiliser dès que l'utilisateur demande une vidéo, un film, un teaser, une bande-annonce, du motion design, une présentation animée d'un projet, d'un site ou d'un produit (le sien ou celui d'un client), /recap-system-100s -video ou -v, ou veut refaire, améliorer ou changer le style ou la DA d'une vidéo existante, même s'il ne dit ni « film » ni « Remotion »."
---

# film : la vidéo d'un projet, en motion design

## Pourquoi

Pour montrer un projet (le sien ou celui d'un client) : 40 secondes à 2 minutes de motion design
qui racontent ce qu'il fait, **à ses couleurs** et **dans un style choisi pour lui**, avec une
musique, des bruitages et, au choix, **une voix off qui le pitche** (le problème, la solution,
comment ça marche, la preuve). Et savoir ce que chaque vidéo a coûté.

Deux choses distinctes se décident avant d'écrire une ligne :

- **la DA** : couleurs, polices, logo. Celle du projet, celle du client relevée sur son site, ou un
  duo client × entreprise. Il n'y a plus de charte par défaut : celle de luca100s.fr est une marque
  parmi d'autres (`marques/100s/`). → `references/da.md`
- **le style** : la grammaire du mouvement (plan-séquence ou coupes, rebond ou longue traîne, 2D ou
  3D, caméra). Sept styles, chacun avec ses règles, son kit et un aperçu vidéo. → `styles/README.md`

Le piège à éviter : tous les films qui se ressemblent (même orange, mêmes cubes, même musique).
Une DA propre, un style choisi, une histoire propre au projet, une musique différente du film d'avant.

## Comment c'est fait

- **Le moteur : [Remotion](https://www.remotion.dev)** (4.0.534). Une vidéo y est un composant
  React : chaque image est calculée à partir de son numéro. Remotion ouvre ce code dans un Chrome
  sans fenêtre, photographie chaque image, et son ffmpeg assemble les images et le son. Il télécharge
  lui-même ce Chrome et ce ffmpeg dans l'atelier : rien d'autre à installer que Node et npm.
- **La 3D : Three.js** par `@remotion/three` ; la 3D légère des styles 2D en CSS (perspective).
- **Claude écrit l'animation** : le storyboard, puis le code de chaque scène. Aucune IA générative
  de vidéo : le même code redonne toujours la même vidéo, retouchable image par image.
- **Ce que le skill fournit** :
  - `modele/` : un projet Remotion prêt. `da.json` (la DA du film, couleurs **par rôle** : fond,
    surface, encre, doux, pale, accent, surAccent, accent2, filet ; polices titre, texte, mono),
    lue par `src/da.tsx` ; `src/charte.ts` (la DA + la grille de temps `t(n)` + les courbes) ;
    `public/fonts/` (polices libres, déclarées dans `polices.json`) ; `src/elements.tsx` (éléments
    communs) ; **`src/styles/`** (un dossier par style : `kit.tsx` et `Apercu.tsx` ; `commun.tsx`
    avec `adapterDA`, `camera2D`, `prog`, `ressort`… ; `interface.tsx` : les briques des films
    produit et le flou de mouvement ; `catalogue.json`) ; `src/monde/` (le kit du
    Monde en cubes) ; `Son.tsx` (musique et bruitages ; `<Musique />` joue aussi la voix off et se
    baisse dessous) ; `Voix.tsx` + `pitch.ts` (la voix off : `p(i)`, l'image où commence la phrase
    i ; `phraseA(f)` pour des sous-titres) ; un film de départ neutre.
  - `styles/` : une fiche par style (l'idée, la DA, le mouvement, le son, le kit, une trame
    possible) et `styles/apercus/` (les aperçus livrés : `catalogue.html`, `catalogue.mp4`).
  - `marques/` : les marques livrées (`100s/` : sa DA, sa charte en mouvement, son logo en pixels).
    Les marques relevées par l'utilisateur sont rangées dans `~/.claude/recap-system-100s/marques/`.
  - `outils/` : `nouveau.mjs` (crée l'atelier, pose la DA puis la musique), `musique.mjs` (propose une musique qui va avec le style et change d'un film à l'autre), `da.mjs` (relève la DA
    d'un site, l'installe dans un atelier), `apercus.mjs` (les styles rendus dans la DA du projet,
    pour choisir), `capturer.mjs` (captures du vrai site), `tempo.mjs`, `rendre.mjs` (planches et
    film), `livrer.mjs` (rangement + bilan), `bilan.mjs`, `typeface.mjs` (une police en lettres 3D),
    `voix.mjs` (la voix off : voix IA, minutage prévu pour le doublage, import d'un enregistrement),
    `doublage.mjs` (le studio où l'utilisateur s'enregistre sur le film).
  - `references/` : `da.md`, `pitch.md`, `regles-communes.md`, `storyboard.md`, `recettes-3d.md`,
    `pieges.md`.
  - `exemples/` : les films de luca100s.fr (style Monde en cubes), à lire pour la méthode.

Dans les commandes, `OUTILS` désigne `"${CLAUDE_SKILL_DIR}/outils"`.

## Où vivent les choses

- **L'atelier** (le projet Remotion d'une vidéo) : `<ateliers>/<projet>-v<N>/`, `ateliers` étant
  un réglage de l'utilisateur (par défaut `~/recap-film/`). Hors des dépôts : ses `node_modules`
  pèsent 300 Mo. Sous Windows, ni sous Documents (l'accès contrôlé aux dossiers y bloque le
  ffmpeg de Remotion) ni sous `%LOCALAPPDATA%` (l'application Claude y redirige ses écritures).
  Une fois la vidéo livrée, son code est dans `5-video/` : l'atelier peut être supprimé.
- **La livraison** : `<projet>/__recap-system-100s/5-video/` : `<projet>-vN.mp4`, plus
  `-storyboard.md`, `-pitch.md` (s'il y a une voix off), `-source/` et `-bilan.md`. Une nouvelle
  version n'efface jamais la précédente.
- **Les sons** : la banque-son de l'utilisateur (réglage `banqueSon` : un dossier avec `musique/`
  et, pour les bruitages, un `bruitages.json` qui nomme ses fichiers), ou un fichier audio qu'il
  donne. Les réglages : `node "${CLAUDE_SKILL_DIR}/../recap-system-100s/reglages.mjs"`.

## Le circuit

Noter chaque étape dans le journal **au moment où elle commence** : c'est ce qui découpe le bilan.
`node OUTILS/bilan.mjs etape <atelier>/journal.jsonl "<étape>"`

1. **Préparation.** Lire le projet : fiche de `1-demarrer/`, cartes de `4-archi/`, README, le site
   s'il existe. Relever les vrais chiffres (jamais inventés). Comprendre **pour qui est le film** :
   le projet de l'utilisateur, ou un client (alors : quel client, son site ; et l'entreprise de
   l'utilisateur doit-elle signer ?). Ne demander que ce qui ne se devine pas.
   `node OUTILS/nouveau.mjs --projet <nom> --version <N> [--da <dossier|marque>] [--style <id>]`
   crée l'atelier (modèle, bruitages, paquets) **sans la musique** (elle vient après le style) et
   ouvre le journal (« Préparation »).
2. **La DA** (étape « DA »). D'après `references/da.md` : la DA du projet (son code, son site),
   celle du client (`node OUTILS/da.mjs <url> --marque <nom>`), un duo (demander l'équilibre :
   client d'abord, partenariat, ou entreprise d'abord), ou, pour un projet sans charte, la palette
   d'un style. **Montrer la planche** (`planche.png`) et faire corriger. Installer :
   `node OUTILS/da.mjs --appliquer <dossier|marque> <atelier>`.
3. **Le style** (étape « Style »). Si l'utilisateur ne l'a pas dit : écrire `<atelier>/apercus.json`
   (le vrai contenu du projet : nom, phrase, accroche, une demande qu'on fait au produit et sa
   réponse, un chiffre, trois mots-clés, l'adresse), rendre `node OUTILS/apercus.mjs <atelier>`
   (une à deux minutes, flou de mouvement compris : les cinq styles dans la DA du projet), ouvrir
   `out/apercus/catalogue.html` (ou envoyer `catalogue.mp4`), puis demander le style par une
   question à choix : les 3 ou 4 styles qui conviennent le mieux (keynote, démo produit, fil
   conducteur, teaser, plan-séquence), le premier « (Recommandé) » avec sa raison en une ligne. Le
   court-métrage 3D s'annonce comme une option longue ; le « Monde en cubes » seulement s'il est
   demandé. Puis lire la fiche du style (`styles/<id>.md`) et `styles/README.md` (ce que Luca aime).
   **La musique, différente à chaque film** : `node OUTILS/musique.mjs choisir --style <id> --atelier <atelier>`
   classe les morceaux de la banque-son (tempo qui va avec le style, ceux des derniers films écartés,
   l'historique est dans `~/.claude/recap-system-100s/musiques.json`) et en tire trois au sort parmi
   les meilleurs. Les proposer à l'utilisateur (dans la même question que le style quand c'est
   possible, sinon prendre la première), puis la poser :
   `node OUTILS/nouveau.mjs --projet <nom> --version <N> --musique "<morceau>"` (elle est notée dans
   l'historique). Jamais la musique d'un des quatre derniers films sans que l'utilisateur la demande.
   Sans banque-son, demander un fichier audio dont l'utilisateur a les droits (ne jamais en
   télécharger un), ou `--muet`.
4. **Le pitch et la voix** (étape « Pitch »). D'après `references/pitch.md`. Demander une fois,
   sauf s'il l'a déjà dit : **une voix off IA** (proposée par défaut ; voix Achird, ou son réglage
   `voix`), **sa propre voix en doublage** (recommandée pour un projet confidentiel : rien ne sort de
   la machine), ou **pas de voix** (film musical : sauter l'étape) ; et la durée (45 s à 2 min,
   d'après la taille du projet). Écrire `<atelier>/PITCH.md` : le problème, la solution, comment ça
   marche, la preuve, la fin ; une phrase par ligne, une phrase = un plan. Le montrer en entier avec
   sa durée estimée et **attendre sa validation** (la seule étape qui attend : la voix porte le film).
   - voix IA : `node OUTILS/voix.mjs ia <atelier>` (`--voix <nom>` pour une autre ;
     `node OUTILS/voix.mjs echantillons <atelier>` pour en comparer quatre) ;
   - doublage : `node OUTILS/voix.mjs prevoir <atelier>` (le minutage prévu, à 2,6 mots par
     seconde) ; le film se fait sur ce minutage, l'utilisateur s'enregistre après le premier rendu
     (étape 9).
   Dans les deux cas, `src/pitch.ts` donne les phrases et leurs instants : les plans se coupent sur
   `p(i)` et `<Musique />` joue la voix en se baissant dessous.
5. **Matière.** Captures du vrai site : `node OUTILS/capturer.mjs <url> <atelier>/public/captures . page/ … --long .`
   (chemins sans « / » initial en Git Bash). Si les chiffres doivent rester à jour, écrire
   `<atelier>/donnees.mjs` qui les relit (`export default async () => ({…})`) ; `rendre.mjs`
   l'appelle avant chaque rendu.
6. **Storyboard** (étape « Storyboard »). `<atelier>/STORYBOARD.md`, d'après
   `references/storyboard.md` : la DA, le style, la musique en tête ; **une histoire propre à ce
   projet**, dite dans la langue du style. Durée en temps de musique, coupes sur les mesures ; avec
   une voix off, un plan par phrase du pitch, coupé sur `p(i)`.
   Montrer à l'utilisateur le storyboard en quelques lignes et continuer sans attendre.
7. **Plans** (étape « Plans »). Écrire le film dans `src/` avec les briques communes
   (`src/styles/interface.tsx` : curseur, fenêtre, verre, halo, texte tapé, flou de mouvement), le
   kit du style (`src/styles/<id>/`, son `Apercu.tsx` comme exemple complet) et la DA adaptée au
   style : `const da = adapterDA('<id>', DA_FILM)` puis `<AvecDA da={da}>`, tout le film dans
   `<Flou>` (les planches se rendent sans lui : `rendre.mjs` passe `rapide`). `NB_TEMPS` dans `reglages.ts` =
   durée du film (avec une voix off : au moins `DEBUT_VOIX` + `DUREE_VOIX` + 2 s). Lire
   `references/regles-communes.md` (et `references/recettes-3d.md` pour la 3D).
   Vérifier : `npx tsc` dans l'atelier.
8. **Contrôles** (étape « Contrôles »). Planche d'images clés, une par moment fort :
   `node OUTILS/rendre.mjs <atelier> --temps 2,4.5,8.5,14,22,…` → `out/planche-…/planche.png`.
   La regarder vraiment : textes lisibles et dans le cadre, rien de coupé, rien qui recouvre un
   titre, DA et style respectés (les interdits de la fiche). Corriger, refaire la planche. Le Studio
   (`npx remotion studio --port=3073` dans l'atelier) sert à l'utilisateur pour regarder et régler.
   Avec une voix off, une image à `p(i) + 10` par phrase : le plan montre-t-il ce que dit la phrase ?
9. **Rendu** (étape « Rendu »). `node OUTILS/rendre.mjs <atelier>` → `renders/film.mp4` (durée du
   rendu notée seule dans le journal). Contrôler le MP4 : durée, son, quelques images extraites.
   Si ffmpeg est installé sur la machine, mesurer le volume (`ffmpeg -i film.mp4 -af ebur128 -f null -`,
   viser −16 à −14 LUFS).
   **En doublage** (étape « Doublage »), ce premier rendu est sans voix. Lancer en arrière-plan
   `node OUTILS/doublage.mjs <atelier>` : le studio s'ouvre dans le navigateur. Dire à
   l'utilisateur ce qui l'attend : le film passe et son texte défile dessous ; chaque phrase est à
   dire quand elle passe sous la barre orange ; « Répéter » sert à s'entraîner, et il peut refaire
   autant de prises qu'il veut ; puis « Garder cette prise » et « C'est bon, terminer ». L'outil
   s'arrête alors et donne l'écart de chaque phrase avec le prévu. Refaire planche et rendu : les
   plans se recalent sur sa vraie voix.
10. **Livraison.** `node OUTILS/livrer.mjs <atelier> <racine du projet>` : range la vidéo, le
   storyboard, la source, clôt le journal et écrit le bilan. Envoyer la vidéo à l'utilisateur
   avec **le tableau du bilan dans la réponse**.

Pour un simple réglage sur une vidéo existante : rouvrir son atelier (ou le recréer depuis
`-source/`), corriger, refaire planche, rendu et livraison (nouvelle version). Pour **changer de
style ou de DA** : c'est un nouveau film (nouvelle version), avec une histoire repensée pour ce style.

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
pour un nouveau projet coûte plutôt la somme des deux. Les aperçus des styles ajoutent environ
une minute de rendu (6 styles, 960 × 540).

## Règles

- **La DA du projet ou du client, jamais la charte de 100s par défaut** ; chaque style la
  réinterprète par `adapterDA`, avec les seules couleurs de la marque.
- **Le style choisi par l'utilisateur** sur les aperçus (ou nommé par lui), et ses règles de
  mouvement suivies (`styles/<id>.md`). Le « Monde en cubes » seulement sur demande.
- **Rien de recyclé** d'un film à l'autre : ni la trame, ni les objets, ni la musique.
- Les règles communes (`references/regles-communes.md`) : que du vrai, la grille de la musique,
  la lecture, rien qui fasse « IA ».
- Rien de confidentiel à l'écran : ni secret, ni donnée personnelle, ni compte privé, ni page
  privée d'un client sans son accord. Un pitch confidentiel (client, projet pas encore annoncé) ne
  part pas vers la voix IA gratuite, dont Google peut se servir des textes : doublage par
  l'utilisateur, ou palier payant avec son accord.
- Les polices : libres, ou celles du client pour son film avec son accord ; jamais une police
  Adobe Fonts ou Typekit copiée (`references/da.md`).
- Les sons appartiennent à l'utilisateur : n'utiliser que sa banque-son ou les fichiers qu'il
  donne, jamais une musique téléchargée sans droits. Rien de payant.
- Remotion est gratuit pour une personne ou une entreprise de 3 salariés au plus. Un film fait
  dans le cadre d'une entreprise plus grande (celle où travaille l'utilisateur, pour ses clients)
  demande une licence entreprise Remotion : le rappeler avant le premier film de ce genre.
- Ne rien commiter sans l'accord de l'utilisateur.
