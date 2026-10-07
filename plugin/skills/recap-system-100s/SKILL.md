---
name: recap-system-100s
description: "Le mode recap-system-100s d'un projet de code : son récap en 5 pièces dans __recap-system-100s/ (1-demarrer fiche et lanceur, 2-ressources RESSOURCES.md, 3-fabrication FABRICATION.md, 4-archi schémas d'architecture et de fonctionnement, 5-video vidéos v1, v2…), chacune faite au bon moment, avec sa fraîcheur mesurée sur le code. Commandes : /recap-system-100s (état), -sc, -r, -f, -a, -v, -maj (1 + 2 + 3), -final, -nom, -overlay (le récap sur l'écran, hors de Claude Code ; -overlay off pour l'éteindre), -installer (prérequis), -reglages. À utiliser dès que l'utilisateur tape /recap-system-100s, parle du récap, du mode récap, d'« appliquer le système », d'« où en est le récap », de « projet terminé », ou demande de mettre à jour le lanceur, les ressources, la fabrication, les schémas ou la vidéo d'un projet."
argument-hint: "[-sc | -r | -f | -a | -v | -maj | -final | -nom \"<nom>\" | -overlay [off] | -installer | -reglages]"
---

# recap-system-100s : le mode récap d'un projet

Argument reçu : `$ARGUMENTS`

## Pourquoi

Pour chaque projet, on veut comprendre ses fondations, et pouvoir le relancer, l'expliquer et
le montrer sans rien se rappeler. Le récap a cinq pièces, qui n'arrivent pas au même moment :

| N° | Pièce | Dossier | Skill | Quand |
|:-:|---|---|---|---|
| 1 | Démarrer : fiche mémo + lanceur | `1-demarrer/` | `code-start` | dès que quelque chose se lance |
| 2 | Ressources : ce que le projet utilise | `2-ressources/RESSOURCES.md` | `project-table` | à chaque compte, clé, service |
| 3 | Fabrication : de quoi il est fait, et pourquoi | `3-fabrication/FABRICATION.md` | `fabrication` | à chaque choix technique |
| 4 | Archi : schémas d'architecture et de fonctionnement | `4-archi/` | `carte` | à chaque jalon, puis à la fin |
| 5 | Vidéo de présentation | `5-video/<projet>-v1.mp4`, v2… | `film` | à la fin, ou à la demande |

C'est un **mode** : une fois allumé dans un projet, il le reste. Le bloc « recap-system-100s » du
`CLAUDE.md` du projet le rappelle à chaque session, et le bandeau de ce plugin montre la
fraîcheur des cinq pièces au-dessus de la saisie.

## Où vivent les choses

