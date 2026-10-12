import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {continueRender, delayRender, random, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type {Couleurs} from '../../da';
import {useDA} from '../../da';
import type {V3} from '../../monde/outils3d';
import {lerp, mix} from '../commun';

// Le kit du style « Court-métrage 3D » (styles/court-metrage.md) : une vraie scène écrite en code,
// sans modèle 3D téléchargé. Des volumes simples (boîtes, capsules), et la lumière qui fait tout :
// l'heure (de la nuit bleue au matin) règle le ciel, le soleil, le brouillard, les fenêtres et les
// lampadaires. Une rue le long de l'axe x (chaussée en z ∈ [−4, 4], trottoirs jusqu'à ±7, façades
// à z = ±7 tournées vers la rue). Tout bouge par useCurrentFrame() : jamais useFrame() ni d'horloge.

const cl = (x: number) => Math.max(0, Math.min(1, x));
const doux = (x: number) => cl(x) * cl(x) * (3 - 2 * cl(x));

/** La lumière d'une heure : 0 = nuit bleue, 0,5 = le soleil à l'horizon, 1 = le matin. */
export const lumiereA = (heure: number, c: Couleurs) => {
	// Des bleus de nuit fixes, à peine teintés par la marque : le style tient avec n'importe quelle DA.
	const nuit = {haut: mix('#16224a', c.fond, 0.2), horizon: mix(mix('#5d6fa6', c.fond, 0.2), c.accent, 0.1)};
	const aube = {haut: mix(c.fond, '#5b6fa8', 0.55), horizon: mix(c.accent, '#ff9966', 0.45)};
	const jour = {haut: mix('#86afe0', c.accent, 0.08), horizon: mix('#f3e9da', c.accent, 0.06)};
	const k1 = doux(heure / 0.5);
	const k2 = doux((heure - 0.5) / 0.5);
	const entre = (a: string, b: string, d: string) => (heure < 0.5 ? mix(a, b, k1) : mix(b, d, k2));
	const elevation = lerp(-0.12, 0.62, heure);
	return {
		haut: entre(nuit.haut, aube.haut, jour.haut),
		horizon: entre(nuit.horizon, aube.horizon, jour.horizon),
		bas: mix('#14161c', c.fond, 0.15),
		soleil: heure < 0.5 ? mix('#ff6a3d', '#ffb36b', k1) : mix('#ffb36b', '#fff3e2', k2),
		elevation,
		forceSoleil: cl((elevation + 0.04) / 0.22) * lerp(1.6, 2.6, heure),
		// La lumière du ciel : bleue la nuit (les façades virent au bleu), blanche le jour.
		ciel: heure < 0.5 ? mix('#6f86d0', '#ffd9b8', k1) : mix('#ffd9b8', '#ffffff', k2),
		forceCiel: lerp(0.7, 1.25, doux(heure)),
		// La part des fenêtres allumées, et les lampadaires : tout s'éteint quand le jour est là.
		fenetres: 1 - doux((heure - 0.3) / 0.5),
		lampes: 1 - doux((heure - 0.42) / 0.16),
	};
};
export type Lumiere = ReturnType<typeof lumiereA>;

/** La lumière chaude des fenêtres et des lampes, teintée de l'accent de la marque. */
export const chaud = (c: Couleurs) => mix('#f6b552', c.accent, 0.22);

type Camera = (f: number) => {pos: V3; cible: V3; fov: number};

const PiloteCamera: React.FC<{readonly camera: Camera}> = ({camera}) => {
	const frame = useCurrentFrame();
	const {camera: cam} = useThree();
	useLayoutEffect(() => {
		const c = camera(frame);
		const pc = cam as THREE.PerspectiveCamera;
		pc.position.set(...c.pos);
		pc.fov = c.fov;
		pc.near = 0.1;
		pc.far = 600;
		pc.updateProjectionMatrix();
		pc.lookAt(...c.cible);
	});
	return null;
};

const VERTEX_CIEL = 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAGMENT_CIEL = `uniform vec3 haut; uniform vec3 horizon; uniform vec3 bas; varying vec3 vDir;
void main() {
	float h = vDir.y;
	vec3 c = h > 0.0 ? mix(horizon, haut, pow(min(1.0, h * 1.8), 0.6)) : mix(horizon, bas, min(1.0, -h * 5.0));
	gl_FragColor = vec4(c, 1.0);
	#include <colorspace_fragment>
}`;

/** Le ciel (un dôme en dégradé), le soleil et son disque, la lumière du ciel, le brouillard. */
const Ciel: React.FC<{readonly l: Lumiere; readonly azimut: number; readonly brouillard: [number, number]}> = ({l, azimut, brouillard}) => {
	const materiau = useMemo(
		() =>
			new THREE.ShaderMaterial({
				uniforms: {haut: {value: new THREE.Color()}, horizon: {value: new THREE.Color()}, bas: {value: new THREE.Color()}},
				vertexShader: VERTEX_CIEL,
				fragmentShader: FRAGMENT_CIEL,
				side: THREE.BackSide,
				depthWrite: false,
			}),
		[],
	);
	materiau.uniforms.haut.value.set(l.haut);
	materiau.uniforms.horizon.value.set(l.horizon);
	materiau.uniforms.bas.value.set(l.bas);
	const soleil = useMemo(() => {
		const s = new THREE.DirectionalLight('#ffffff', 1);
		s.castShadow = true;
		s.shadow.mapSize.set(2048, 2048);
		Object.assign(s.shadow.camera, {left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300});
		s.shadow.bias = -0.0005;
		s.shadow.normalBias = 0.03;
		return s;
	}, []);
	const dir: V3 = [Math.cos(l.elevation) * Math.cos(azimut), Math.sin(l.elevation), Math.cos(l.elevation) * Math.sin(azimut)];
	soleil.position.set(dir[0] * 120, Math.max(dir[1], 0.02) * 120, dir[2] * 120);
	soleil.color.set(l.soleil);
	soleil.intensity = l.forceSoleil;
	return (
		<>
			<color attach="background" args={[l.horizon]} />
			<fog attach="fog" args={[l.horizon, brouillard[0], brouillard[1]]} />
			<mesh material={materiau} renderOrder={-1}>
				<sphereGeometry args={[400, 32, 16]} />
			</mesh>
			{l.elevation > -0.08 ? (
				<mesh position={[dir[0] * 380, dir[1] * 380, dir[2] * 380]}>
					<sphereGeometry args={[9, 24, 12]} />
					<meshBasicMaterial color={mix(l.soleil, '#ffffff', 0.35)} fog={false} toneMapped={false} />
				</mesh>
			) : null}
			<hemisphereLight args={[l.ciel, l.bas, l.forceCiel]} />
			<primitive object={soleil} />
			<primitive object={soleil.target} />
		</>
	);
};

/**
 * Le plateau : le canvas, la caméra pilotée par `camera(f)`, le ciel et la lumière de `heure(f)`.
 * `azimut` : d'où vient le soleil (0 = le bout de la rue, vers +x). Mettre la scène en enfants.
 */
export const Plateau: React.FC<{
	readonly camera: Camera;
	readonly heure: (f: number) => number;
	readonly azimut?: number;
	readonly brouillard?: [number, number];
	readonly children: React.ReactNode;
}> = ({camera, heure, azimut = 0.25, brouillard = [40, 260], children}) => {
	const {width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const da = useDA();
	const l = lumiereA(heure(frame), da.couleurs);
	const c0 = camera(0);
	return (
		<ThreeCanvas width={width} height={height} shadows flat gl={{antialias: true}} camera={{fov: c0.fov, position: c0.pos, near: 0.1, far: 600}}>
			<PiloteCamera camera={camera} />
			<Ciel l={l} azimut={azimut} brouillard={brouillard} />
			<HeureContexte.Provider value={l}>{children}</HeureContexte.Provider>
		</ThreeCanvas>
	);
};
const HeureContexte = React.createContext<Lumiere | null>(null);
/** La lumière de l'image en cours (dans le Plateau). */
export const useLumiere = () => React.useContext(HeureContexte)!;

/** Une boîte instanciée par élément : positions, tailles et couleurs données une fois pour toutes. */
const Boites: React.FC<{
	readonly elements: {p: V3; s: V3; c: string; ry?: number}[];
	readonly basique?: boolean;
	readonly ombres?: boolean;
	readonly arrondi?: number;
}> = ({elements, basique = false, ombres = true, arrondi = 0}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => (arrondi ? new RoundedBoxGeometry(1, 1, 1, 2, arrondi) : new THREE.BoxGeometry(1, 1, 1)), [arrondi]);
	const objet = useMemo(() => new THREE.Object3D(), []);
	const couleur = useMemo(() => new THREE.Color(), []);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		elements.forEach((e, i) => {
			objet.position.set(...e.p);
			objet.rotation.set(0, e.ry ?? 0, 0);
			objet.scale.set(...e.s);
			objet.updateMatrix();
			m.setMatrixAt(i, objet.matrix);
			m.setColorAt(i, couleur.set(e.c));
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});
	if (!elements.length) return null;
	return (
		<instancedMesh ref={ref} args={[geo, undefined, elements.length]} castShadow={ombres} receiveShadow={ombres} frustumCulled={false}>
			{basique ? <meshBasicMaterial toneMapped={false} /> : <meshStandardMaterial roughness={0.85} metalness={0} />}
		</instancedMesh>
	);
};

/** La rue : le sol, la chaussée, les trottoirs, les pointillés. De x0 à x1. */
export const Rue: React.FC<{readonly x0?: number; readonly x1?: number}> = ({x0 = -90, x1 = 90}) => {
	const l = x1 - x0;
	const xm = (x0 + x1) / 2;
	const tirets = useMemo(() => {
		const t: {p: V3; s: V3; c: string}[] = [];
		for (let x = x0 + 2; x < x1; x += 6) t.push({p: [x, 0.012, 0], s: [2.6, 0.01, 0.18], c: '#d9d2c3'});
		return t;
	}, [x0, x1]);
	return (
		<>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[xm, -0.01, 0]} receiveShadow>
				<planeGeometry args={[l + 400, 400]} />
				<meshStandardMaterial color="#56534e" roughness={1} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[xm, 0.002, 0]} receiveShadow>
				<planeGeometry args={[l, 8]} />
				<meshStandardMaterial color="#383b42" roughness={0.95} />
			</mesh>
			{[5.5, -5.5].map((z) => (
				<mesh key={z} position={[xm, 0.08, z]} receiveShadow castShadow>
					<boxGeometry args={[l, 0.16, 3]} />
					<meshStandardMaterial color="#9a948a" roughness={0.9} />
				</mesh>
			))}
			<Boites elements={tirets} ombres={false} />
		</>
	);
};

