# Style 5 · Plan-séquence

**D'après** Food craving (promptsmotion.com/ultimaxbt-2ddf1e) et CloudJoi (promptsmotion.com/lester-tyy-f897f7).

**L'idée.** **Un seul plan, sans coupe.** La caméra part tout près d'un champ de saisie au halo irisé
qui s'écrit (le texte énorme à l'écran), un mot se surligne, elle recule jusqu'au téléphone ; la
demande part en bulle ; une petite animation « je prépare » ; la seconde couleur **inonde** l'écran
puis se rétracte en carte de résultat ; le doigt appuie sur « Lancer » ; la caméra s'envole et laisse
de grandes phrases sur le blanc, puis le nom.

**Pour** : une app, un assistant, une commande, un parcours d'utilisateur de bout en bout. C'est le
style des « messages qui s'envoient », en plus fluide.

## La DA

- Palette propre : blanc `#ffffff`, surfaces `#f4f4f6`, encre `#0b0b0c`, accent bleu `#2f6bff`,
  seconde couleur citron `#d4ff3a` (l'inondation) ; Inter.
- DA d'une marque (ses polices et ses seules couleurs, toujours) (`adapterDA('sequence', …)`) : **claire** (son fond clair, ou du blanc).
- Le halo irisé (`Halo`) autour du champ : un dégradé conique flou qui tourne, tiré de l'accent et de
  la seconde couleur. Permis ici : c'est le langage des champs « IA ».

## Le mouvement

- Un **monde** (le téléphone et tout ce qu'il contient) et **une caméra** (`camera2D` : point regardé
  et zoom, zoom interpolé en logarithme). Zoom 3,3 sur la saisie, qui suit le curseur de texte ; recul
  à 1,0 en exponentielle ; poussées lentes ensuite ; envol final (zoom ×4 en accélérant).
- Élément partagé : la saisie devient la bulle (même élément, qui se déplace et rétrécit).
- L'inondation : un disque en espace écran, né d'un objet du monde (ramené à l'écran par la caméra),
  qui couvre tout en 14 images puis se rétracte vers la carte suivante.
- Le doigt (`Curseur type="main"`) qui appuie ; le bouton s'enfonce, tourne, devient « ✓ ».
- Flou de mouvement sur tout.

## Le son

Touches de clavier pendant la frappe, « whoosh » d'envoi, petits rebonds pendant « je prépare »,
impact plein sur l'inondation, clic du bouton, son de validation. Musique 120 à 130 temps/min, un
événement par temps.

## Le code

`src/styles/sequence/Apercu.tsx` (tout le plan, monde + caméra), briques de `interface.tsx`.

## Une trame possible

La vraie demande d'un utilisateur, tapée en très grand → le recul révèle le produit → la réponse,
le vrai résultat → l'action (acheter, lancer, partager) → deux phrases sur le blanc → le nom.
