# Écrire le storyboard

Avant toute ligne de code, une fois **la DA** (`references/da.md`) et **le style** (`styles/`)
choisis. Fichier `<atelier>/STORYBOARD.md`. Il commence par trois lignes : la DA (d'où elle vient),
le style (et l'éventuel style invité), la musique (et pourquoi elle va avec ce style). Exemples
réels : `exemples/100s-v2/STORYBOARD-v2.md` (style Monde en cubes) ; le film Gamaths v2 « Le cahier »
(vrais composants de l'interface sur une feuille à carreaux en perspective, sans Three.js).

## D'abord, l'histoire

- **Une phrase** : ce que la vidéo doit faire comprendre. Elle vient du projet (ce qu'il fait
  vraiment, pour qui, avec quoi), pas d'un modèle de vidéo.
- **Une idée visuelle qui porte tout le film**, propre au projet **et** dite dans la langue du
  style. Keynote : la vraie fenêtre, la vraie demande tapée, la vraie page de résultat.
  Démo produit : les vraies étapes, avec les vrais outils qui tournent. Fil conducteur : un point
  qui porte le vrai chiffre et les vrais mots-clés. Plan-séquence : le vrai parcours d'un
  utilisateur, sans coupe. Teaser : ce qui arrive vraiment.
- **Ne pas recycler la trame d'une autre vidéo** (question, promesse, chiffres, rubriques…), ni
  ses objets, ni sa musique : ça se voit tout de suite (les v1 de 100s et de Gamaths en ont fait les
  frais). Les « trames possibles » des fiches de style sont des points de départ, pas des recettes.
- Le mouvement suit la fiche du style : ses courbes, ses gestes, ses interdits.

## Puis le découpage

| Temps | Scène | Ce qui se passe à l'écran | Geste du style | Caméra | Texte à l'écran | Son |
|---|---|---|---|---|---|---|

- 40 à 60 s. À 105 temps/min : 8 temps ≈ 4,6 s ; 88 temps ≈ 50 s. Un format court (réseaux) :
  15 à 30 s.
- Une idée par scène, 8 ou 12 temps chacune ; les coupes ou les changements de rôle sur les
  mesures (multiples de 4 temps), le temps fort de la musique sur le moment fort de l'image. Avec
  une voix off, les plans suivent les phrases (`references/pitch.md`).
- Texte : 3 lignes au plus par scène, avec les mots du projet ; chiffres réels.
- Une scène de fin : le nom ou le logo, et une action (« Lire l'édition », « Essayer »…). Dans un
  duo, la signature selon l'équilibre choisi (`references/da.md`).
- Noter les bruitages au moment où ils tombent (ceux que la fiche du style conseille), et les
  **suites** : les étapes qui se suivent de près prennent le même son, de plus en plus aigu
  (`<Suite />`, `references/regles-communes.md`, « Le son »).
- Sous le tableau, **la carte des sons** : une ligne par sorte d'événement et le son qui lui
  revient, pris dans la palette de l'atelier (`public/son/sons.json`, par famille). Exemples :
  « clic de l'interface → clic-bouton », « une carte se pose → pop, en suite », « résultat →
  valide-objet ». Un même fichier ne sert pas plus de 3 fois dans le film (une suite compte pour
  une), et deux événements différents ne partagent pas un son.

## Avant de passer au code

Montrer à l'utilisateur le storyboard en quelques lignes (le fil de l'histoire, la durée, la DA,
le style, la musique), puis continuer sans attendre sa réponse : il corrigera en route.
