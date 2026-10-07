import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {FontLoader, type Font} from 'three/examples/jsm/loaders/FontLoader.js';
import {type Etat, type V3, ease} from './outils3d';

// Le kit 3D, à la charte par défaut (tiré du film 100s v2) : un sol papier qui reçoit les ombres,
// une trame très légère, un soleil qui suit la caméra, du brouillard couleur papier.
// Règle Remotion : tout bouge par useCurrentFrame(), jamais par useFrame() ni une horloge.

const PAPIER = '#f2f1ed';

type Camera = (f: number) => {pos: V3; cible: V3; fov: number};

const PiloteCamera: React.FC<{readonly camera: Camera}> = ({camera}) => {
	const frame = useCurrentFrame();
	const {camera: cam, scene} = useThree();
	useLayoutEffect(() => {
		const c = camera(frame);
		const pc = cam as THREE.PerspectiveCamera;
		pc.position.set(...c.pos);
		pc.fov = c.fov;
		pc.near = 0.1;
		pc.far = 500;
		pc.updateProjectionMatrix();
		pc.lookAt(...c.cible);
		const soleil = scene.getObjectByName('soleil') as THREE.DirectionalLight | undefined;
		if (soleil) {
			soleil.position.set(c.cible[0] - 22, c.cible[1] + 42, c.cible[2] + 26);
			soleil.target.position.set(...c.cible);
			soleil.target.updateMatrixWorld();
		}
	});
	return null;
};

const Lumieres: React.FC = () => {
	const soleil = useMemo(() => {
		const l = new THREE.DirectionalLight('#ffffff', 2.1);
		l.name = 'soleil';
		l.castShadow = true;
		l.shadow.mapSize.set(4096, 4096);
		Object.assign(l.shadow.camera, {left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 160});
		l.shadow.bias = -0.0004;
		l.shadow.normalBias = 0.02;
		return l;
	}, []);
	return (
		<>
			<hemisphereLight args={['#ffffff', '#e4ded3', 1.25]} />
			<primitive object={soleil} />
			<primitive object={soleil.target} />
		</>
	);
};

const Sol: React.FC<{readonly trame: boolean}> = ({trame}) => {
	const grille = useMemo(() => {
		const g = new THREE.GridHelper(600, 300, '#16110c', '#16110c');
		const m = g.material as THREE.Material;
		m.transparent = true;
		m.opacity = 0.055;
		m.depthWrite = false;
		g.position.y = 0.005;
		return g;
	}, []);
	return (
		<>
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[800, 800]} />
				<shadowMaterial opacity={0.17} />
			</mesh>
			{trame ? <primitive object={grille} /> : null}
		</>
	);
};

/**
 * La scène : fond et brouillard papier, lumière, sol, caméra pilotée par `camera(f)`.
 * Mettre les objets en enfants.
 */
export const Scene3D: React.FC<{
	readonly camera: Camera;
	readonly children: React.ReactNode;
	readonly brouillard?: [number, number];
	readonly trame?: boolean;
}> = ({camera, children, brouillard = [70, 190], trame = true}) => {
	const {width, height} = useVideoConfig();
	const c0 = camera(0);
	return (
		<ThreeCanvas
			width={width}
			height={height}
			shadows
			flat
			gl={{antialias: true}}
			camera={{fov: c0.fov, position: c0.pos, near: 0.1, far: 500}}
		>
			<color attach="background" args={[PAPIER]} />
			<fog attach="fog" args={[PAPIER, brouillard[0], brouillard[1]]} />
			<PiloteCamera camera={camera} />
			<Lumieres />
			<Sol trame={trame} />
			{children}
		</ThreeCanvas>
	);
};

/**
 * N cubes arrondis en une seule géométrie instanciée ; `etat(i, f)` donne pour chaque
 * cube sa position, sa rotation, sa taille et sa couleur à l'image f. Taille 0 = invisible.
 */
