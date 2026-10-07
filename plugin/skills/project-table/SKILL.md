---
name: project-table
description: "Crée ou met à jour RESSOURCES.md d'un projet de code (dans __recap-system-100s/2-ressources/, sinon à la racine) : des tableaux courts qui recensent tout ce que le projet sollicite (comptes et adresses e-mail, services comme Cloudflare, Supabase, Google Cloud, GitHub, Vercel ; URL déployées ; variables d'environnement ; clés d'API et leur fournisseur, avec une case pour la clé ; jetons et scopes ; API publiques ; ports), sans aucun mot de passe ni secret. Utiliser ce skill dès que l’utilisateur parle de tableau des ressources, d'inventaire, de variables d'environnement, de clés d'API, de jetons, de scopes, de « quel compte Google », de « quel projet Supabase », de « qu'est-ce qu'on utilise », de RESSOURCES.md, ou dès qu'un projet ajoute un service, un compte, une clé, une variable ou un déploiement, même s'il ne demande pas explicitement le tableau."
---

# project-table : les ressources d'un projet, en tableaux

## Pourquoi

On a souvent plusieurs comptes Google, plusieurs projets Supabase et plusieurs
clés d'API liées à des comptes différents. Au retour sur un projet, les questions
sont toujours les mêmes : avec quel compte ? quel projet Google Cloud ? quelle
clé, chez quel fournisseur, rangée où ? quel jeton, avec quels droits ? quelle
adresse en ligne ?

La réponse tient dans **un seul fichier, `RESSOURCES.md`** : quelques
tableaux qui donnent d'un coup d'œil l'envergure du projet et tout ce qu'il
sollicite. Il vit dans `__recap-system-100s/2-ressources/` à la racine du projet, le dossier
du récap (skill `recap-system-100s`). Un projet qui ne suit pas encore le
système le garde à sa racine. Ce skill produit ce fichier et le tient à jour.
C'est un inventaire, pas une documentation : une ligne par ressource, pas de
paragraphe.

## Règle absolue : aucun secret dans le fichier

- **Jamais** de mot de passe, de clé d'API, de jeton, de secret client, de
  cookie ou de chaîne de connexion avec mot de passe. On note le **nom** de la
  variable, le **format attendu** (ex. `AIza…`, `sk-…`, `pk-lf-…`) et **où**
  elle est stockée.
- Les **adresses e-mail des comptes** et les **identifiants de projet** (ID de
  projet Google Cloud, référence Supabase, nom de projet Cloudflare) sont
  autorisés et même attendus : c'est ce qui permet de s'y retrouver.
- Une valeur lue par hasard dans un `.env` ne se recopie pas. On écrit
  seulement « valeur présente dans `.env` ».
- La colonne « Ta clé » du tableau 4 reste **vide dans `RESSOURCES.md`**. Si
  l'utilisateur veut y noter ses clés, on crée une copie `RESSOURCES.local.md`, on
  l'ajoute au `.gitignore` **avant** de la remplir, et on vérifie avec
  `git check-ignore -v RESSOURCES.local.md`. On ne remplit jamais cette case
  soi-même : c'est l'utilisateur qui la remplit.

## Démarche

1. **Chercher avant de demander.** Parcourir le dépôt, sans `node_modules`,
   `.next`, `out`, `dist`, `.venv` ni les caches :
   - `.env.example`, `.env*` (noms seulement), `.dev.vars`,
     `wrangler.toml|json`, `vercel.json`, `netlify.toml`,
     `docker-compose*.yml`, `supabase/config.toml`, `firebase.json` ;
   - `.github/workflows/*.yml` : `secrets.*`, `vars.*`, `permissions:` ;
   - dans le code : `process.env.*`, `import.meta.env.*`, `os.environ`,
     `os.getenv`, `Deno.env`, `env.` des Workers ;
   - les appels sortants (`fetch`, SDK) vers des API tierces, les URL en dur
     de sites déployés (`*.pages.dev`, `*.vercel.app`, domaines), les ports
     des scripts `dev` ;
   - les README et les guides d'installation, qui citent les comptes, les
     consoles et les étapes manuelles.

   Pour un gros dépôt, déléguer ce balayage à un agent Explore et lui
   interdire d'afficher les valeurs secrètes.
