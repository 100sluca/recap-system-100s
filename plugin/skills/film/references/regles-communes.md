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

## Le son

**Les niveaux se calculent, ils ne se règlent pas à l'oreille.** Le morceau et chaque bruitage
sont mesurés à la création de l'atelier (`outils/sonie.mjs`), puis ramenés aux cibles de
`NIVEAUX` (`src/reglages.ts`). Les morceaux de la banque-son vont de −10 à −20 LUFS, ses bruitages
de −28 à −5 : un volume fixe donnait une musique 10 dB trop forte d'un film à l'autre. Gamaths v3
(12/10/2026) avait la musique à 10 dB seulement sous la voix ; Luca l'a trouvée trop forte, mais
seulement après le rendu.

| Ce qui joue | Niveau de base |
|---|---|
| La voix off (`voix.mjs` la met à −17 LUFS en mono) | −14 LUFS dans le film |
| La musique sous la voix | 18 dB sous la voix, −32 LUFS (réglage `musiqueSousVoix`) |
| La musique entre les phrases (avant, après, silence de plus de 1,5 s) | −20 LUFS |
| La musique d'un film sans voix off | −16 LUFS |
| Un bruitage à `volume={1}` | −14 LUFS (aussi fort que la voix) |
| Le film entier | −16 à −14 LUFS, crête sous −1 dB |

- **`<Musique />` sans `volume`.** Ne le passer que si le contrôle d'après rendu le conseille
  (0,7 ≈ −3 dB).
- **Les volumes des bruitages sont relatifs à la voix**, quel que soit le fichier :
  - 0,35 pour un accent net quand personne ne parle ;
  - 0,2 sous la voix ;
  - 0,12 pour un détail (touche, petite coche) ;
  - 0,5 et plus seulement pour un impact sans voix.
- **Le contrôle d'après rendu** (`rendre.mjs` le lance, `node OUTILS/sonie.mjs <atelier>` à la main).
  Il mesure trois choses :
  - la sonie du film ;
  - l'écart entre la voix et ce qui joue dessous (il retire la voix du film pour mesurer la musique
    et les bruitages seuls) ;
  - les moments où la voix est couverte.
  Corriger chaque alerte (⚠) avant de montrer le film à l'utilisateur.

**Varier les bruitages.** Luca, 12/10/2026 : toujours les mêmes, trop souvent dans le même film,
c'est abusif.

- La palette est large (une quarantaine de sons rangés par famille : clic, pop, apparition, swoosh,
  impact, montée, validation, notification, photo, note…). `nouveau.mjs` l'affiche, et
  `public/son/sons.json` la garde.
- **Un même fichier : 3 fois au plus par film**, hors suites (une suite compte pour une fois). Deux
  événements de nature différente prennent deux sons différents.
- Un bruitage souligne un événement qui compte : une apparition, une coupe, un vrai clic, une
  validation. Il ne souligne pas chaque mouvement. Plus rares sous la voix : c'est elle qui parle.
- Le storyboard tient une **carte des sons** (quel son pour quelle sorte d'événement) avant le code.

**Les suites qui montent.** Quand plusieurs étapes se suivent de près (2 à 8 étapes en moins de
10 s : des coches, des cartes qui se posent, les étapes d'un parcours) :

- prendre **le même son, un cran plus haut à chaque étape**, avec `<Suite src aux={[…]} volume />`
  de `Son.tsx` ;
- jusqu'à 4 étapes, Suite monte sur l'arpège majeur (do mi sol do) ; au-delà, sur la gamme majeure ;
- la hauteur change, pas la durée (`toneFrequency` de Remotion, vérifié à la mesure le 12/10/2026) ;
- la progression doit se sentir et satisfaire : la dernière étape peut recevoir en plus un son de
  validation.

`<Effet ton={n}>` (en demi-tons, de −12 à +12) sert pour un son isolé qu'on veut plus aigu ou plus
grave.

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