- **Le récap d'un projet** : `__recap-system-100s/` à la racine du projet, toujours ce nom-là,
  avec `README.md` (la page d'entrée, écrite par `etat.mjs --ecrire`) et les cinq sous-dossiers.
- **Seule pièce hors du dossier** : le bloc entre les marqueurs `recap-system-100s:debut` et
  `:fin` dans le `CLAUDE.md` à la racine du projet (modèle : `bloc-CLAUDE.md`). Il porte le nom
  d'usage du projet (`Nom :`) et sa phase (`Phase :`).
- **Les réglages de l'utilisateur**, hors de tout projet : `~/.claude/recap-system-100s/reglages.json`
  (`node "${CLAUDE_SKILL_DIR}/reglages.mjs"` les montre). Tous facultatifs : `fiches` (un dossier
  où recopier aussi chaque fiche et son lanceur pour le double-clic), `banqueSon`, `musique` et
  `ateliers` (pour les vidéos).

Dans les commandes ci-dessous, `etat.mjs` désigne `"${CLAUDE_SKILL_DIR}/etat.mjs"`.

## Lire l'argument

Le tiret est facultatif, la casse et les accents aussi :

| Argument et variantes | Action |
|---|---|
| (rien), `-etat` | État |
| `-starting-code`, `-sc`, `-start`, `-demarrer` | 1 · Démarrer |
| `-ressources`, `-r`, `-resources` | 2 · Ressources |
| `-fabrication`, `-f` | 3 · Fabrication |
| `-archi`, `-a`, `-architecture` | 4 · Archi |
| `-video`, `-v` | 5 · Vidéo |
| `-maj` | 1, 2 et 3 d'une traite |
| `-final` | Final (pas de raccourci) |
| `-nom "<nom>"` | Donner au projet son nom d'usage |
| `-overlay`, `-overlay off` | Overlay de l'écran, allumé ou éteint |
| `-installer`, `-setup`, `-prerequis`, `-doctor` | Vérifier et préparer la machine |
| `-reglages` | Montrer ou changer les réglages |

Un argument inconnu : montrer ce tableau, ne rien faire d'autre.

## Toujours, au début et à la fin (sauf `-overlay`, `-installer` et `-reglages`)

1. Trouver la racine du projet : le dépôt git du dossier de travail (hors git : le dossier de
   travail). Si la session est ouverte au-dessus de plusieurs projets, demander lequel. Ne jamais
   allumer le mode dans le dossier de ce plugin.
2. `node etat.mjs <racine> --ecrire`. La première fois, cela **allume le mode** : crée
   `__recap-system-100s/` et ses cinq sous-dossiers, ajoute le bloc au `CLAUDE.md` (créé s'il
   n'existe pas) avec un nom d'usage (le `name` du `package.json`, sinon le dossier), écrit la page
   d'entrée. Si ce nom n'est pas parlant, proposer mieux à l'utilisateur et le poser avec
   `--nom "<nom>"`. Les fois suivantes, cela réécrit seulement la page d'entrée.
3. Si le tableau signale des pièces « à déplacer » (anciens emplacements : `RESSOURCES.md` ou
   `FABRICATION.md` à la racine, `docs/carte/`, `recap-system-100s/`), les déplacer dans leur
   sous-dossier et corriger les liens qui y pointaient. Avant de déplacer un fichier suivi par git,
   regarder `git status` : s'il est modifié par une autre session en cours, le laisser et le dire.
4. Faire l'action demandée (ci-dessous).
5. Relancer `node etat.mjs <racine> --ecrire` et montrer le tableau final.

## Les actions

**État.** Montrer le tableau tel quel, puis proposer une seule prochaine action : la première
pièce ✗, sinon la première ⚠. Un « · » veut dire « pas encore le moment » : ne rien proposer pour
elle.

**1 · Démarrer** (`-sc`). Skill `code-start` : la fiche et le lanceur dans `1-demarrer/`, lanceur
testé ; et leur copie dans le dossier des fiches si le réglage `fiches` existe.

**2 · Ressources** (`-r`). Skill `project-table`, fichier `2-ressources/RESSOURCES.md`.

**3 · Fabrication** (`-f`). Skill `fabrication`, fichier `3-fabrication/FABRICATION.md`, vérifié
par son `verifier.mjs`. En tête de fiche, « code au commit `<7 caractères>` » : c'est ce repère
qui fait baisser sa barre quand les dépendances changent après.

**4 · Archi** (`-a`). Skill `carte`, dans `4-archi/` : le fonctionnement (le parcours principal),
`architecture` (la vue d'architecte), puis `detail-<morceau>` pour chaque morceau où l'on se perd.
Un schéma existant se redessine depuis son JSON, avec `meta.repository.revision` remis au commit
courant.

**5 · Vidéo** (`-v`). Skill `film`, dans `5-video/`. Les versions se suivent : `<projet>-v1.mp4`,
`<projet>-v2.mp4`… Une nouvelle version n'efface jamais la précédente. Le skill range aussi le
storyboard, la source et le bilan (`<projet>-vN-bilan.md` : temps, appels au modèle, agents,
jetons, rendus), à montrer à l'utilisateur avec la vidéo.

**-maj.** 1, puis 2, puis 3, sans s'arrêter entre les trois. Ne touche ni aux schémas ni à la
vidéo, qui sont lents et se décident à part.

**-final.** Quand le projet est terminé :
1. Remettre à jour toute pièce qui n'est pas à 100 : 1, 2, 3, puis tous les schémas au commit
   final.
2. La vidéo : en faire une si aucune n'existe ; en faire la version suivante si sa barre est sous
   100 (le code a bougé depuis la dernière).
3. Dans le bloc du `CLAUDE.md`, passer `Phase : en cours` à `Phase : terminé`.
4. Dans la fiche (et sa copie), « Last update » : projet terminé, avec la date.
5. Le projet n'est terminé que si toutes les pièces sont ✓.

**-nom "<nom>".** `node etat.mjs <racine> --ecrire --nom "<nom>"` : le nom d'usage du projet,
celui que montrent le bandeau, l'overlay et la page d'entrée. Sans nom donné, demander lequel.

**-overlay.** Le récap sur l'écran, hors de Claude Code, comme l'overlay d'un salon vocal : une
petite fenêtre toujours au premier plan, en haut à gauche, avec une ligne par projet en cours
dans une session (nom, 5 barres, prochaine commande). Elle se cache quand aucune session n'est en
cours. On la déplace en la glissant ; la croix d'une ligne masque ce projet jusqu'à sa prochaine
session, celle du titre ferme l'overlay ; clic droit : mode compact, opacité, réafficher les
projets masqués, quitter. Elle lit les présences que le bandeau de chaque session dépose dans
`~/.claude/recap-system-100s/presence/`.
- Allumer : `node "${CLAUDE_SKILL_DIR}/overlay/activer.mjs"`. Cela la lance, et la relance à
  chaque ouverture de session (Windows : un raccourci dans le dossier Démarrage ; macOS : un
  LaunchAgent ; Linux : `~/.config/autostart`). Le dire à l'utilisateur avant de lancer la commande.
- Éteindre (`-overlay off`) : la même commande avec `--off`.
- Windows : rien à installer (PowerShell et WPF). macOS et Linux : Python 3 avec tkinter ; s'il
  manque, la commande dit quoi installer.
- Cette option ne touche à aucun projet : pas de racine, pas d'`etat.mjs --ecrire`.

**-installer.** Pour une première installation, ou quand quelque chose ne marche pas :
1. `node "${CLAUDE_SKILL_DIR}/prerequis.mjs" --preparer` : vérifie Node, git, un navigateur
   Chromium, npm et (hors Windows) Python avec tkinter ; crée le dossier des réglages ; télécharge
   le moteur des schémas (Archify, quelques Mo, avec git).
2. Pour chaque manque, proposer la commande d'installation qu'il affiche et la lancer seulement
   avec l'accord de l'utilisateur.
3. Proposer les réglages utiles (`-reglages`) : un dossier des fiches pour le double-clic, une
   banque de sons pour les vidéos. Aucun n'est obligatoire.

**-reglages.** `node "${CLAUDE_SKILL_DIR}/reglages.mjs"` montre les réglages ;
`node "${CLAUDE_SKILL_DIR}/reglages.mjs" <clé> "<valeur>"` en change un (valeur vide : le retire).
Une banque de sons est un dossier avec `musique/` (les morceaux) et, si l'on veut des bruitages,
un `bruitages.json` qui nomme les fichiers : `{"clic.wav": "sound-effects/clic.wav", …}`. Les noms
attendus par le modèle de vidéo : `clic.wav`, `swoosh-1.wav`, `swoosh-2.wav`, `swoosh-3.wav`,
`impact.mp3`, `zing.mp3`, `valide.mp3`, `pop.mp3`, `tic-tac.mp3`, `eclat.mp3`.

## Règles

- Aucun secret dans le récap : ni clé, ni jeton, ni mot de passe.
- Ne rien commiter sans l'accord de l'utilisateur. Dans un dépôt partagé par plusieurs sessions,
  `git commit -- <chemins>`.
- Le récap décrit le projet tel qu'il est : ne jamais inventer une pièce, une décision ou une
  inspiration pour remplir une case.
- Les schémas et la vidéo ne se refont jamais d'eux-mêmes : seulement sur `-a`, `-v` ou `-final`.
