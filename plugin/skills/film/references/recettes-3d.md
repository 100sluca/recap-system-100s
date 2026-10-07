# Recettes 3D (Three.js dans Remotion)

Le modèle fournit `src/monde/kit3d.tsx` (`Scene3D`, `Cubes`, `GrosCube`, `Page`, `useTextures`)
et `src/monde/outils3d.ts` (`ease`, `melange`, `cameraDepuisCles`…). L'exemple complet est
`exemples/100s-v2/` (« Un matin de veille », 600 cubes, 8 scènes, une seule caméra).

## Les règles de Remotion

- Tout le 3D dans `<ThreeCanvas width height>` (c'est ce que fait `Scene3D`).
- **Aucune animation qui ne vienne pas de `useCurrentFrame()`** : `useFrame()` de
  react-three-fiber est interdit, comme toute horloge ; sinon l'image scintille au rendu.
- Mettre à jour les objets dans un `useLayoutEffect` (ou pendant le rendu) : Remotion
  photographie la scène après les effets.
- Un `<Sequence>` dans le canvas : `layout="none"`.
- Rendu : `Config.setChromiumOpenGlRenderer('angle')` (dans le modèle), `--concurrency=4`.

## Un seul monde, des cubes qui changent de rôle

La force de la v2 : un « pool » fixe de N cubes instanciés (une seule géométrie, 600 cubes sans
effort), dont chaque scène redéfinit le rôle. Écrire une fonction par scène, `etat(i, f)`, qui
renvoie `{p, r, s, c}` (position, rotation, taille par axe, couleur) :

```ts
export const etat = (i: number, f: number): Etat => {
	if (f < t(8)) return horloge(i, f);   // scène 1
	if (f < t(20)) return flux(i, f);     // scène 2 : part de horloge(i, t(8))
	…
};
```

- **Enchaîner sans saut** : chaque scène part de l'état de la précédente à son image de début
  (`melange(sceneAvant(i, t(debut)), cible, k)`), avec un léger arc (`p[1] += Math.sin(Math.PI*k)*h`).
- **Décaler** chaque cube (`debut + rang * pas`) : vagues, cascades, traînées.
- Taille 0 = cube caché. Le hasard : `random('cle-' + i)` de Remotion (reproductible).
- Formes : un cube aplati `s: [1.5, 0.95, 0.1]` fait une fiche ; un cube `0.92` laisse un joint.
- Couleurs : `COULEURS3D` ; la traînée = `orange.clone().lerp(finale, ease(f, a+2, a+14))`.

## La caméra

- Des clés posées sur les temps (`Cle = {b, pos, cible, fov?, e?}`), reliées par
  `cameraDepuisCles`. `e` est la courbe du trajet qui arrive à la clé (`DOUX` par défaut).
- Deux clés presque identiques = plan tenu qui vit. Pour passer une clé sans s'arrêter :
  `Easing.in(Easing.sin)` pour y arriver, `Easing.out(Easing.sin)` pour en repartir.
- Laisser la place au texte : décaler la cible pour que l'objet soit à droite quand le titre est
  à gauche ; reculer pour qu'un objet entier tienne dans le cadre (largeur visible ≈ 2·d·tan(fov·0,89)
  en 16:9, hauteur ≈ 2·d·tan(fov/2)).
- Le soleil (ombres) suit la cible de la caméra : rien à faire.

## Ce qui rend bien

- Sol papier qui ne reçoit que les ombres, trame légère, brouillard papier : profondeur sans décor.
- Vraies pages (`Page` + `useTextures`) posées comme des tableaux ; une dalle de cubes qui
  s'efface en vague diagonale révèle une page derrière elle.
