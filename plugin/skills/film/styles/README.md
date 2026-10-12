# Les styles de motion

Un film a **une DA** (les couleurs, les polices, le logo : `references/da.md`) et **un style** (la
façon dont les choses bougent, la caméra, le rythme). Les deux sont indépendants : la DA d'un client
peut se jouer dans n'importe quel style. Le style se choisit avec l'utilisateur, sur des aperçus,
avant le storyboard.

## Ce que Luca aime (12/10/2026)

Les styles viennent de ses références (promptsmotion.com, youmind.com), pas d'un guide générique.
Leur ADN commun, à garder dans **tous** les films :

- **On voit le produit s'utiliser** : sa vraie interface recréée (fenêtre, champ, bouton, carte,
  téléphone), un curseur qui glisse et clique, du texte qui se tape, un résultat qui arrive.
- **La caméra ne s'arrête jamais** : les plans entrent déjà en mouvement et décélèrent
  (exponentielle), elle zoome sur l'interface, suit un élément, recule pour tout montrer.
- **Le flou de mouvement** sur tout ce qui va vite (`Flou`, 6 sous-images) : c'est ce qui fait « pro ».
- **Un élément qui relie les scènes** : un point, une balle, une forme qui se transforme, une couleur
  qui inonde l'écran puis se rétracte dans l'objet suivant. Chaque moment naît du précédent.
- Grande typo propre, phrases centrées entre deux moments d'interface, fin sur le logo.
- Fond blanc lumineux ou noir profond, **un seul accent** ; verre, brume et lueurs permis quand ils
  font partie de l'interface (le look keynote), jamais en décor gratuit.
- Ses goûts de toujours : la **3D**, les **messages qui s'envoient**, tout ce qui est **fluide**.

## Un style de montage, la DA du client

Un style est une **façon de monter** (keynote, démo produit, fil conducteur, teaser, plan-séquence) ;
il se joue dans **la DA du projet ou du client**, qu'il réinterprète à sa façon :

- **Les polices de la marque, toujours** (titre, texte, mono ; `appoint` pour un mot en italique ou
  un caractère, sinon la police de titre). Aucun style n'impose les siennes : celles des palettes du
  catalogue ne servent que quand le projet n'a pas de DA.
- **Ses seules couleurs** (plus le blanc, le noir et les objets réels : coque d'un téléphone,
  pastilles d'une fenêtre Mac, barre de menu). Le style change leur **rôle** : la démo produit et le
  teaser passent la marque au noir (son encre devient le fond), la keynote et le plan-séquence au
  clair, le fil conducteur la garde telle quelle (`adapterDA`).
- **Son logo** (`da.logo`), sinon son initiale sur sa couleur.
- Si l'utilisateur veut un film au même mode que son site (une marque claire qui reste claire en
  démo produit, par exemple), le dire : on garde alors le fond de la marque et on règle les contrastes.

## Le catalogue

| N° | Style | En un mot | Pour | D'après |
|:-:|---|---|---|---|
| 1 | [Keynote](keynote.md) | la keynote : fenêtre, curseur, barre de menu, panneau de verre, coupes sur le temps | lancement d'un produit, app, outil | « Frame by Frame », CloudJoi |
| 2 | [Démo produit](demo.md) | la démo pas à pas dans le noir, étapes numérotées, légendes qui s'allument | outils, IA, SaaS | Brieform, AgentHud, Spotify |
| 3 | [Fil conducteur](fil.md) | un seul point traverse tout, rebondit, inonde, des mots tournent en 3D | une marque, une idée, un système | le point orange, la balle blanche |
| 4 | [Teaser](teaser.md) | bande-annonce : noir, faisceaux, signe qui s'embrase, mur de cartes | une annonce, une sortie | le teaser de feuille de route |
| 5 | [Plan-séquence](sequence.md) | un seul plan : zoom sur la saisie, recul au téléphone, inondation, résultat | une app, un parcours de bout en bout | Food craving, CloudJoi |
| 6 | [Court-métrage 3D](court-metrage.md) | une vraie scène 3D et une petite histoire : la rue à l'heure bleue, le produit sur un écran, le jour qui se lève (en option, plus long à écrire) | un récit, une ambiance | le premier tram du matin |
| 7 | [Monde en cubes](cubes.md) | l'essaim de cubes des films 100s (masqué : seulement sur demande) | les films de 100s | exemples/100s-v2 |

