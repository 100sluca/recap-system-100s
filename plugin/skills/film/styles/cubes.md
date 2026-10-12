# Style 7 · Monde en cubes

**L'idée.** Un seul monde 3D sur un sol qui reçoit les ombres ; un « pool » fixe de centaines de
cubes arrondis qui change de rôle de scène en scène (horloge, flux de fiches, tours, chiffres, logo),
une caméra qui vole d'un lieu à l'autre.

**À ne pas proposer d'office.** C'est le style des films de luca100s.fr (v1 à v4), de Gamaths v1 et
de Pyltech v1 : on le reconnaît tout de suite, et Luca a rejeté la v1 de Gamaths pour cette raison.
Seulement si l'utilisateur le demande, et alors **avec la DA du projet**, jamais le papier et
l'orange de 100s.

## La DA

- Palette propre du catalogue (pour l'aperçu) : gris bleuté `#e9edf0`, encre `#1d2731`, accent vert
  `#00a884`. Avec une DA de marque : prise telle quelle (sol et brouillard de la couleur du fond,
  cubes dans la surface, la traînée dans l'accent).
- La charte de 100s n'est plus le défaut : c'est la marque `marques/100s/` (`da.mjs --appliquer 100s`).

## Le mouvement, le kit, les recettes

Tout est dans `references/recettes-3d.md` (le pool de cubes, `etat(i, f)`, la caméra à clés, les
pages posées dans le monde, les chiffres en cubes, le logo en relief) et dans l'exemple complet
`exemples/100s-v2/`. Le kit : `src/monde/kit3d.tsx` (`Scene3D`, `Cubes`, `GrosCube`, `Page`,
`Lettres3D`) et `src/monde/outils3d.ts`. Longue traîne, jamais de rebond, tout sur la grille de la
musique. L'aperçu : `src/styles/cubes/Apercu.tsx`.

## Le son

100 à 110 temps/min ; une suite qui monte (`<Suite />`) pour les cubes qui se posent en série,
souffles sur les vols. Pas
`musique-qui-bouge.mp3` : déjà utilisée par les films 100s.