export type Immeuble = {x: number; largeur: number; hauteur: number; profondeur: number; c: string; cote: 1 | -1};

/**
 * Une rangée d'immeubles le long d'un côté de la rue (cote 1 : z > 0, −1 : z < 0), de x0 à x1,
 * tirée au sort par `graine` (reproductible). `trous` : des plages de x laissées libres (pour un
 * immeuble posé à la main). Hauteurs de `hauteurs[0]` à `hauteurs[1]`.
 */
export const rangee = (graine: string, cote: 1 | -1, x0: number, x1: number, hauteurs: [number, number] = [7, 19], trous: [number, number][] = []) => {
	const out: Immeuble[] = [];
	// Des pierres claires et neutres : bleues la nuit, dorées au matin (c'est la lumière qui colore).
	const pierres = ['#b6b3ad', '#a4a7ab', '#c4bfb6', '#9fa4aa', '#bab1a4', '#acb2b8'];
	let x = x0;
	let n = 0;
	while (x < x1) {
		const largeur = 5 + Math.floor(random(`${graine}-l${n}`) * 5);
		const centre = x + largeur / 2;
		if (!trous.some(([a, b]) => centre + largeur / 2 > a && centre - largeur / 2 < b)) {
			out.push({
				x: centre,
				largeur: largeur - 0.15,
				hauteur: lerp(hauteurs[0], hauteurs[1], random(`${graine}-h${n}`)),
				profondeur: 9 + random(`${graine}-p${n}`) * 4,
				c: pierres[Math.floor(random(`${graine}-c${n}`) * pierres.length)],
				cote,
			});
		}
		x += largeur;
		n++;
	}
	return out;
};