2. **Demander ce que le code ne peut pas savoir**, en une seule question
   groupée :
   - l'adresse e-mail du compte utilisé pour chaque service ;
   - le nom ou l'ID du projet dans chaque console (Google Cloud, Supabase,
     Cloudflare, Vercel…) ;
   - la date d'expiration des jetons.

   Ne **jamais deviner** une adresse e-mail. Écrire « à préciser » et
   continuer.
3. **Écrire ou mettre à jour `RESSOURCES.md`** avec le modèle
   [`RESSOURCES.template.md`](RESSOURCES.template.md) : même ordre de
   tableaux, mêmes colonnes. Supprimer un tableau qui resterait vide, sauf le
   tableau 1 (Comptes). Si le fichier existe déjà, compléter les lignes sans
   réécrire ce que l'utilisateur a ajouté à la main.
4. **Relire** le fichier en cherchant des motifs de secrets (`AIza`, `sk-`,
   `ghp_`, `github_pat_`, `gho_`, `eyJ` (JWT), `-----BEGIN`, `password=`,
   `postgres://…:…@`). S'il en reste un, le retirer avant tout commit.
5. **Signaler** à l'utilisateur ce qui reste « à préciser » et ce qui a changé depuis
   la dernière version.

## Les tableaux (ordre fixe)

1. **Comptes** : quel compte, chez qui, pour quoi faire.
   Colonnes : Fournisseur · Compte (adresse e-mail ou identifiant, jamais de
   mot de passe) · Organisation / projet / ID dans la console · Sert à ·
   Lien console.
2. **Services et adresses** : chaque plateforme et chaque URL produite.
   Colonnes : Source · Ressource · Adresse · À quoi ça sert · Projet ou
   dossier · État (actif, à créer, écarté).
   Les services **écartés** vont en une ligne sous le tableau, avec la raison.
3. **Variables d'environnement** : une ligne par variable.
   Colonnes : Source · Projet · Où la définir (fichier `.env`, secret
   Cloudflare, variable GitHub Actions…) · Variable · Valeur attendue (format,
   jamais la valeur) · Obligatoire · Lien.
4. **Clés d'API et fournisseurs** : qui fournit quoi.
   Colonnes : Fournisseur · Type (LLM, paiement, e-mail, stockage, carte…) ·
   API ou modèle · Sert à · Compte lié (renvoie au tableau 1) · Variable · Où
   elle est stockée · Offre (gratuite, payante, quota) · **Ta clé** (vide ;
   à remplir seulement dans `RESSOURCES.local.md`).
5. **Jetons, accès et scopes** : ce qui est autorisé, et jusqu'où.
   Colonnes : Fournisseur · Jeton ou accès · Scopes et droits exacts (ex.
   GitHub fine-grained « Contents : Read and write » sur un seul dépôt ;
   OAuth `https://www.googleapis.com/auth/drive.readonly` ; rôle Supabase
   `anon` ou `service_role`) · Utilisé par · Où il est stocké · Expiration ·
   Lien pour le créer ou le révoquer.
6. **API publiques sans clé** : Source · Adresse · Usage · Projet.
7. **Ports locaux** : Port · Service · Commande.

Tableaux optionnels, seulement s'ils servent : **Domaines et DNS** (domaine,
registraire, où pointent les DNS) ; **Webhooks** (émetteur, adresse, secret de
signature : nom seulement) ; **Coûts** (service, offre, plafond, alerte).

## Style

- En français, phrases courtes, pas de jargon inutile : on doit pouvoir
  relire le fichier en deux minutes.
- En tête du fichier : la date de mise à jour et la mention « aucune valeur
  secrète ici ».
- Liens directs vers la bonne page de console (création de clé, réglages des
  secrets, révocation) plutôt que vers l'accueil du fournisseur.
- Une ressource partagée par plusieurs sous-projets tient sur une ligne ; on
  liste les projets dans la colonne Projet.
- Pour un monorepo ou plusieurs dépôts liés, un seul `RESSOURCES.md` à la
  racine commune, avec une colonne Projet.

## Commit

`RESSOURCES.md` se versionne : il ne contient aucun secret.
`RESSOURCES.local.md` ne se versionne jamais. Si un commit sur la branche
principale déclenche un déploiement pour rien (Cloudflare Pages, par exemple),
ajouter `[CF-Pages-Skip]` (Cloudflare) ou `[skip ci]` au message. Ne commiter
que si l'utilisateur le demande, ou si le projet a déjà cette habitude.
