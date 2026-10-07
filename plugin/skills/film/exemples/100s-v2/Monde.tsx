import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Easing, continueRender, delayRender, getInputProps, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {FontLoader, type Font} from 'three/examples/jsm/loaders/FontLoader.js';
import {TRAINE, t} from '../charte';
import {COULEURS, balayage, camera, etat, grosCube} from './choregraphie';
import {EDITION, EM, FRESQUE, LIEUX, LOGO_GAUCHE, N, S_BASE, S_TAILLE, TOPO, type V3} from './donnees';

const PAPIER = '#f2f1ed';
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** La caméra suit ses clés (choregraphie.ts) ; la lumière et son ombre suivent la cible. */
const Camera: React.FC = () => {
	const frame = useCurrentFrame();
	const {camera: cam, scene} = useThree();
	useLayoutEffect(() => {
		// Débogage : --props='{"cameraDebug": {"pos": […], "cible": […], "fov": 40}}' fige la caméra.
		const debug = (getInputProps() as {cameraDebug?: {pos: V3; cible: V3; fov: number}}).cameraDebug;
		const c = debug ?? camera(frame);
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
		const s = l.shadow.camera;
		s.left = -55;
		s.right = 55;
		s.top = 55;
		s.bottom = -55;
		s.near = 1;
		s.far = 160;
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

/** Le sol papier : il ne reçoit que les ombres, plus une trame très légère. */
const Sol: React.FC = () => {
	const trame = useMemo(() => {
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
			<primitive object={trame} />
		</>
	);
};

/** Les 600 cubes, en une seule géométrie instanciée. */
const Cubes: React.FC = () => {
	const frame = useCurrentFrame();
	const ref = useRef<THREE.InstancedMesh>(null);
	const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.16), []);
	const objet = useMemo(() => new THREE.Object3D(), []);
	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		for (let i = 0; i < N; i++) {
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
		m.computeBoundingSphere();
	});
	return (
		<instancedMesh ref={ref} args={[geo, undefined, N]} castShadow receiveShadow frustumCulled={false}>
			<meshStandardMaterial roughness={0.62} metalness={0} />
		</instancedMesh>
	);
};

/** Le S géant : les dix pixels du logo, en gros cubes arrondis. */
const GrandS: React.FC = () => {
	const frame = useCurrentFrame();
	const geo = useMemo(() => new RoundedBoxGeometry(S_TAILLE, S_TAILLE, S_TAILLE, 4, 0.8), []);
	return (
		<>
			{Array.from({length: 10}).map((_, j) => {
				const g = grosCube(j, frame);
				return (
					<mesh
						key={j}
						geometry={geo}
						position={g.p}
						rotation={[0, g.ry, 0]}
						scale={Math.max(g.taille, 1e-5)}
						castShadow
						receiveShadow
						visible={g.taille > 0}
					>
						<meshStandardMaterial color={g.c} roughness={0.55} />
					</mesh>
				);
			})}
		</>
	);
};

// Rectangle à coins arrondis (pour les pages et la fresque : jamais de bords bruts).
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
/** Une image à coins arrondis : la forme, avec ses coordonnées de texture recalculées. */
const imageArrondie = (l: number, h: number, r: number) => {
	const g = new THREE.ShapeGeometry(rectArrondi(l, h, r), 10);
	const pos = g.attributes.position;
	const uv = g.attributes.uv;
	for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + l / 2) / l, (pos.getY(i) + h / 2) / h);
	uv.needsUpdate = true;
	return g;
};
/** Le cadre blanc, en relief, à coins arrondis. */
const cadreArrondi = (l: number, h: number, r: number, e: number) => {
	const g = new THREE.ExtrudeGeometry(rectArrondi(l, h, r), {depth: e, bevelEnabled: false, curveSegments: 10});
	g.translate(0, 0, -e / 2);
	return g;
};

/**
 * Quand une ressource arrive (textures, police), redessine la scène AVANT de rendre la main
 * au rendu : pendant un rendu, Remotion ne redessine le canvas qu'au changement d'image, et la
 * première image de chaque onglet sortirait sans la ressource.
 */
const useRedessin = (pret: boolean, attente: number) => {
	const {advance} = useThree();
	useEffect(() => {
		if (!pret) return;
		advance(performance.now());
		continueRender(attente);
	}, [pret, attente, advance]);
};

/**
 * Les vraies pages du site, chacune à son endroit du monde : l'édition (révélée par la dalle),
 * la veille et les acteurs dressés en murs, la fresque couchée au sol, le Topo en écran flottant.
 */
