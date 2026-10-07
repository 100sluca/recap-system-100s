---
name: carte
description: "Dessine les cartes d'un projet en pages HTML interactives à l'habillage du système, avec le moteur Archify, et les range dans __recap-system-100s/4-archi/ du projet. Deux regards par projet - le fonctionnement (le parcours d'une donnée, en mots simples) et la vue d'architecte (front, back, base de données, IA, passerelles, hébergement, protocoles et données échangées, en haut niveau puis en détail par module) - plus, au besoin, les échanges entre services et les états d'un objet. À utiliser dès que l'utilisateur demande une carte, un schéma, un diagramme, une cartographie, un schéma d'architecture, la stack ou les technos d'un projet, un visuel de « comment ça marche », de mettre à jour ou refaire une carte existante, d'habiller une sortie Archify, ou quand un projet vient d'être terminé ou a changé d'architecture, même s'il ne dit ni « carte » ni « Archify ». Pas pour les graphiques de chiffres ni les tableaux de bord."
---

# carte : la carte d'un projet

## Pourquoi

On veut comprendre ce qu'on construit et pouvoir le refaire seul. Une carte
répond à « comment ça marche ? » d'un coup d'œil : une page HTML autonome
(zoom, clair et sombre, recherche, export PNG ou SVG) qu'on ouvre d'un double-clic.
C'est la pièce 4 du récap (skill `recap-system-100s`).

## Comment c'est fait

- **Le moteur** est Archify (MIT, https://github.com/tt-a1i/archify). Il n'est pas
  livré avec le skill : `carte.mjs` le clone (git) au premier dessin dans
  `~/.claude/recap-system-100s/archify/` ; ses fichiers sont sous
  `~/.claude/recap-system-100s/archify/archify/` (noté `MOTEUR` ci-dessous). L'agent ne dessine rien : il écrit un JSON (boîtes,
  flèches, couloirs). Le moteur place les boîtes, trace les flèches, puis
  vérifie le résultat dans un vrai navigateur.
- **L'habillage** est dans `theme/` : `100s.css` et les polices. Il est
  posé sur le preset `editorial` d'Archify après le rendu.
