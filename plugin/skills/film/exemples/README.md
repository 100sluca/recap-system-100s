# Exemples

Les deux films du site luca100s.fr (07/10/2026), copiés tels quels de leur atelier : à lire pour la méthode, pas à recopier.
Ils sont dans le style « Monde en cubes » et la marque 100s, et datent d'avant les DA par rôles :
leurs imports `../charte`, `../elements` attendent l'ancienne charte (`C.papier` = `C.fond`,
`C.orange` = `C.accent`, `C.blanc` = `C.surface` ou `C.surAccent`, `C.gris` = `C.doux`,
`COULEURS3D.orange` = `COULEURS3D.accent`), et `PixelS`, `Logo`, `PIXEL_ORDRE` sont désormais dans
`marques/100s/marque100s.tsx`. Pour les autres styles, l'exemple complet est l'aperçu du style :
`modele/src/styles/<id>/Apercu.tsx`.

- `100s-v1/` : le film 2D (9 scènes, une par fichier). Rejeté comme trame : il
  reprenait l'histoire de l'essai HyperFrames. Bon pour les composants 2D.
- `100s-v2/` : « Un matin de veille », le film 3D. `donnees.ts` (le monde), `choregraphie.ts`
  (l'état de chaque cube à chaque image, la caméra), `Monde.tsx` (la scène), `Calques.tsx`
  (les textes), `Son3D.tsx`, `STORYBOARD-v2.md`.
- `pitch-pyltech.md` : un pitch de voix off (12/10/2026, projet Pyltech · slides multi-agent) :
  problème, solution, comment ça marche, preuve, fin ; 150 mots, environ 45 s en voix IA. Voir
  `references/pitch.md`.
