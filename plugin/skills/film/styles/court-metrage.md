# Style 6 · Court-métrage 3D (en option)

**D'après** « le premier tram du matin » (youmind.com/video-prompts/morning-tram-code-animation-12384) :
91 secondes écrites entièrement en code avec Three.js, sans modèle vidéo ni objet 3D téléchargé.

**L'idée.** Une vraie scène 3D et une petite histoire, plutôt qu'une démonstration : une rue à
l'heure bleue, quelqu'un qui se sert du produit, le jour qui se lève, un tram qui passe, l'enseigne
du projet qui s'allume sur un toit. Les volumes sont simples (boîtes, capsules, fenêtres éclairées) ;
**la lumière fait tout** (ciel en dégradé, soleil bas, lampadaires, brouillard) ; la caméra est
celle d'un film (travellings, plan par-dessus l'épaule, grue qui s'élève).

**Pour** : un récit, une ambiance, un projet qu'on raconte par une histoire (une association, un
lieu, une démarche, un outil du quotidien). Luca, 12/10/2026 : il veut pouvoir le choisir. Le
proposer à chaque fois, en option.

**Le coût, mesuré le 12/10/2026** : l'aperçu (10 s, 960 × 540) se rend en 12 s. Un film d'une
minute en 1080p se rend donc en quelques minutes. Ce qui coûte, c'est l'écriture : une scène, des
personnages, une caméra et une lumière plan par plan. C'est plus long qu'un style 2D. Avant de se
lancer, le dire à l'utilisateur et faire valider le scénario en 5 à 8 plans.

## La DA

- Palette propre : nuit bleue `#1b2233`, lumières ambrées `#f2b14b`, crème `#f4efe6`.
- DA d'une marque (`adapterDA('court-metrage', …)`) :
  - la nuit bleue, à peine teintée par l'encre de la marque ;
  - ses lumières à l'accent : le tram, l'enseigne, la réponse à l'écran ;
  - les fenêtres et les lampadaires prennent une lumière ambrée, tirée vers l'accent ;
  - ses polices, toujours (écran, enseigne, titre).
- Le ciel, le soleil, le brouillard et les façades ne prennent pas les couleurs de la marque : ils
  suivent l'heure (`lumiereA(heure, couleurs)`). Le style tient avec n'importe quelle DA, claire ou
  sombre.

## Le mouvement

- **L'heure règle tout** : `heure(f)` de 0 (nuit bleue) à 1 (le matin). 0,5 met le soleil à
  l'horizon. Les fenêtres s'allument une à une la nuit et s'éteignent avec le jour, les lampadaires
  aussi. Un lever du jour en accéléré (0,12 → 0,66 en trois secondes) fait un beau final.
- **Une caméra de cinéma**, par clés `{f, pos, cible, fov}` reliées en ease-in-out :
  - un travelling bas qui suit quelqu'un ;
  - un plan par-dessus l'épaule jusqu'à un écran (fov 30) ;
  - une grue qui s'élève et découvre la rue (fov 44).
  Ajouter une clé intermédiaire pour ne pas traverser un objet.
- **On voit le produit s'utiliser** : un écran dans la scène (abribus, vitrine, téléphone,
  ordinateur dans une fenêtre) montre sa vraie interface, dessinée par `Panneau` : la demande qui
  s'écrit, la réponse qui arrive. La caméra s'en approche assez pour qu'on le lise (il remplit
  60 % de l'image ou plus).
- Des passants (`Passant`, `pas` = phase de la marche), un tram (`Tram`) qui traverse, l'enseigne
  du projet en néon qui grésille avant de tenir.
- **Pas de flou de mouvement** : `<Flou>` ne s'applique pas à un canvas 3D (`references/pieges.md`).
  Les mouvements restent donc lents et amples. Pas de fouet ni de coupe sèche dans un plan 3D :
  on enchaîne par la caméra.

## Le son

Une musique posée (70 à 100 temps/min), une ambiance plutôt qu'un rythme. Peu de bruitages, et des
sons du lieu : un pas, le tram qui passe (un swoosh grave), un tintement à l'écran, le néon qui
s'allume (étincelle). Avec une voix off, elle raconte l'histoire, pas une liste de fonctions.

## Le code

`src/styles/court-metrage/Apercu.tsx` (les 3 plans) et `kit.tsx` :
- `Plateau` : le canvas, la caméra, le ciel, le soleil et la lumière de l'heure ;
- `lumiereA` et `useLumiere` : la lumière de l'image en cours ;
- `Rue`, `rangee` et `Immeubles` : la rue et ses façades, tirées au sort, avec des trous pour un
  immeuble posé à la main ;
- `Lampadaires`, `Passant`, `Tram` ;
- `Panneau` (un écran ou une enseigne dessinés en 2D, image par image, polices attendues), avec
  ses aides `lignesDe` et `pave`.

La rue suit l'axe x : la chaussée en z de −4 à 4, les trottoirs jusqu'à ±7, les façades à z = ±7
tournées vers la rue. Les règles 3D de Remotion sont dans `references/recettes-3d.md` : tout par
`useCurrentFrame()`, jamais `useFrame()`.

## Une trame possible (45 s à 1 min 30)

1. L'heure bleue : la rue, les fenêtres qui s'allument, quelqu'un arrive (le problème, dit par
   l'image : il est pressé, perdu, chargé…).
2. Il s'arrête et se sert du produit : l'écran, par-dessus son épaule, la vraie demande et la vraie
   réponse.
3. Ce que ça change : il repart, autre chose suit (un deuxième écran, un deuxième personnage, le
   vrai chiffre affiché sur une façade).
4. Le jour se lève en accéléré, la caméra s'élève, l'enseigne du projet s'allume ; le nom et
   l'adresse en titre.