/**
 * Les immeubles et leurs fenêtres. Une fenêtre s'allume au hasard la nuit (la part allumée suit
 * l'heure) et reflète le ciel le jour. `allumage(i, f)` : 0 à 1, pour allumer une fenêtre en scène.
 */
export const Immeubles: React.FC<{readonly immeubles: Immeuble[]; readonly graine?: string}> = ({immeubles, graine = 'f'}) => {
	const frame = useCurrentFrame();
	const l = useLumiere();
	const da = useDA();
	const corps = useMemo(
		() =>
			immeubles.flatMap((b) => [
				{p: [b.x, b.hauteur / 2, b.cote * (7 + b.profondeur / 2)] as V3, s: [b.largeur, b.hauteur, b.profondeur] as V3, c: b.c},
				// La corniche et le rez-de-chaussée, un ton plus sombres.
				{p: [b.x, b.hauteur + 0.15, b.cote * (7 + b.profondeur / 2)] as V3, s: [b.largeur + 0.3, 0.3, b.profondeur + 0.3] as V3, c: mix(b.c, '#000000', 0.25)},
				{p: [b.x, 1.6, b.cote * 7.02] as V3, s: [b.largeur, 3.2, 0.1] as V3, c: mix(b.c, '#000000', 0.35)},
			]),
		[immeubles],
	);
	const fenetres = useMemo(() => {
		const out: {p: V3; ry: number; hasard: number}[] = [];
		immeubles.forEach((b, j) => {
			const cols = Math.max(1, Math.floor((b.largeur - 1) / 1.7));
			const rangs = Math.max(1, Math.floor((b.hauteur - 3.6) / 2.4));
			for (let r = 0; r < rangs; r++)
				for (let k = 0; k < cols; k++) {
					const x = b.x - ((cols - 1) * 1.7) / 2 + k * 1.7;
					out.push({p: [x, 4.4 + r * 2.4, b.cote * 6.94], ry: b.cote > 0 ? Math.PI : 0, hasard: random(`${graine}-${j}-${r}-${k}`)});
				}
		});
		return out;
	}, [immeubles, graine]);
	const lampe = chaud(da.couleurs);
	const vitre = mix(mix(da.couleurs.fond, '#000000', 0.4), l.haut, 0.55 * (1 - l.fenetres));
	const allumees = fenetres.map((w) => ({
		p: w.p,
		s: [0.95, 1.3, 0.02] as V3,
		ry: w.ry,
		// Une part des fenêtres s'allume une à une au début du film, puis tout s'éteint avec le jour.
		c: w.hasard < 0.55 * l.fenetres * cl((frame - w.hasard * 60) / 12) ? mix(lampe, '#ffffff', w.hasard * 0.25) : vitre,
	}));
	return (
		<>
			<Boites elements={corps} />
			<Boites elements={allumees} basique ombres={false} />
		</>
	);
};