- Un plan lumineux (boîte orange à 13 % d'opacité + arêtes pleines) qui balaie la scène.
- Le S du logo en gros cubes (`GrosCube`), chacun formé par l'essaim de petits cubes qui l'atteint.

## Chiffres en cubes (une heure, un compteur)

`monde/chiffres.ts` : `DOTO` (les chiffres de la police du site) et `casesTexte('09:00')`.
Lisible en plein écran à condition de : prendre les chiffres Doto (pas de zéro barré),
**montrer le nombre de face** au moment où on doit le lire (caméra en face, pas en contre-plongée),
deux colonnes vides entre les chiffres, cubes de 0,86 à 0,92 sur un pas de 1,15. On n'arrivait
pas à lire « 08:59 » en plein écran dans la v2 (zéro barré, caméra basse, chiffres serrés).

## Pages arrondies, fresque au sol

- `Page` a des coins arrondis (cadre blanc en relief + image) : jamais de bords bruts.
- `couchee` pose une grande capture à plat sur le sol (le haut vers −z) : une fresque, une carte
  qu'on survole. La caméra passe par-dessus ce qui est debout (clé intermédiaire en hauteur),
  arrive au-dessus du titre en regardant vers −z (le texte se lit droit), puis recule et monte
  pour tout montrer. Capture : `capturer.mjs … --long fresques/xxx/`, puis recadrer (`ffmpeg -vf crop`).

## Montrer un site : des lieux, du défilement, des voyages

Retour sur la v3 de 100s : pas de pages enchaînées « à la chaîne » (un paravent qu'on
longe), mais **chaque page à son endroit du monde, parcourue en défilement, et un vrai voyage
entre deux endroits**. Compter 6 temps par page et 2 temps de voyage, plus pour une fresque (10).

- Une page = un `Lieu` (`outils3d.ts`) : `lieuDebout(pied, ry, rx, L, H)` pour un mur debout ou
  penché, ou couchée au sol (`rx = −π/2`, `ry = π` : le haut de l'image vers +z). Capture
  pleine page (`capturer.mjs --long veille/`), recadrée (`ffmpeg -vf crop=1920:5400:0:0`) :
  un mur de 24 de large fait alors 67 de haut.
- `versMonde(lieu, [u, v, w])` place la caméra dans le repère de la page : pour un mur, devant
  (w ≈ 20), en haut (v près de H/2), et la clé suivante plus bas : la caméra **descend la page**,
  c'est le défilement. Pour un mur penché, faire aussi varier u : elle tourne autour.
- Au sol (une fresque, une carte) : caméra au-dessus (w ≈ 24), du côté du bas de l'image, le regard
  vers son haut (le texte se lit droit), puis elle recule vers le bas de l'image : la page défile
  sous elle. Une clé au milieu (arrivée `Easing.in(sin)`, départ `Easing.out(sin)`) garde le
  mouvement continu.
- Une page dans un écran (`Page` avec `defile: {pixels, k}`) : elle défile toute seule dans sa
  fenêtre 16:9 pendant que la caméra tourne autour de l'écran.
- Les voyages : `envol(b, depart, arrivee, 10)` entre la clé de fin d'un lieu et celle d'arrivée
  au suivant (point haut à mi-chemin, regard déjà sur la destination). Trop haut (30 et plus), on
  ne voit que du papier ; regard au milieu des deux lieux, on ne voit rien venir.
- Disperser les lieux (50 à 100 unités entre eux) : pendant les voyages, les autres pages
  apparaissent comme des monuments sur le sol papier, avec leurs ombres longues.

## Le logo en 3D à la fin

Le S de cubes rétrécit (×0,4) et va se poser comme dernière lettre ; « luca100 » se lève lettre
par lettre en relief à sa gauche (`Lettres3D`, Funnel Display 500, `fonts/funnel-display-500.typeface.json`).
Géométrie du site : le S fait 0,7 em, posé sur la ligne de base, à 0,125 em du « 0 » ; « luca100 »
mesure 3,41 em ; « luca » en gris (#8f8c88), « 100 » en encre ; profondeur des lettres = taille
d'un petit cube. Exemple complet : `exemples/100s-v2/` (donnees.ts : EM, LOGO_GAUCHE, S_CUBES_PETITS).
Une autre police : `node OUTILS/typeface.mjs <police.ttf> public/fonts/<nom>.typeface.json`
(dans l'atelier ; pour une police variable, en tirer d'abord une instance fixe avec fontTools).

## Déboguer une scène

`Monde.tsx` de l'exemple lit `cameraDebug` dans les props : une caméra fixe pour regarder le monde
d'où l'on veut (`--props='{"son":false,"cameraDebug":{"pos":[…],"cible":[…],"fov":55}}'` sur une
planche). Rester à moins de 190 unités de ce qu'on regarde : au-delà, le brouillard efface tout.

## Pièges

- **Une ressource chargée (textures, police) n'apparaît pas sur la première image d'un onglet de
  rendu** : Remotion ne redessine le canvas qu'au changement d'image. Redessiner (`advance`) puis
  seulement rendre la main (`continueRender`) : c'est ce que font `useTextures` et `usePolice3D`
  du kit. Symptôme : une image isolée sans pages au début de chaque tranche, et des planches
  vides (chaque image d'une planche est souvent la première de son onglet).
- Un plan transparent qui s'étend jusqu'à la caméra remplit l'écran : l'arrêter avant elle.
- Un objet grand et proche passe devant le titre : vérifier sur la planche, déplacer la caméra.
- `flat` sur le canvas (pas de tone mapping) pour garder l'orange exact ; textures en
  `SRGBColorSpace` et `meshBasicMaterial` `toneMapped={false}` pour les captures.
- Avertissements « THREE.Clock » et « PCFSoftShadowMap » au rendu : sans conséquence.