export const Cubes: React.FC<{
	readonly nombre: number;
	readonly etat: (i: number, f: number) => Etat;
	readonly arrondi?: number;
}> = ({nombre, etat, arrondi = 0.16}) => {
	const frame = useCurrentFrame();
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, arrondi), [arrondi]);
	const objet = useMemo(() => new THREE.Object3D(), []);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		for (let i = 0; i < nombre; i++) {
			const e = etat(i, frame);
			objet.position.set(...e.p);
			objet.rotation.set(...e.r);
			objet.scale.set(Math.max(e.s[0], 1e-5), Math.max(e.s[1], 1e-5), Math.max(e.s[2], 1e-5));
			objet.updateMatrix();
			m.setMatrixAt(i, objet.matrix);
			m.setColorAt(i, e.c);
		}
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[geo, undefined, nombre]} castShadow receiveShadow frustumCulled={false}>
			<meshStandardMaterial roughness={0.62} metalness={0} />
		</instancedMesh>
	);
};

/** Un gros cube arrondi (pour un logo, un bloc). */
export const GrosCube: React.FC<{
	readonly taille: number;
	readonly p: V3;
	readonly r?: V3;
	readonly echelle: number;
	readonly couleur: THREE.Color | string;
}> = ({taille, p, r = [0, 0, 0], echelle, couleur}) => {
	const geo = useMemo(() => new RoundedBoxGeometry(taille, taille, taille, 4, taille * 0.18), [taille]);
	return (
		<mesh geometry={geo} position={p} rotation={r} scale={Math.max(echelle, 1e-5)} castShadow receiveShadow visible={echelle > 0}>
			<meshStandardMaterial color={couleur} roughness={0.55} />
		</mesh>
	);
};

/**
 * Quand une ressource arrive (textures, police), redessine la scène AVANT de rendre la main au
 * rendu. Pendant un rendu, Remotion ne redessine le canvas qu'au changement d'image : sans cela,
 * la première image de chaque onglet de rendu sort sans la ressource (une image isolée sans les
 * pages au début de chaque tranche). À utiliser dans le canvas.
 */
const useRedessin = (pret: boolean, attente: number) => {
	const {advance} = useThree();
	useEffect(() => {
		if (!pret) return;
		advance(performance.now());
		continueRender(attente);
	}, [pret, attente, advance]);
};

/** Charge des images de public/ en textures (le rendu attend qu'elles soient prêtes). Dans le canvas. */
export const useTextures = (chemins: string[]) => {
	const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
	const [attente] = useState(() => delayRender('Chargement des textures'));
	const cle = chemins.join('|');
	useEffect(() => {
		const loader = new THREE.TextureLoader();
		Promise.all(cle.split('|').map((c) => loader.loadAsync(staticFile(c)))).then((tx) => {
			for (const x of tx) {
				x.colorSpace = THREE.SRGBColorSpace;
				x.anisotropy = 8;
			}
			setTextures(tx);
		});
	}, [cle]);
	useRedessin(textures !== null, attente);
	return textures;
};

// Rectangle à coins arrondis : les pages et les fresques n'ont jamais de bords bruts.
const rectArrondi = (l: number, h: number, r: number) => {
	const s = new THREE.Shape();
	const x = -l / 2;
	const y = -h / 2;
	s.moveTo(x + r, y);
	s.lineTo(x + l - r, y);
	s.absarc(x + l - r, y + r, r, -Math.PI / 2, 0, false);
	s.lineTo(x + l, y + h - r);
	s.absarc(x + l - r, y + h - r, r, 0, Math.PI / 2, false);
	s.lineTo(x + r, y + h);
	s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
	s.lineTo(x, y + r);
	s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
	return s;
};
const imageArrondie = (l: number, h: number, r: number) => {
	const g = new THREE.ShapeGeometry(rectArrondi(l, h, r), 10);
	const pos = g.attributes.position;
	const uv = g.attributes.uv;
	for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + l / 2) / l, (pos.getY(i) + h / 2) / h);
	uv.needsUpdate = true;
	return g;
};
const cadreArrondi = (l: number, h: number, r: number, e: number) => {
	const g = new THREE.ExtrudeGeometry(rectArrondi(l, h, r), {depth: e, bevelEnabled: false, curveSegments: 10});
	g.translate(0, 0, -e / 2);
	return g;
};

/**
 * Une vraie page (capture) posée dans le monde : image et cadre blanc à coins arrondis.
 * Orientation d'un lieu (voir `Lieu` et `versMonde` dans outils3d.ts) : `ry` tourne autour de la
 * verticale, `rx` penche en arrière (−0,28 = un mur penché) ou couche au sol (−π/2 ; avec ry = π,
 * le haut de l'image regarde vers +z). `ratio` = hauteur / largeur de l'image.
 * `defile` : la page défile dans une fenêtre 16:9 (`pixels` = hauteur de la capture, `k` de 0 à 1).
 */