/** Des lampadaires aux x donnés, sur le trottoir (z = cote · 4,4). Les `proches` éclairent le sol. */
export const Lampadaires: React.FC<{readonly xs: number[]; readonly cote?: 1 | -1; readonly proches?: number[]}> = ({xs, cote = 1, proches = []}) => {
	const l = useLumiere();
	const da = useDA();
	const z = cote * 4.4;
	const lampe = chaud(da.couleurs);
	const mats = useMemo(() => xs.flatMap((x) => [{p: [x, 2.3, z] as V3, s: [0.12, 4.6, 0.12] as V3, c: '#2b2d31'}, {p: [x, 4.55, z - cote * 0.5] as V3, s: [0.12, 0.12, 1.1] as V3, c: '#2b2d31'}]), [xs, z, cote]);
	const ampoules = xs.map((x) => ({p: [x, 4.42, z - cote * 0.95] as V3, s: [0.42, 0.18, 0.42] as V3, c: mix('#4a4740', lampe, l.lampes)}));
	return (
		<>
			<Boites elements={mats} />
			<Boites elements={ampoules} basique ombres={false} />
			{proches.map((x) => (
				<pointLight key={x} position={[x, 4.1, z - cote * 0.95]} color={lampe} intensity={l.lampes * 9} distance={11} decay={1.6} />
			))}
		</>
	);
};