const Pages: React.FC = () => {
	const frame = useCurrentFrame();
	const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
	const [attente] = useState(() => delayRender('Chargement des captures du site'));
	const geo = useMemo(
		() =>
			LIEUX.map((l) => ({
				cadre: cadreArrondi(l.L + 0.4, l.H + 0.4, 0.75, 0.14),
				image: imageArrondie(l.L, l.H, 0.6),
			})),
		[],
	);
	useEffect(() => {
		const loader = new THREE.TextureLoader();
		Promise.all(LIEUX.map((l) => loader.loadAsync(staticFile(l.src)))).then((tx) => {
			for (const x of tx) {
				x.colorSpace = THREE.SRGBColorSpace;
				x.anisotropy = 8;
			}
			setTextures(tx);
		});
	}, []);
	useRedessin(textures !== null, attente);
	if (!textures) return null;
	const sortie = interpolate(frame, [t(92), t(93.3)], [1, 0], cl);
	// Le Topo défile dans sa fenêtre : on montre 1080 pixels de la page à la fois.
	const fenetre = 1080 / (TOPO.pixels ?? 1080);
	const topo = textures[LIEUX.indexOf(TOPO)];
	topo.repeat.set(1, fenetre);
	topo.offset.set(
		0,
		interpolate(frame, [t(86.6), t(91.4)], [1 - fenetre, 0], {...cl, easing: Easing.inOut(Easing.sin)}),
	);
	return (
		<>
			{LIEUX.map((lieu, k) => {
				const entree =
					lieu === EDITION
						? interpolate(frame, [t(49.4), t(49.8)], [0, 1], cl)
						: interpolate(frame, [t(56) + k * 3, t(56) + k * 3 + 14], [0, 1], cl);
				const o = entree * sortie;
				if (o <= 0) return null;
				const g = geo[k];
				const auSol = lieu === FRESQUE;
				return (
					<group
						key={lieu.src}
						position={lieu.centre}
						rotation={new THREE.Euler(lieu.rx, lieu.ry, 0, 'YXZ')}
						scale={0.92 + 0.08 * sortie}
					>
						<mesh geometry={g.cadre} castShadow={!auSol} receiveShadow>
							<meshStandardMaterial color="#ffffff" transparent opacity={o} roughness={0.8} />
						</mesh>
						<mesh geometry={g.image} position={[0, 0, 0.08]}>
							<meshBasicMaterial map={textures[k]} toneMapped={false} transparent opacity={o} />
						</mesh>
					</group>
				);
			})}
		</>
	);
};

// Les lettres « luca100 » en relief, en Funnel Display 500 (la police du logo), posées sur
// la ligne de base à gauche du S réduit : le logo complet, en 3D. « luca » est gris (45 % sur le site).
const LETTRES = 'luca100';
const GRIS_LUCA = new THREE.Color('#8f8c88');
const Logo3D: React.FC = () => {
	const frame = useCurrentFrame();
	const [police, setPolice] = useState<Font | null>(null);
	const [attente] = useState(() => delayRender('Police des lettres 3D'));
	useEffect(() => {
		fetch(staticFile('fonts/funnel-display-500.typeface.json'))
			.then((r) => r.json())
			.then((json) => {
				setPolice(new FontLoader().parse(json));
			});
	}, []);
	useRedessin(police !== null, attente);
	const lettres = useMemo(() => {
		if (!police) return null;
		const taille = EM * 0.72; // un « em » de typeface vaut 1,389 fois la taille demandée
		let x = LOGO_GAUCHE;
		return LETTRES.split('').map((ch) => {
			const g = new TextGeometry(ch, {
				font: police,
				size: taille,
				depth: 1.8,
				curveSegments: 10,
				bevelEnabled: true,
				bevelThickness: 0.06,
				bevelSize: 0.03,
				bevelSegments: 2,
			});
			const ici = x;
			x += (police.data.glyphs[ch].ha / 1000) * taille - 0.045 * EM;
			return {g, x: ici};
		});
	}, [police]);
	if (!lettres) return null;
	return (
		<>
			{lettres.map(({g, x}, n) => {
				const a = t(105.5 + n * 0.5);
				const k = interpolate(frame, [a, a + 10], [0, 1], {...cl, easing: TRAINE});
				if (k <= 0) return null;
				const finale = n < 4 ? GRIS_LUCA : COULEURS.encre;
				const c = COULEURS.orange.clone().lerp(finale, interpolate(frame, [a + 4, a + 16], [0, 1], cl));
				return (
					<mesh key={n} geometry={g} position={[x, 0, S_BASE[2] - 0.9]} scale={[1, k, 1]} castShadow receiveShadow>
						<meshStandardMaterial color={c} roughness={0.5} />
					</mesh>
				);
			})}
		</>
	);
};

/** Le plan orange qui balaie le flux (temps 21–25). */
const Balayage: React.FC = () => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [t(20.6), t(21), t(25), t(25.4)], [0, 1, 1, 0], cl);
	if (o <= 0) return null;
	return (
		<group position={[balayage(frame), 8, -28]}>
			<mesh>
				<boxGeometry args={[0.2, 16, 92]} />
				<meshBasicMaterial color={COULEURS.orange} transparent opacity={0.13 * o} depthWrite={false} />
			</mesh>
			<mesh position={[0, 8, 0]}>
				<boxGeometry args={[0.14, 0.14, 92]} />
				<meshBasicMaterial color={COULEURS.orange} transparent opacity={o} />
			</mesh>
			<mesh position={[0, -7.98, 0]}>
				<boxGeometry args={[0.18, 0.04, 92]} />
				<meshBasicMaterial color={COULEURS.orange} transparent opacity={o} />
			</mesh>
		</group>
	);
};

export const Monde: React.FC = () => {
	const {width, height} = useVideoConfig();
	return (
		<ThreeCanvas
			width={width}
			height={height}
			shadows
			flat
			gl={{antialias: true}}
			camera={{fov: 40, position: [-9, 2, 11], near: 0.1, far: 500}}
		>
			<color attach="background" args={[PAPIER]} />
			<fog attach="fog" args={[PAPIER, 70, 190]} />
			<Camera />
			<Lumieres />
			<Sol />
			<Cubes />
			<GrandS />
			<Pages />
			<Balayage />
			<Logo3D />
		</ThreeCanvas>
	);
};
