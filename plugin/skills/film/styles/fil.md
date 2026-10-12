# Style 3 · Fil conducteur

**D'après** le film du point orange (youmind.com/video-prompts/orange-dot-motion-film-12349) et le
système d'interface à la balle blanche (youmind.com/video-prompts/ui-motion-system-video-12350).

**L'idée.** **Un seul point de l'accent** relie tout le film, et chaque changement naît de lui. Il
est le bouton d'un interrupteur qu'un curseur bascule, devient le point final du nom, saute sur une
courbe de ressort qu'il trace en dépassant sa cible, inonde l'écran, se rétracte dans le noir où des
mots tournent autour de lui **en 3D**, puis une trame de points ramène le clair et la carte finale,
où il redevient le point du nom. Idéalement, la dernière image rejoint la première (boucle).

**Pour** : une marque, une idée, un système ; tout ce qui doit paraître fluide et maîtrisé. Variante
« balle » : la balle traverse les vrais composants de l'interface (interrupteur, curseur de valeur,
notifications, clavier qui tape, bouton d'envoi), la caméra la suit de près.

## La DA

- Palette propre : blanc chaud `#f1eee8`, encre `#121212`, point rose-rouge `#ff2d55` ; Bricolage
  Grotesque 800 pour les grands mots, Inter pour le reste.
- DA d'une marque (ses polices et ses seules couleurs, toujours) : telle quelle (`adapterDA('fil', …)`) ; le point prend l'accent.

## Le mouvement

- Le point : une seule fonction `point(f) → {x, y, r, couleur}` sur tout le film (voir l'aperçu) ;
  sauts en arc (`sin(π k)`), arrivées amorties ; il ne disparaît jamais.
- La courbe du ressort (`courbeRessort`) : dépasse d'environ 12 % et se pose ; le point la trace.
- L'inondation : le point grossit jusqu'à couvrir l'écran (14 images), puis se rétracte (14 images)
  en révélant le décor suivant.
- L'anneau 3D (`Anneau`) : les mots sur un cercle couché, en perspective CSS, qui tournent ; ceux de
  derrière se voient à l'envers. La trame (`Trame`) : une onde de points qui grossissent depuis le centre.
- Flou de mouvement sur tout (le point laisse une traînée quand il saute).

## Le son

Un son par geste du point : clic de l'interrupteur, « pop » à l'atterrissage, montée sur la courbe,
souffle grave sur l'inondation, nappe pendant l'anneau. Musique 110 à 125 temps/min, un geste par temps.

## Le code

`src/styles/fil/Apercu.tsx` et `kit.tsx` (`courbeRessort`, `Anneau`, `Trame`).

## Une trame possible

L'interrupteur du produit (sa vraie option) → le point devient le point de son nom → il trace le
vrai chiffre du projet → il inonde → les mots-clés tournent autour de lui → la carte finale.