/** Un passant (corps en capsule, tête, deux jambes) ; `pas` : la phase de la marche (0 = immobile). */
export const Passant: React.FC<{readonly p: V3; readonly ry: number; readonly couleur: string; readonly taille?: number; readonly pas?: number; readonly marche?: number}> = ({
	p,
	ry,
	couleur,
	taille = 1,
	pas = 0,
	marche = 1,
}) => {
	const balance = Math.sin(pas) * 0.45 * marche;
	return (
		<group position={[p[0], p[1] + Math.abs(Math.sin(pas)) * 0.05 * marche, p[2]]} rotation={[0, ry, 0]} scale={taille}>
			<mesh position={[0, 1.18, 0]} castShadow>
				<capsuleGeometry args={[0.27, 0.62, 6, 14]} />
				<meshStandardMaterial color={couleur} roughness={0.8} />
			</mesh>
			<mesh position={[0, 1.86, 0]} castShadow>
				<sphereGeometry args={[0.2, 18, 12]} />
				<meshStandardMaterial color="#d8b49a" roughness={0.7} />
			</mesh>
			{[-1, 1].map((s) => (
				<mesh key={s} position={[s * 0.11, 0.42, 0]} rotation={[s * balance, 0, 0]} castShadow>
					<capsuleGeometry args={[0.085, 0.62, 4, 8]} />
					<meshStandardMaterial color="#2a2c33" roughness={0.9} />
				</mesh>
			))}
		</group>
	);
};

/** Un tram (ou un bus) de `longueur`, à la couleur `couleur`, vitres éclairées, à l'abscisse x. */
export const Tram: React.FC<{readonly x: number; readonly z?: number; readonly couleur: string; readonly longueur?: number; readonly sens?: 1 | -1}> = ({
	x,
	z = -1.8,
	couleur,
	longueur = 16,
	sens = 1,
}) => {
	const l = useLumiere();
	const da = useDA();
	const geo = useMemo(() => new RoundedBoxGeometry(longueur, 2.9, 2.6, 3, 0.45), [longueur]);
	const lumiere = mix(mix('#3a4150', l.haut, 0.5), chaud(da.couleurs), Math.max(l.fenetres, 0.35));
	return (
		<group position={[x, 0, z]} rotation={[0, sens > 0 ? 0 : Math.PI, 0]}>
			<mesh geometry={geo} position={[0, 1.95, 0]} castShadow receiveShadow>
				<meshStandardMaterial color={couleur} roughness={0.45} metalness={0.1} />
			</mesh>
			<mesh position={[0, 2.35, 0]}>
				<boxGeometry args={[longueur - 1.4, 1.05, 2.64]} />
				<meshBasicMaterial color={lumiere} toneMapped={false} />
			</mesh>
			<mesh position={[0, 0.42, 0]}>
				<boxGeometry args={[longueur - 0.6, 0.5, 2.3]} />
				<meshStandardMaterial color="#1f2126" roughness={0.9} />
			</mesh>
			<mesh position={[0, 3.55, 0]}>
				<boxGeometry args={[longueur * 0.3, 0.12, 0.9]} />
				<meshStandardMaterial color="#2b2d31" />
			</mesh>
			{[-0.75, 0.75].map((dz) => (
				<mesh key={dz} position={[longueur / 2 + 0.02, 1.2, dz]}>
					<boxGeometry args={[0.06, 0.22, 0.34]} />
					<meshBasicMaterial color={mix('#fff4d6', '#888888', 1 - l.lampes * 0.8)} toneMapped={false} />
				</mesh>
			))}
		</group>
	);
};

