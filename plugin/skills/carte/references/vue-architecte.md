# La vue d'architecte : `architecture` et `detail-<morceau>`

Deux regards sur chaque projet :

- **le fonctionnement** (carte `workflow` ou `dataflow`) : ce que fait le projet, en mots simples ;
- **l'architecture** : de quoi il est fait techniquement, qui tourne où, en quelle
  techno, et ce qui circule entre les morceaux. C'est le schéma qu'un architecte
  de SI dessinerait.

La vue d'architecte suit le modèle C4 (Simon Brown), en deux niveaux :

| Niveau | Nom de la carte | Type Archify | Une boîte = | Une flèche = |
|---|---|---|---|---|
| Haut (C4 niveau 2, « conteneurs ») | `architecture` | `architecture` | une chose qui tourne ou qui stocke : appli front, API, script, base, service tiers | qui appelle qui, avec le protocole et ce qui circule |
| Bas (C4 niveau 3, « composants ») | `detail-<morceau>` | `architecture` | un module ou un fichier du code, dans un seul morceau | la fonction appelée et le type de donnée renvoyé |

La carte `architecture` est obligatoire. Une carte `detail-<morceau>` se fait pour
chaque morceau assez gros pour qu'on s'y perde, en pratique à partir de quatre
modules ou fichiers qui s'appellent entre eux. En complément, une `sequence`
peut montrer une requête critique de bout en bout (connexion, paiement,
sauvegarde).

## 1. Passer chaque couche en revue

Avant d'écrire le JSON, passer **toutes** les couches ci-dessous dans le code.
Une couche présente devient une boîte. Une couche absente va dans la carte
« Ce qu'il n'y a pas, et pourquoi » : on apprend autant de ce qui manque. Ne
jamais inventer une couche que le code ne montre pas.

| Couche | Ce qu'on cherche dans le code | Où ça va sur la carte |
|---|---|---|
| Utilisateurs | qui ouvre l'appli, qui l'administre | boîtes `external`, icône `person` |
| Front-end | framework, mode de rendu (statique, SSR, SPA), où il est servi | `frontend`, logo du framework |
| Bord du réseau | CDN, DNS, domaine, WAF | `region` de l'hébergeur, ou une ligne de la carte des couches |
| Passerelles | API Gateway, API Hub, AI Gateway, MCP Gateway, proxy, routeur de modèles | `security` (contrôle et routage) |
| Back-end | langage, framework, runtime (serveur, fonction, tâche planifiée, CLI) | `backend`, logo du langage |
| Agentique | agents, orchestrateur, outils, serveurs MCP, transport (stdio, HTTP) | `backend`, le mot « agent » ou « serveur MCP » en sous-titre |
| IA | fournisseur, modèle, SDK, gratuit ou payant, sortie typée ou texte | `cloud`, logo du fournisseur |
| Données | base (type et moteur), fichiers, cache, base vectorielle, bucket | `database`, logo du moteur |
| Échanges | REST, GraphQL, SSE, WebSocket, webhook, file de messages, git push | libellé de chaque flèche ; une file devient une boîte `messagebus` |
| Intégrations | API tierces appelées, avec ou sans clé | `external` ou `cloud` |
| Identité et secrets | authentification, cookie, jeton, noms des variables | `security-group` autour de ce qui est protégé ; noms seulement |
| Code et livraison | dépôt GitHub, branches, CI/CD, déclencheur du déploiement | `region` GitHub, logos `github` et `github-actions` |
| Observabilité | journaux, traces, alertes | boîte ou ligne de carte |

## 2. Conventions de dessin

- **Le point de départ se voit d'abord.** Ce qui
  lance tout (tâche planifiée, cron, clic de l'utilisateur, requête d'un
  visiteur, commit) est une boîte, placée en haut à gauche : type `messagebus`
  et icône `clock` pour un déclencheur automatique, type `external` et icône
  `person` pour une personne. Jamais un simple `tag`, qui passe inaperçu.
- **Dans une carte `detail-<morceau>`, les étapes sont numérotées dans l'ordre
  réel d'exécution** : `1 · Collecte`, `2 · Analyse`… Cet ordre est lu dans la
  fonction qui les enchaîne (`cmd_tournee()`, `main()`, le handler), pas
  deviné. Disposition qui marche (`detail-veille.json`) :
  - une rangée d'étapes chaînées par des flèches `emphasis` sans libellé,
    dans une `region` qui porte le nom de la fonction chef d'orchestre ;
  - au-dessus de chaque étape, ce qu'elle écrit (tables, fichiers), avec la
    base en `region` autour de ses tables ;
  - en dessous, les services qu'elle appelle. Un service partagé par deux
    étapes voisines se place entre elles.