- **`carte.mjs` fait tout le circuit** : il prépare le JSON (preset, langue
  `fr`, libellés de l'interface en français), lance `finalize`, habille la page
  et la range.
- **Ne jamais modifier le moteur.** Une retouche visuelle se fait dans
  `theme/100s.css`, puis on redessine une carte pour vérifier.

Dans les commandes ci-dessous, `carte.mjs` désigne `"${CLAUDE_SKILL_DIR}/carte.mjs"`.

## Les familles de couleur

Des couleurs franches, une teinte par famille. Le champ `type` de chaque boîte choisit la famille : composants
en `architecture`, nœuds en `workflow` et `dataflow`, participants en
`sequence`. On choisit selon le **rôle** de la boîte dans le projet, pas
selon la techno. Une carte `lifecycle` a ses propres types d'états
(`start`, `active`, `waiting`, `decision`, `success`, `failure`), définis
dans son schéma.

| `type` Archify | Famille | Couleur | Exemples |
|---|---|---|---|
| `external` | Sources, personnes, ce qui vient de dehors | blanc | comptes suivis, utilisateur, site d'un éditeur, API publique |
| `backend` | Calcul : ce qui tourne chez nous | vert | script Python, tâche planifiée, API, fonction, agent, serveur MCP |
| `cloud` | Services tiers et hébergement | jaune | Gemini, GitHub, Cloudflare, Supabase (le service) |
| `database` | Stockage | violet | SQLite, tables, fichiers de données, bucket, dépôt Git qui sert de base |
| `frontend` | Sorties : ce qu'on lit ou voit | bleu | site, page, Google Sheet, e-mail envoyé |
| `security` | Sécurité, accès, passerelles | rose | mot de passe d'éditeur, Access, jetons, API Gateway, AI Gateway, MCP Gateway |
| `messagebus` | Files, événements, webhooks | orange | webhook, file de messages |

Dans `meta.legend.entries`, chaque famille utilisée reçoit un libellé
français propre au projet : « Étape Python (ton PC) », « Service gratuit »,
« Ce que tu lis »… La légende parle à l'utilisateur, en français. Sur les
cartes d'architecture, les boîtes et les flèches emploient en plus le
vocabulaire d'architecte et les noms exacts des technos.

## Étapes

### 1. Choisir la question et le nom

Une carte répond à une seule question. Chaque projet reçoit deux regards :

- **le fonctionnement** : le parcours principal (type `workflow`, ou
  `dataflow` si c'est surtout de la donnée qui circule), en mots simples,
  nommé d'après ce qu'il fait : `veille`, `publication`… ;
- **la vue d'architecte** (type `architecture`), en deux niveaux :
  - `architecture` (obligatoire) : front, back, données, IA, passerelles,
    hébergement, qui appelle qui, par quel protocole, et ce qui circule ;
  - `detail-<morceau>` : les modules d'un morceau et les fonctions qu'ils
    s'appellent, avec le type de donnée échangé. Une par morceau assez gros
    pour qu'on s'y perde (`detail-veille`, `detail-site`).

  La méthode complète (les couches à passer en revue, les conventions de
  flèches, les quatre cartes de texte, le placement) est dans
  `${CLAUDE_SKILL_DIR}/references/vue-architecte.md`. La lire avant toute carte
  `architecture` ou `detail-<morceau>`.

Sinon : `sequence` pour des échanges aller-retour entre services (une requête
critique de bout en bout), `lifecycle` pour les états d'un objet
(brouillon → publié).

Rangement : `__recap-system-100s/4-archi/<nom>.json` (la source, versionnée) et
`__recap-system-100s/4-archi/<nom>.html` (la page produite), dans le dossier du
récap du projet (skill `recap-system-100s`). Un projet qui ne suit pas encore
le système les range dans `docs/carte/`.

### 2. Lire avant d'écrire

Dans un seul lot de lectures, sous `MOTEUR` (`~/.claude/recap-system-100s/archify/archify/`) :

- `references/authoring-defaults.md` ;
- le schéma du type, `schemas/<type>.schema.json`, plus `schemas/common.schema.json` ;
- l'exemple du type :
  - `architecture` : `examples/web-app.architecture.json` (ou `production-deployment.architecture.json` pour un dépôt de déploiement) ;
  - `workflow` : `examples/agent-tool-call.workflow.json` ;
  - `sequence` : `examples/cache-miss-request.sequence.json` ;
  - `dataflow` : `examples/product-analytics.dataflow.json` ;
  - `lifecycle` : `examples/deployment-release.lifecycle.json`.

Pour une carte qui doit refléter du vrai code, lire aussi
`references/repository-authoring.md` et suivre le code lui-même : les
fichiers, les scripts, le README.

Une carte existante du même genre montre le ton attendu : celles déjà dans
`__recap-system-100s/4-archi/` du projet, sinon la carte de ce skill
(`${CLAUDE_SKILL_DIR}/docs/carte/carte.json`, type `architecture`). Les exemples
apprennent la forme, pas les faits : identifiants, textes et placement sont à
écrire à neuf.

### 3. Écrire le JSON

- `meta.title` en français, en une phrase simple (« Comment marche la veille 100s »).
- `meta.legend.entries` en français (voir les familles), et
  `meta.quality_profile: "showcase"`.
- **Inutile d'écrire** `meta.output`, `meta.visual_preset`, `meta.locale` ni
  `meta.translations` : `carte.mjs` les pose.
- **Les mots de l'utilisateur** : tutoiement (« ton PC », « ce que tu lis »), phrases
  courtes, noms exacts des outils, des commandes et des fichiers.
- **Aucun secret.** Le nom d'une variable (`GOOGLE_API_KEY`) est permis, sa
  valeur jamais.
- Écrire le candidat complet d'un coup, sans planifier les coordonnées en
  prose. Les routes automatiques d'abord, des routes explicites seulement si
  une vérification les réclame.

### 4. Dessiner

```bash
node carte.mjs dessiner <type> __recap-system-100s/4-archi/<nom>.json
```

Pour une carte adossée au code, ajouter `--repo-root <racine du dépôt>`.
Options : `--sortie <dossier>` (par défaut, le dossier du JSON) et
`--quality standard` pour une carte dense.

Un code de sortie non nul n'est jamais un succès. `carte.mjs` affiche les
portes, les diagnostics et le chemin du reçu détaillé. Corriger le JSON
source (jamais la page HTML), puis relancer. La méthode de réparation et sa
limite de tentatives sont dans
`MOTEUR/references/delivery-contract.md`, section « Failed finalize
and candidate repair ». Pour des flèches emmêlées en `architecture`, voir
`references/architecture-layout-repair.md`.

### 5. Regarder la carte

Les 4 portes d'Archify (`validate`, `deliver`, `check`, `browser-check`)
prouvent que la page est saine, pas qu'elle est claire. Pour une nouvelle carte :

1. L'ouvrir dans un navigateur. Le navigateur intégré de Claude n'ouvre pas les
   `file://` : servir le dossier (une entrée de serveur statique dans le
   `.claude/launch.json` du projet, par exemple `npx serve __recap-system-100s/4-archi`),
   ou ouvrir le fichier dans le navigateur de l'utilisateur.
2. Prendre une capture, vérifier que les familles se distinguent et que
   rien ne déborde, et regarder aussi le mode sombre.

### 6. Compte-rendu

Donner :
- le chemin de la page, le type et les portes ;
- ce qui a été regardé à l'œil, et rien de plus ;
- la commande pour redessiner.

Si le projet a une fiche (`__recap-system-100s/1-demarrer/`), y ajouter ou
mettre à jour le chemin de la carte. Le README du dépôt mérite
la même ligne.

## Mettre à jour une carte

Le JSON est la source de vérité. On le modifie, puis on relance
`dessiner` : la page est réécrite au même endroit. On ne retouche jamais le
HTML à la main.

## Habiller une sortie Archify existante

Si la page a été rendue avec le preset `editorial` :

```bash
node carte.mjs habiller <entree.html> <sortie.html>
```

Pour un autre preset, `carte.mjs` refuse et demande de redessiner depuis le JSON.

## Le moteur

- `node carte.mjs doctor` : vérifie le moteur et le thème.
- `node carte.mjs installer` : installe le moteur s'il manque (clone partiel
  du dossier `archify/` du dépôt officiel).
- `node carte.mjs maj` : met le moteur à jour. Seulement quand l'utilisateur le
  demande, ou quand `dessiner` annonce une version plus récente. Dans ce cas,
  le lui proposer. Après une mise à jour, redessiner une carte connue pour
  vérifier que le thème tient toujours.
