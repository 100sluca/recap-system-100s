# Style 1 · Keynote

**D'après** « Frame by Frame » (promptsmotion.com/notdwd-c2037d, la partie droite : le remake) et
CloudJoi (promptsmotion.com/lester-tyy-f897f7).

**L'idée.** Le produit présenté comme sur la scène d'une keynote : clair, lumineux, verre dépoli.
Une suite de plans courts, **coupés net sur le temps fort**, chacun entrant déjà en mouvement : la
fenêtre et le logo (le curseur vient cliquer l'icône, la caméra fonce dedans) ; l'icône et ses
satellites qui se rangent ; la barre de menu d'un Mac et le panneau de verre où l'on tape la
demande ; un éclair, une page qui bascule et défile, un mot surligné ; le nom lumineux sur le noir.

**Pour** : le lancement d'une app, d'un outil, d'un plugin, d'une fonction.

## La DA

- Palette propre : blanc bleuté `#f3f6fb`, marine `#0d1b2e`, accent bleu `#2f6bff`, menthe `#4fd1c5` ;
  Inter 700 / 400, JetBrains Mono pour les étiquettes.
- DA d'une marque (ses polices et ses seules couleurs, toujours) (`adapterDA('keynote', …)`) : **toujours claire**. Un fond clair à peine teinté de
  l'accent ; une marque sombre donne un blanc bleuté, son fond devient l'encre.
- Brume lumineuse (`Brume`) derrière les fenêtres ; fond d'écran du Mac tiré de l'accent ; verre
  (`Verre`) pour les panneaux ; fin sur fond noir, le nom avec une lueur de l'accent.

## Le mouvement

- Entrées **exponentielles** (`EXPO`), 20 à 30 images ; un plan dure 1 à 2 temps (≈ 2 s), coupe
  franche sur le temps fort (deux images avant, comme les monteurs).
- La caméra : chaque plan dérive encore (zoom lent + 4 %), jamais immobile. Sorties par **fouet**
  (`FOUET`, 10 images : zoom ×3 dans l'objet cliqué) ou **éclair** blanc (9 images) avec bascule.
- Le curseur (`Curseur`, `suivre`) : il glisse en ease-in-out, grossit au survol, s'enfonce au clic
  (un anneau de l'accent part).
- Le texte se tape (`tape`, ~33 signes/s) avec son curseur (`Caret`) ; un mot se surligne d'un
  rectangle de l'accent à 20 % qui se déroule.
- **Flou de mouvement** partout (`<Flou>`).

## Le son

Sons de synthèse fins : souffle sur chaque fouet, clic sur le clic, petites touches de clavier,
impact doux sur la coupe du temps fort. Musique 115 à 128 temps/min, un temps fort net (« drop »).

## Le code

`src/styles/keynote/Apercu.tsx` (les 5 plans) et `kit.tsx` (`Brume`, `FondEcran`, `BarreMenu`,
`alpha`) ; briques communes dans `src/styles/interface.tsx`.

## Une trame possible

Le logo dans sa fenêtre, cliqué → l'icône qui se range dans la barre de menu → la vraie demande
tapée dans le panneau → la vraie page de résultat qui défile, le mot qui compte surligné → deux
cartes qui montent avec un grand mot en verre derrière → le nom lumineux.
