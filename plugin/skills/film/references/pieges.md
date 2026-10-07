# Pièges connus (essais du 06 et du 07/10/2026)

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
