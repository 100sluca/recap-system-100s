# Les règles de tous les films, quel que soit le style

Le style décide de la grammaire du mouvement (rebond ou pas, coupes ou plan-séquence, 2D ou 3D) ;
la DA décide des couleurs et des polices. Ce qui suit vaut pour tous.

## L'histoire

- **Une idée visuelle propre au projet**, jamais la trame d'un autre film (Luca a rejeté la v1 de
  Gamaths parce qu'elle reprenait celle du film 100s). Changer de style ne suffit pas : l'histoire,
  les objets à l'écran et la musique changent aussi d'un film à l'autre.
- **Que du vrai** : chiffres relevés sur le projet (et relus avant chaque rendu par `donnees.mjs`
  s'ils bougent), vraies pages, vrais mots de l'interface, vrais noms. Jamais une statistique inventée.
- Rien de confidentiel : ni secret, ni donnée personnelle, ni compte privé à l'écran.
- Une idée par scène ; 3 lignes de texte au plus par scène ; le texte reprend les mots du projet.
- Le film se termine sur le nom (ou le logo) et une action (« Essayer », l'adresse, la commande).

## Le rythme

- **Tout sur la grille de la musique** : `t(n)` = l'image du temps n. Coupes et changements de rôle
  sur les mesures (tous les 4 temps), apparitions sur les temps et demi-temps, bruitage au même
  instant que ce qu'il souligne.
- Chaque élément arrive à son tour (mot à mot, carte après carte) : jamais tout posé d'un coup puis
  figé (effet diaporama), jamais des éléments qui flottent chacun de leur côté (économiseur d'écran).
- Un plan tenu doit encore vivre (caméra qui pousse, objet qui tourne, paquets qui circulent), sans
  bouger le texte qu'on lit.

## La lecture

- 1920 × 1080. Titres de 80 à 170 px, texte important ≥ 40 px, étiquettes ≥ 22 px. Marges de 110 px
  sur les côtés, 90 px en haut et en bas ; rien d'important dans les 10 % de chaque bord.
- Un texte reste au moins le temps de le lire deux fois. Contraste du texte sur son fond ≥ 4,5.
- Jamais un objet devant un titre : vérifier sur la planche d'images clés.

## Le code (Remotion)

- Tout ce qui bouge vient de `useCurrentFrame()` (+ `interpolate`, `spring`, les outils de
  `styles/commun.tsx`). Aucune animation ni transition CSS, aucune horloge, aucun `useFrame()` de
  react-three-fiber : ils ne se rendent pas, ou scintillent.
- Le hasard : `random('clé')` de Remotion (reproductible).
- Les couleurs par rôle (`C.accent`, `da.couleurs.fond`…), jamais une teinte en dur dans un film.

## Ce qui fait « pro » (ce que Luca aime, dans tous les styles)

- **On voit le produit s'utiliser** : sa vraie interface recréée, un curseur qui clique, du texte
  qui se tape, un résultat qui arrive. Pas des titres qui glissent sur un fond.
- **La caméra ne s'arrête jamais** : plans qui entrent en mouvement et décélèrent, zooms sur
  l'interface, poussées lentes pendant les plans tenus.
- **Le flou de mouvement** (`<Flou>` de `src/styles/interface.tsx`) sur tout ce qui va vite.
- **Un élément qui relie les scènes** (un point, une forme, une couleur qui inonde) : chaque moment
  naît du précédent.

## Ce qui fait « IA » (à éviter)

Dégradés violet-bleu en fond, bokeh, particules décoratives, fonds animés sans raison, texte qui
tremble, transitions toutes faites (fondu enchaîné, zoom de diaporama) quand le style ne les demande
pas. Le verre, la brume et les lueurs ne sont permis que là où ils font partie de l'interface (le
panneau de verre d'une keynote, le halo d'un champ de saisie, la lueur d'un teaser), jamais en décor.
