# Style 2 · Démo produit

**D'après** Brieform (promptsmotion.com/majorbaguette-fb11d7), AgentHud
(promptsmotion.com/jazzen-chen-4542ae) et le film Spotify (promptsmotion.com/brainextends-e19ac3).

**L'idée.** La démonstration, étape par étape, dans le noir. Une accroche centrée ; puis la **vraie
fenêtre** où le produit travaille (la demande tapée, les outils qui tournent puis se cochent, la
réponse, le lien) ; au-dessus, l'étape numérotée (« 01 · DEMANDE ») ; dessous, une **légende** dont
les derniers mots s'allument dans l'accent ; puis le résultat chiffré ; puis le logo et l'action.

**Pour** : un outil, une IA, un SaaS, tout ce qui s'explique en « tu demandes, ça se fait ».

## La DA

- Palette propre : noir chaud `#0e0d0b`, surfaces `#1b1a17`, texte `#f3f1ea`, accent citron
  `#d4ff3a` ; Inter, JetBrains Mono pour les étapes et les outils.
- DA d'une marque (ses polices et ses seules couleurs, toujours) (`adapterDA('demo', …)`) : **passée au noir** (l'encre de la marque, assombrie,
  devient le fond ; son fond clair devient le texte ; l'accent reste, éclairci s'il manque de
  contraste).
- Un projecteur (`Projecteur`) : un halo doux au centre du noir, pas un dégradé décoratif.
- Variante Spotify : la scène sombre aux coins arrondis posée sur un fond de la couleur de la marque.

## Le mouvement

- La caméra **pousse** lentement (+7 % sur toute la démo) ; jamais immobile.
- Entrées en exponentielle, 14 à 20 images ; mots de la légende décalés de 2 images.
- Passage d'une étape à l'autre : le contenu de la fenêtre se floute et se dissout dans le suivant
  (16 images), la fenêtre reste : c'est le même objet.
- Les outils : un cercle qui tourne 8 images puis une coche de l'accent (`Outil`).
- Les chiffres comptent jusqu'à leur valeur (ease-out) ; les lignes de résultat arrivent en ressort
  décalé.

## Le son

Clics de touches pendant la frappe, des coches qui montent d'un cran à chacune (`<Suite />`), un
souffle léger aux changements d'étape.
Musique posée, 100 à 120 temps/min.

## Le code

`src/styles/demo/Apercu.tsx` et `kit.tsx` (`Projecteur`, `Etape`, `Legende`, `Outil`).

## Une trame possible

Une question qui pique (« Besoin d'un formulaire ? ») → 01 : la vraie demande, l'outil qui travaille
→ 02 : le résultat, en vrai (la page, le chiffre) → 03 : ce qu'on en fait ensuite → le logo, la
phrase, l'adresse sur une pastille de l'accent.