/**
 * Un panneau dont l'image est dessinée en 2D, image par image : l'écran où l'on voit le produit
 * s'utiliser, une enseigne, une affiche. `dessiner(ctx, l, h, f)` ; `polices` : les polices
 * citées (« 700 64px "Inter" »), attendues avant le premier dessin. Il émet sa propre lumière.
 * Orientation : `ry` = 0 regarde vers +z, π vers −z (vers la rue depuis une façade côté nord).
 */
export const Panneau: React.FC<{
	readonly p: V3;
	readonly ry?: number;
	readonly largeur: number;
	readonly hauteur: number;
	readonly pixels?: number;
	readonly polices: string[];
	readonly dessiner: (ctx: CanvasRenderingContext2D, l: number, h: number, f: number) => void;
	readonly eclat?: number;
}> = ({p, ry = 0, largeur, hauteur, pixels = 1024, polices, dessiner, eclat = 1}) => {
	const frame = useCurrentFrame();
	const {advance} = useThree();
	const [attente] = useState(() => delayRender('Polices du panneau'));
	const [pret, setPret] = useState(false);
	const canvas = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = pixels;
		c.height = Math.round((pixels * hauteur) / largeur);
		return c;
	}, [pixels, largeur, hauteur]);
	const texture = useMemo(() => {
		const t = new THREE.CanvasTexture(canvas);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	}, [canvas]);
	const cle = polices.join('|');
	useEffect(() => {
		Promise.all(cle.split('|').filter(Boolean).map((x) => document.fonts.load(x))).then(() => setPret(true));
	}, [cle]);
	useLayoutEffect(() => {
		if (!pret) return;
		const ctx = canvas.getContext('2d')!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		dessiner(ctx, canvas.width, canvas.height, frame);
		texture.needsUpdate = true;
	});
	// Les polices arrivées : redessiner la scène avant de rendre la main (sinon la première image de
	// chaque onglet de rendu sort sans le panneau, voir references/pieges.md).
	useEffect(() => {
		if (!pret) return;
		advance(performance.now());
		continueRender(attente);
	}, [pret, attente, advance]);
	const v = Math.max(0, eclat);
	return (
		<mesh position={p} rotation={[0, ry, 0]}>
			<planeGeometry args={[largeur, hauteur]} />
			<meshBasicMaterial map={texture} color={new THREE.Color(v, v, v)} toneMapped={false} transparent />
		</mesh>
	);
};

/** Un texte coupé en lignes de `largeur` pixels au plus (police déjà posée dans ctx). */
export const lignesDe = (ctx: CanvasRenderingContext2D, texte: string, largeur: number) => {
	const out: string[] = [];
	let ligne = '';
	for (const mot of texte.split(/\s+/)) {
		const essai = ligne ? `${ligne} ${mot}` : mot;
		if (ctx.measureText(essai).width > largeur && ligne) {
			out.push(ligne);
			ligne = mot;
		} else ligne = essai;
	}
	if (ligne) out.push(ligne);
	return out;
};

/** Un rectangle à coins arrondis, rempli. */
export const pave = (ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number, couleur: string) => {
	ctx.fillStyle = couleur;
	ctx.beginPath();
	ctx.roundRect(x, y, l, h, r);
	ctx.fill();
};