Les aperçus livrés (même contenu, chaque style dans sa palette, avec le flou de mouvement) :
`styles/apercus/catalogue.html` (la grille), `catalogue.mp4` (tous à la suite), `<id>.mp4`.

## Faire choisir le style

1. Si l'utilisateur a déjà nommé un style (« comme une keynote », « en plan-séquence », « un
   teaser »), le prendre et passer.
2. Sinon, une fois la DA posée dans l'atelier, rendre **les aperçus dans la DA du projet** :
   écrire `<atelier>/apercus.json` avec le vrai contenu (nom, phrase, accroche, une demande qu'on
   fait au produit et sa réponse, un vrai chiffre, trois mots-clés, l'adresse), puis
   `node OUTILS/apercus.mjs <atelier>` (quelques minutes avec le flou ; `--rapide` sans flou pour un
   essai). L'utilisateur voit **son** projet dans chaque style. Sans le temps : les aperçus livrés.
3. Montrer : ouvrir `catalogue.html` (Windows : `start "" "<chemin>"`, macOS : `open`), ou envoyer
   `catalogue.mp4` si l'outil d'envoi de fichiers existe. Puis demander par une question à choix les
   **trois styles qui conviennent le mieux**, le premier « (Recommandé) » avec sa raison en une
   ligne, et **le court-métrage 3D toujours en quatrième option** (« une petite histoire en 3D, plus
   longue à écrire »), sauf si l'utilisateur l'a écarté. Le Monde en cubes, jamais d'office.
   L'utilisateur peut aussi répondre par un numéro du catalogue (« Autre »).

## Mélanger

Un style **principal** (la grammaire du mouvement) et, au plus, un **invité** pour un moment précis.
Bons mélanges : Keynote + Plan-séquence (le panneau de verre devient un plan continu), Démo produit +
Fil conducteur (un point relie les étapes), Teaser en ouverture d'une Démo produit.

## Ce que chaque style apporte au code

`modele/src/styles/interface.tsx` : les briques communes (`Flou`, `Curseur`, `suivre`, `FenetreMac`,
`Verre`, `Halo`, `tape`, `Caret`, `IconeProduit`, `Phrase`, `EXPO`, `FOUET`). `commun.tsx` : le
contenu, `camera2D`, `prog`, `ressort`, `adapterDA(id, da)` (la DA de la marque réinterprétée pour le
style : la démo et le teaser la passent au noir, la keynote et le plan-séquence au clair). Chaque
style : `src/styles/<id>/Apercu.tsx` (l'exemple complet, à lire avant d'écrire le film) et, s'il en a,
`kit.tsx`. Dans un film : `const da = adapterDA('<id>', DA_FILM)` puis `<AvecDA da={da}>`, et tout le
film dans `<Flou>`.

## Ajouter un style

Un dossier `modele/src/styles/<id>/` (aperçu + kit), une entrée dans `catalogue.json` (palette
propre, `source: "style"`, `duree` en images, `references`), une ligne dans `apercus.ts`, un cas dans
`adapterDA`, une fiche `styles/<id>.md`, puis refaire les aperçus livrés :
`node OUTILS/apercus.mjs <atelier> --da style --sortie styles/apercus`.
Mieux : partir d'une **référence que l'utilisateur aime** (une vidéo) et la regarder image par image
avant d'écrire, comme pour ces cinq-là.