export const Page: React.FC<{
	readonly texture: THREE.Texture;
	readonly p: V3;
	readonly ry?: number;
	readonly rx?: number;
	readonly largeur?: number;
	readonly ratio?: number;
	readonly opacite?: number;
	readonly echelle?: number;
	readonly defile?: {pixels: number; k: number};
}> = ({texture, p, ry = 0, rx = 0, largeur = 21, ratio = 1080 / 1920, opacite = 1, echelle = 1, defile}) => {
	const hauteur = largeur * ratio;
	const geo = useMemo(
		() => ({cadre: cadreArrondi(largeur + 0.4, hauteur + 0.4, 0.75, 0.14), image: imageArrondie(largeur, hauteur, 0.6)}),
		[largeur, hauteur],
	);
	if (defile) {
		const fenetre = (1920 * ratio) / defile.pixels;
		texture.repeat.set(1, fenetre);
		texture.offset.set(0, (1 - fenetre) * (1 - defile.k));
	}
	if (opacite <= 0) return null;
	const couchee = Math.abs(rx + Math.PI / 2) < 0.01;
	return (
		<group position={p} rotation={new THREE.Euler(rx, ry, 0, 'YXZ')} scale={echelle}>
			<mesh geometry={geo.cadre} castShadow={!couchee} receiveShadow>
				<meshStandardMaterial color="#ffffff" transparent opacity={opacite} roughness={0.8} />
			</mesh>
			<mesh geometry={geo.image} position={[0, 0, 0.08]}>
				<meshBasicMaterial map={texture} toneMapped={false} transparent opacity={opacite} />
			</mesh>
		</group>
	);
};

/** La police des lettres 3D (typeface JSON fait par outils/typeface.mjs). */
export const usePolice3D = (chemin = 'fonts/funnel-display-500.typeface.json') => {
	const [police, setPolice] = useState<Font | null>(null);
	const [attente] = useState(() => delayRender('Police des lettres 3D'));
	useEffect(() => {
		fetch(staticFile(chemin))
			.then((r) => r.json())
			.then((json) => {
				setPolice(new FontLoader().parse(json));
			});
	}, [chemin]);
	useRedessin(police !== null, attente);
	return police;
};

/**
 * Un mot en lettres 3D en relief, posé sur la ligne de base (y = 0) à partir de x, avec
 * l'interlettrage du site (−0,045 em). Chaque lettre se lève à son tour (`debuts`, en images),
 * arrive orange et s'éteint vers sa couleur (la traînée). Pour le logo : « luca » gris #8f8c88,
 * « 100 » encre, puis le S en cubes à 0,125 em (le S fait 0,7 em de haut).
 */
export const Lettres3D: React.FC<{
	readonly texte: string;
	readonly em: number;
	readonly x: number;
	readonly z: number;
	readonly profondeur: number;
	readonly debuts: number[];
	readonly couleurs: (THREE.Color | string)[];
}> = ({texte, em, x, z, profondeur, debuts, couleurs}) => {
	const frame = useCurrentFrame();
	const police = usePolice3D();
	const lettres = useMemo(() => {
		if (!police) return null;
		const taille = em * 0.72; // un « em » de typeface vaut 1,389 fois la taille demandée
		let cx = x;
		return texte.split('').map((ch) => {
			const g = new TextGeometry(ch, {font: police, size: taille, depth: profondeur, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.03, bevelSegments: 2});
			const ici = cx;
			cx += ((police.data.glyphs[ch]?.ha ?? 500) / 1000) * taille - 0.045 * em;
			return {g, x: ici};
		});
	}, [police, texte, em, x, profondeur]);
	if (!lettres) return null;
	return (
		<>
			{lettres.map(({g, x: lx}, n) => {
				const a = debuts[n] ?? 0;
				const k = ease(frame, a, a + 10);
				if (k <= 0) return null;
				const c = new THREE.Color('#ff5f00').lerp(new THREE.Color(couleurs[n] ?? '#16110c'), ease(frame, a + 4, a + 16));
				return (
					<mesh key={n} geometry={g} position={[lx, 0, z - profondeur / 2]} scale={[1, k, 1]} castShadow receiveShadow>
						<meshStandardMaterial color={c} roughness={0.5} />
					</mesh>
				);
			})}
		</>
	);
};
