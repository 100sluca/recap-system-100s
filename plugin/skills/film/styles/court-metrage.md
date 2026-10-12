# Style 6 · Court-métrage 3D (en option)

**D'après** « le premier tram du matin » (youmind.com/video-prompts/morning-tram-code-animation-12384) :
91 secondes écrites entièrement en code avec Three.js, sans modèle vidéo ni objet 3D téléchargé.

**L'idée.** Une vraie scène 3D et une petite histoire, plutôt qu'une démonstration : une ville au
lever du jour, un tram qui sort du dépôt, une mère et son enfant en retard, le soleil qui monte. Les
volumes sont simples (boîtes, cylindres, fenêtres éclairées), la lumière fait tout (soleil bas, ciel
dégradé, lampadaires, brouillard), la caméra est celle d'un film (travellings, plans larges, gros plans).

**Pour** : un récit, une ambiance, un projet qu'on raconte par une histoire (une association, un
lieu, une démarche). Luca le trouve « super stylé, probablement pas utile pour nos projets » : à
garder, à proposer quand le sujet s'y prête.

**Pas encore d'aperçu** : c'est le plus long à écrire et à rendre (une minute de film = plusieurs
heures de travail et un rendu 3D lourd, sans flou de mouvement par sous-images). Avant de se lancer,
prévenir l'utilisateur du coût et faire valider le scénario en 5 à 8 plans.

## Comment le faire

- Le kit Three.js du modèle (`src/monde/`, `@remotion/three`) et les règles de `references/recettes-3d.md`
  (tout par `useCurrentFrame()`, jamais `useFrame()`).
- Une scène = un monde fixe (rues, bâtiments en instances, véhicules en groupes de boîtes arrondies),
  des personnages en formes simples (capsules), une caméra à clés (`cameraDepuisCles`).
- La lumière par plan : `hemisphereLight` (ciel / sol), un soleil (`directionalLight` avec ombres) dont
  la couleur et l'angle suivent l'heure, des points de lumière chauds (fenêtres, lampadaires), du
  brouillard couleur ciel.
- Palette propre : nuit bleue `#1b2233`, lumières ambrées `#f2b14b`, crème `#f4efe6`.