- **Les zones disent où ça tourne.** Une `region` par lieu d'exécution ou
  hébergeur : « Ton PC · Windows », « GitHub · <compte> », « Cloudflare ·
  projet <nom> », « Google Cloud · <projet> ». Un `security-group` entoure ce
  qui est derrière un contrôle d'accès, avec le mécanisme en libellé.
- **Une flèche va de l'appelant à l'appelé.** La donnée peut revenir dans
  l'autre sens : la flèche montre qui prend l'initiative.
- **Le libellé d'une flèche suit la forme `protocole · ce qui circule`** :
  `HTTPS · GraphQL`, `git push · veille.json`, `REST Contents · .md`,
  `stdio · JSON-RPC`. En `detail-<morceau>`, c'est `fonction() → Type` :
  `analyse_post() → Fiche`.
- **Variantes** : `emphasis` pour le chemin principal, `security` pour un
  passage authentifié (jeton, cookie), `dashed` pour un appel facultatif ou
  asynchrone.
- **Logos** : champ `brand`. La liste vient de
  `node ~/.claude/recap-system-100s/archify/archify/bin/archify.mjs brands --json` (Python, Next.js, SQLite,
  Cloudflare, GitHub, GitHub Actions, Gemini, Claude, OpenAI, Supabase, Vercel,
  Docker, PostgreSQL…). Pas de correspondance : pas de logo, jamais un logo voisin.
- **Chaque boîte pointe vers le code.** `meta.repository` (URL d'origin sans
  identifiants, commit de 40 caractères) et des `sources` (chemin, lignes) sur
  chaque boîte ; dessiner avec `--repo-root`. Les lignes sont lues au commit
  épinglé (`git show HEAD:<fichier>`), pas dans la copie de travail. Un fichier
  pas encore commité ne peut pas servir de preuve : le dire dans le `tag` de
  la boîte.
- **Le vocabulaire d'architecte est le bienvenu** (CDN, runtime, webhook,
  export statique), avec les noms exacts des outils. La légende reste en
  français : « Code qui s'exécute », « Service tiers (API) », « Stockage ».

## 3. Les cartes de texte (`cards`)

Toujours ces quatre, dans cet ordre :

1. **Les couches** (`cyan`) : une ligne par couche présente (front, back,
   données, IA, hébergement) avec les technos et leurs versions.
2. **Ce qu'il n'y a pas, et pourquoi** (`rose`) : les passerelles, l'agentique,
   les files de messages ou la base serveur absentes, et ce qui joue leur rôle
   à la place (« pas d'AI Gateway : analyse.py passe seul au modèle suivant »).
3. **Déclencheurs** (`amber`) : ce qui lance chaque morceau (tâche planifiée,
   cron, commit, clic).
4. **Secrets (noms seulement)** (`violet`) : chaque variable et où elle vit,
   puis un renvoi vers `RESSOURCES.md`.

## 4. Placement qui marche

Ce qui a marché du premier coup sur une vue haut niveau (`architecture`) et une
vue bas niveau (`detail-<morceau>`) :

- `detail-<morceau>` se dessine en type `architecture`, pas en `dataflow` : le
  `dataflow` a des rangées fixes (114 px) et un routage simple, ses libellés à
  deux lignes chevauchent les boîtes dès que le graphe est dense (essai du
  06/10/2026).
- Le point d'entrée qui appelle tous les modules (`__main__.py`, `main.ts`,
  `app.py`) devient une `region` qui entoure la rangée des étapes, avec la
  fonction en libellé, au lieu d'une boîte reliée à tous : le moteur groupe
  les points d'accroche au milieu de chaque côté, et les flèches d'un tel
  « moyeu » s'emmêlent.

- Trois rangées : services en ligne en haut, chemin principal au milieu,
  stockage et sorties secondaires en bas.
- Les zones en colonnes, de gauche à droite dans l'ordre du chemin principal ;
  aucune boîte étrangère ne doit tomber dans le rectangle d'une zone.
- Le nœud central plus grand (`size` 200 × 110) quand il a plus de quatre
  flèches ; ses branches vers le haut et le bas partent du côté droit
  (`fromSide: "right"`).
- Entre deux boîtes reliées par un libellé, laisser `6,5 px × caractères + 21 px`.
