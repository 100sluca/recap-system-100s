# La DA du film

La DA, c'est l'identité : les couleurs, les polices, le logo. Elle est dans `<atelier>/da.json`, lue
par `src/da.tsx`. Elle ne dit rien du mouvement : ça, c'est le style (`styles/`). **Il n'y a plus de
charte par défaut** : la charte de luca100s.fr est une marque parmi d'autres (`marques/100s/`), à ne
prendre que pour un film de 100s.

## D'où elle vient (dans cet ordre)

1. **Le projet a sa DA** (variables CSS, thème Tailwind, `components.json`, polices et logo du site) :
   la relever dans le code (couleurs exactes, polices `.woff2` du dépôt) ou sur le site déployé avec
   `node OUTILS/da.mjs <url> <atelier>/da-site`.
2. **Un client** (« je fais une vidéo pour X ») : sa DA sur son site,
   `node OUTILS/da.mjs <url du client> --marque <nom>` (rangée pour les prochaines fois dans
   `~/.claude/recap-system-100s/marques/<nom>/`).
3. **Un duo** (« la boîte où je travaille × le client ») : voir plus bas.
4. **Rien de tout ça** (un projet perso sans charte) : la palette propre du style choisi (elle est
   dans `src/styles/catalogue.json` ; `nouveau.mjs --style <id>` l'installe). Ou en inventer une avec
   l'utilisateur, à partir de ce que le projet évoque, mais jamais celle de 100s par défaut.

Toujours **montrer la DA avant le film** : la planche (`planche.png`, couleurs par rôle, polices,
bouton, capture du site) dans la conversation, et l'utilisateur corrige s'il le faut.

## Les rôles

| Rôle | Ce que c'est | Remarques |
|---|---|---|
| `fond` | le fond du film | la couleur qui couvre le plus le site |
| `surface` | cartes, bulles, fenêtres sur le fond | légèrement différente du fond |
| `encre` | le texte principal | la plus contrastée des couleurs de texte fréquentes |
| `doux`, `pale` | texte secondaire, étiquettes et traits | |
| `accent` | **la** couleur de la marque, pour ce qui compte | thème déclaré, variables « brand/primary », boutons |
| `surAccent` | le texte posé sur l'accent | blanc ou presque noir, au plus contrasté |
| `accent2` | une seconde couleur, rare | ou la couleur de la signature dans un duo |
| `filet` | bordures fines | l'encre à 10 % |

Polices : `titre`, `texte`, `mono` (et `chiffres`, `appoint` au besoin), chacune `{famille, graisse}`.
**Ce sont celles de la marque dans tous les styles** : un style ne remplace jamais une police de la
DA ; si une police manque (non copiable), la remplaçante est dite à l'utilisateur sur la planche. Le logo :
un fichier dans `public/marque/` (svg de préférence), ou `null` (le nom en texte, dans la police de
titre). Chaque style réinterprète ces rôles à sa façon (`adapterDA` dans `src/styles/commun.tsx`) :
la DA n'a pas à être refaite pour un style.

## Le relevé automatique (`outils/da.mjs`)

Il ouvre le site dans un Chrome sans fenêtre, regarde ce qui est vraiment à l'écran (une grille de
points sur les trois premiers écrans pour les fonds ; le texte pesé par longueur et taille ; les
boutons ; les liens ; les variables CSS de `:root` ; la couleur de thème) et propose les rôles. Il
peut se tromper : un bandeau de cookies, une photo, un badge vert pris pour l'accent (c'est arrivé
sur linear.app). **Regarder la planche, comparer avec le site, corriger `da.json` à la main.**

Puis `node OUTILS/da.mjs --appliquer <dossier ou nom de marque> <atelier>` : `da.json`, les polices
(dans `public/fonts/` et `polices.json`), le logo (dans `public/marque/`).

## Les polices et leurs licences

- **Google Fonts** (et Bunny Fonts) : licences libres (OFL, Apache) → copiées sans question.
- **Polices servies par le site lui-même** (fichiers sur son domaine) : copiées seulement avec
  `--polices-du-site`, et seulement si l'utilisateur confirme que c'est la police du client pour un
  film du client, ou qu'il en a la licence. Le dire dans la réponse.
- **Adobe Fonts, Typekit, Monotype, fonts.com, MyFonts** : jamais copiées. La DA prend la police libre
  la plus proche parmi celles du modèle (Inter, Space Grotesk, Archivo Black, Bricolage Grotesque,
  Instrument Serif, JetBrains Mono, Funnel), et `releve.json` le note.
- Une police du projet (dans son dépôt, sous licence connue) : copier le `.woff2` dans
  `public/fonts/` et ajouter sa ligne à `public/fonts/polices.json`.

## Le duo : l'entreprise où l'on travaille × le client

Deux marques dans un même film. Demander à l'utilisateur l'équilibre (question à choix) :

1. **Le client d'abord, signature discrète** (par défaut, pour une vidéo livrée au client) : toute la
   DA est celle du client ; l'entreprise n'apparaît qu'à la fin, « Réalisé par » + son logo en petit,
   et sa couleur au plus dans `accent2`, sur la signature seulement.
2. **Partenariat à égalité** (annonce commune, co-création) : fond et encre du client, `accent` du
   client et `accent2` de l'entreprise, à parts égales ; à la fin, les deux logos côte à côte, même
   hauteur optique, séparés par un « × » fin dans `pale`.
3. **L'entreprise d'abord, le client invité** (étude de cas, portfolio de l'entreprise) : la DA de
   l'entreprise, le client présent par son logo et ses vraies pages (captures), sa couleur en `accent2`.

Dans `da.json`, l'autre marque va dans `signature` : `{"nom": "…", "logo": "marque/autre-logo.svg",
"couleur": "#…"}`, `source: "duo"`. Relever les deux sites (`da.mjs … --marque <nom>` pour chacune ;
la marque de l'entreprise se relève une fois pour toutes), puis écrire le duo à la main.

## Rien de confidentiel

Le relevé ne garde que ce que le site montre publiquement. Ne jamais mettre à l'écran une page
privée du client (tableau de bord, données) sans son accord explicite.
