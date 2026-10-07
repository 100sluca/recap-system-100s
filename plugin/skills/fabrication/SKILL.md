---
name: fabrication
description: "Crée ou met à jour FABRICATION.md d'un projet de code (dans __recap-system-100s/3-fabrication/, sinon à la racine) - de quoi le projet est fait et pourquoi - avec la stack (langages, frameworks, bibliothèques avec version et licence, front, back, données, IA, hébergement), les décisions techniques (date, pourquoi, alternative écartée, trace), les inspirations (dépôts GitHub et sites repris, ce qu'on en a pris, licence et ce qu'elle impose) et le lien vers les cartes. À utiliser dès que l’utilisateur parle de fabrication, de stack, de technos, de « avec quoi c'est fait », de « pourquoi on a choisi », de décisions, d'alternatives, d'inspirations, de dépôts dont on est parti, de licences, de FABRICATION.md, ou dès qu'un choix technique est fait en session (nouvelle bibliothèque, framework, service, méthode retenue ou écartée), même s'il ne demande pas explicitement la fiche."
---

# fabrication : de quoi le projet est fait, et pourquoi

## Pourquoi

Des mois plus tard, on veut retrouver trois choses sans rien se rappeler :
avec quoi le projet est construit, pourquoi chaque choix a été fait (et ce
qu'on a écarté), et d'où l'on est parti. C'est le pendant de
`project-table` :

- `RESSOURCES.md` : ce que le projet **utilise** (comptes, services, clés, variables) ;
- `FABRICATION.md` : ce dont il **est fait**, et **pourquoi** ;
- `4-archi/` : comment il **marche** (skill `carte`).

Les trois vivent dans `__recap-system-100s/` (sous-dossiers `2-ressources/`, `3-fabrication/`, `4-archi/`), le dossier du récap du projet.

Les trois fichiers se renvoient l'un à l'autre et ne se répètent pas : un
compte ou une variable va dans `RESSOURCES.md`, jamais ici.

## Quand

- **À chaque choix technique fait en session** : une nouvelle bibliothèque,
  un framework, un service, une méthode retenue ou abandonnée. Ajouter une
  ligne aux Décisions tout de suite, pendant que le pourquoi est frais. C'est
  ce qui vaut le plus, plus tard.
- **En fin de projet, ou quand l'utilisateur le demande** : la fiche complète, puis le
  vérificateur.

## Démarche

1. **La stack, depuis le code.** Lire les fichiers de dépendances
   (`package.json`, `requirements*.txt`, `pyproject.toml`, `.node-version`,
   `components.json`…), sans `node_modules` ni `.venv`. Prendre les versions
   **installées** (`node_modules/<paquet>/package.json`, `pip list` dans le
   venv) et leur licence (`license` du `package.json`). Ranger par couche :
   Front · Back · Données, hébergement, livraison · Outils de fabrication.
   Une ligne par rôle, pas par paquet : « Animations : Motion ; Lenis ».
2. **Dire franchement le niveau d'IA.** Dans « En bref » : aucune, de simples
   appels (SDK, réponse texte ou JSON typé), un agent (boucle et outils), ou
   un serveur MCP. Le vérifier dans le code (appel d'outils activé ou non,
   boucle ou non). Même grille de couches que le skill `carte`
   (`${CLAUDE_SKILL_DIR}/../carte/references/vue-architecte.md`).
3. **Les décisions, depuis les traces.** Sources, dans l'ordre : le journal
   de la session en cours, les documents de cadrage (`CADRAGE.md`, `README`),
   `git log` (les messages disent souvent le pourquoi : « fix : lire la grille
   au lieu d'appeler l'API »), les commentaires du code, la section
   « Écartés » de `RESSOURCES.md`, la mémoire du projet. Une ligne par choix :
   Date · Décision · Pourquoi · Écarté · Trace (fichier ou commit).
   - Écrire « – » dans Écarté quand aucune alternative n'a été étudiée.
     Ne jamais en inventer une.
   - Une décision encore en cours (code pas commité) porte la mention
     « en cours » dans sa date.
4. **Les inspirations, avec leur licence vérifiée.** Chercher dans le code
   les mentions de reprise (`inspiré`, `d'après`, `repris de`, `adapté`, des
   noms de bibliothèques de composants, des URL de dépôts) et dans la
   mémoire. Pour chaque source :
   - le lien, ce qu'on en a repris (des fichiers précis) ;
   - la licence lue à la source : `gh api repos/<owner>/<repo> --jq .license.spdx_id`,
     sinon le fichier LICENSE ou la page du site ;
   - **ce qu'elle impose** : MIT et BSD gardent la mention de copyright
     dans les copies, une licence non commerciale interdit
     tout usage client ou professionnel, une licence propriétaire peut
     interdire la redistribution. Si une obligation n'est pas remplie dans
     le code, l'écrire en gras dans le tableau et dans « À faire ».
   - Un site dont on n'a repris que le style : « aucune (site Framer) »,
     « le style seulement, aucun code copié ».
5. **Les cartes** : une ligne par carte de `__recap-system-100s/4-archi/`, avec le commit
   qu'elle reflète ; signaler celles que le code a dépassées.
6. **Écrire `FABRICATION.md`** dans `__recap-system-100s/3-fabrication/` (le dossier du
   récap, à côté de `RESSOURCES.md` ; à la racine si le projet ne suit pas
   encore le système) avec le modèle
   [`FABRICATION.template.md`](FABRICATION.template.md) : mêmes sections, même
   ordre. Si le fichier existe, compléter sans réécrire ce que l'utilisateur a ajouté.
7. **Vérifier** :

   ```bash
   node "${CLAUDE_SKILL_DIR}/verifier.mjs" <racine du dépôt>
   ```

   Il liste chaque dépendance déclarée que la fiche ne cite pas, et signale
   une fiche plus ancienne que le dernier changement d'un fichier de
   dépendances. Code de sortie 0 : à jour. Une dépendance déclarée mais
   importée nulle part se signale dans la stack et dans « À faire », sans la
   retirer soi-même.
8. **Compte-rendu** à l'utilisateur : ce qui a été ajouté, les obligations de licence
   non remplies, les dépendances inutiles, les cartes à redessiner. Si le
   projet a une fiche code-start, y ajouter le chemin de `FABRICATION.md`.

## Style

- En français, phrases courtes, tutoiement dans « Pourquoi » quand c'est le
  choix de l'utilisateur (« ta consigne », « validée par toi »).
- Noms exacts des outils, des fichiers et des commandes, avec leur version.
- Aucun secret : ni clé, ni jeton, ni mot de passe. Un nom de variable
  renvoie à `RESSOURCES.md`.

## Commit

`FABRICATION.md` se versionne. Ne commiter que si l'utilisateur le demande, ou si le
projet a déjà cette habitude. Un dépôt partagé par plusieurs sessions se
commite avec `git commit -- <chemins>`.
