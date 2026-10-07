# La charte par défaut en mouvement (celle de 100s)

La charte que le modèle porte d'origine, celle du site luca100s.fr. Tout est déjà dans
`modele/src/charte.ts` et `modele/src/elements.tsx` : s'en servir plutôt que réinventer.

**Si le projet a sa propre DA**, ses couleurs, ses polices et son logo remplacent ceux d'ici
(dans `charte.ts` et `elements.tsx`) ; le reste vaut pour tous les films : un seul accent, les
signatures (surlignage, traînée, coins arrondis), le mouvement et le contenu.

## Couleurs

- Fond **papier** `#f2f1ed` (en 3D : fond, brouillard et sol papier). Plaque **encre** `#16110c`
  possible pour un plan de respiration.
- **Un seul accent : l'orange `#ff5f00`.** Pour ce qui compte (le mot-clé d'un titre, ce qui est
  vérifié, le sommet d'une tour). Un plan tout orange n'est permis qu'un instant, comme un climax.
- Gris de texte `#5b544d` et `#9a918a`. Cartes blanches à filet `rgba(22,17,12,0.10)`.
- Jamais : dégradé violet-bleu « IA », bokeh, fond animé gratuit (« trop IA »).

## Typographie

- **Funnel Display** pour les titres : graisse 500, interlettrage −0,045 em, interligne ≈ 1.
- **Funnel Sans** pour le texte courant.
- **Martian Mono** en capitales pour les étiquettes, comme sur le site : `[ LES SUJETS ]`, `■ VEILLE`.
- **Doto** (graisse 900) pour les chiffres, en compteurs à rouleaux (`Odometre`).
- Tailles en 1920 × 1080 : titre 80 à 150 px, texte important ≥ 44 px, étiquettes 22 à 24 px.
  Marges : 110 px sur les côtés, 90 px en haut et en bas.

## Les signatures

- **Le surlignage** (`Bloc`) : un ou deux mots sur une barre pleine qui se déploie de gauche à
  droite, texte blanc sur orange, ou encre sur blanc. Sur un fond chargé (3D, capture), chaque
  ligne de titre sur sa barre blanche : c'est lisible et c'est le style du site.
- **La traînée** : un élément arrive orange vif et s'éteint vers sa couleur finale ; dans une
  suite d'éléments, la tête orange court le long du tracé. C'est le logo (le S en pixels,
  `PIXEL_ORDRE`, `TRAINEE_CLAIR`) : l'utiliser pour les apparitions en série.
- **Le pixel / le cube arrondi** : la brique de base, en 2D (carrés arrondis) comme en 3D (cubes).
- Les chiffres sur une carte blanche à filet, comme le bloc « 100s en chiffres ».
- **Sur une scène claire et chargée** (fiches blanches, pages), les titres passent sur des barres
  **orange, texte blanc**, et le compteur sur une carte orange, chiffres blancs : ça ressort. Barres blanches seulement sur un fond qui contraste.
- Les captures du site et les fresques ont toujours des **coins arrondis**.
- Le film se termine sur le **logo complet** du projet (pour 100s : « luca100 » + S), même si
  l'adresse le répète dessous.

## Le mouvement

- Arrivées en **longue traîne** (`TRAINE`, bezier 0.16, 1, 0.3, 1) ; transitions en
  `DOUX` (ease-in-out). **Jamais de rebond.**
- Chaque élément arrive à son tour (mot à mot, carte après carte) ; jamais tout posé d'un coup
  puis figé (effet diaporama), jamais d'éléments qui flottent chacun de leur côté (économiseur d'écran).
- **Tout sur la grille de la musique** : `t(n)` = image du temps n. Coupes sur les mesures
  (tous les 4 temps), apparitions sur les temps et demi-temps, bruitage au même instant.
- Animer uniquement avec `useCurrentFrame()` + `interpolate()` / `spring()`. Pas de transition
  ni d'animation CSS (elles ne se rendent pas).
- Un plan tenu doit encore vivre un peu (poussée de caméra lente, dérive), sans bouger le texte.

## Le contenu

- Que du vrai : chiffres relevés (et relus avant chaque rendu par `donnees.mjs` s'ils bougent),
  vraies pages en capture, vrais noms. Ne jamais inventer une statistique.
- Rien de confidentiel : ni secret, ni donnée personnelle, ni compte privé à l'écran.
- Le texte de la vidéo reprend les mots du site quand ils existent.
