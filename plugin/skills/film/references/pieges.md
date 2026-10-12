# Pièges connus (essais des 06, 07 et 12/10/2026)

- **Accès contrôlé aux dossiers (Windows Defender)** : sous Documents, le ffmpeg de Remotion ne
  peut pas écrire le MP4 (« Error opening output … No such file or directory ») et
  `chrome --screenshot` n'écrit rien. D'où l'atelier dans le dossier des ateliers (`~/recap-film/` par défaut) et le rendu
  via `%TEMP%` (`rendre.mjs`). Node, Python et git écrivent sans problème.
- **`%LOCALAPPDATA%` vu depuis Claude** : l'application Claude (paquet Windows) redirige les
  écritures dans `%LOCALAPPDATA%` vers `…\Packages\Claude_…\LocalCache\Local\` ; l'utilisateur ne les voit
  pas depuis l'Explorateur. Ne rien y mettre qu'il doive retrouver.
- **Planche + son** : `remotion render --frames=a,b,c` (images non contiguës) plante dans le
  mixage audio (`EINVAL write`). Les planches se rendent sans son (`rendre.mjs` le fait).
- **Capture d'un site animé** : `chrome --headless --screenshot` photographie la page en pleine
  animation (titres absents). `capturer.mjs` défile la page entière puis attend.
- **Surlignage décalé** : `overflow: hidden` sur un `inline-block` met sa ligne de base en bas
  de la boîte ; découper avec `clip-path: inset(0)` (c'est ce que fait `Bloc`).
- **Position d'un élément** (logo qui vient se poser) : la lire par `offsetLeft/offsetTop`
  (insensibles aux transformations et au zoom du Studio), après `document.fonts.ready`
  (`usePosition` dans `elements.tsx`).
- **Git Bash et les chemins** : un argument qui commence par `/` (« /fresques/google/ ») est
  transformé en chemin Windows (« C:/Program Files/Git/fresques/google/ »). Écrire les chemins de
  pages sans `/` initial (`capturer.mjs` les accepte, « . » = l'accueil) ou préfixer la commande
  par `MSYS_NO_PATHCONV=1`.
- **TTFLoader de three.js** importe opentype.js depuis un CDN : le bundler de Remotion ne le suit
  pas. Convertir la police d'avance avec `outils/typeface.mjs`, puis `FontLoader().parse(json)`.
  Taille : `size = em × 0,72` (un em de typeface vaut 1,389 × size) ; avance d'une lettre =
  `glyphs[c].ha / 1000 × size`.
- **Chiffres en cubes illisibles en grand** : chiffres dessinés à la main (zéro barré), caméra
  basse, chiffres trop serrés. Prendre `DOTO`, de face, deux colonnes d'écart. Le deux-points de
  Doto est une croix de 5 points : en cubes, deux points simples.
- **Bornes infinies** : `interpolate(f, [Infinity, …])` lève une erreur ; prendre un grand nombre.
- **Une étape notée en retard fausse le découpage du bilan** (pas le total) : noter l'étape
  au moment où elle commence.
- **`process.exit()` après un `fetch`** sous Windows : « Assertion failed: UV_HANDLE_CLOSING ».
  Laisser le script finir seul.
- **Taille** : un film 3D qui vole dans des centaines d'objets pèse ~65 Mo en CRF 18 ;
  `rendre.mjs` rend en CRF 20.
- **Texte dans une texture 3D** (cartes dessinées dans un canvas) : dessiner avant que la police soit
  chargée donne une police de secours. Attendre `document.fonts.load('700 92px "Famille"')` pour
  chaque police (`usePolicesPretes`), puis dessiner (`useTexturesCanvas` redessine la scène avant de
  rendre la main).
- **Une police citée par la DA mais absente de `public/fonts/polices.json`** : le navigateur prend
  une police de secours sans rien dire. `da.mjs --appliquer` le signale ; sinon vérifier la planche.
- **Le ffmpeg de Remotion est réduit** : pas de filtre `fps` ni `tile`. Pour une planche à partir
  d'un MP4 : extraire des images avec `-ss <s> -i film.mp4 -frames:v 1 x.png`, puis assembler avec
  `outils/png.mjs`.
- **Relevé de DA** : la saturation HSV juge « vive » une encre presque noire teintée (`#16110c`) ;
  `da.mjs` mesure la chroma (écart max − min). Un bandeau de cookies, une photo ou un badge peut
  passer pour l'accent : toujours regarder la planche. Les feuilles de styles d'un autre domaine ne
  se lisent pas depuis la page : `da.mjs` relit lui-même celles de Google Fonts.
- **Un aperçu dans une page HTML** : sans `poster`, une vidéo montre sa première image, souvent vide
  (avant que les objets n'arrivent). `apercus.mjs` tire une vignette du milieu.
- **Une DA de marque appliquée telle quelle** aplatit les styles (tout devient « fond blanc +
  accent ») : passer par `adapterDA('<style>', da)`.
- **Flou de mouvement** (`<Flou>`, `CameraMotionBlur` de `@remotion/motion-blur`) : chaque image est
  rendue 6 fois. Jamais autour d'un canvas Three.js (un canvas WebGL par sous-image). Les planches
  passent `rapide` (sans flou) ; un essai d'aperçus aussi (`apercus.mjs --rapide`).
- **Un texte placé par `right:` dans un conteneur sans largeur** (le « monde » d'un plan-séquence, un
  `div` en `position: absolute` sans taille) part hors champ ; et des boutons dans un `flex` sans
  largeur s'écrasent sur plusieurs lignes. Donner une largeur au conteneur, `whiteSpace: 'nowrap'`.
