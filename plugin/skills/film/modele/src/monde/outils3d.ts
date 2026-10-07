import {Easing, interpolate} from 'remotion';
import * as THREE from 'three';
import {DOUX, t} from '../charte';

// Petits outils de la chorégraphie 3D. Tout est fonction de l'image f : jamais d'horloge.

export type V3 = [number, number, number];

/** Un cube à l'image f : position, rotation (radians), taille par axe, couleur. */
export type Etat = {p: V3; r: V3; s: V3; c: THREE.Color};

export const COULEURS3D = {
	encre: new THREE.Color('#16110c'),
	orange: new THREE.Color('#ff5f00'),
	blanc: new THREE.Color('#ffffff'),
	gris: new THREE.Color('#cbc4b8'),
	pale: new THREE.Color('#e7e2d9'),
};

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0 avant a, 1 après b, entre les deux selon la courbe (longue traîne par défaut). */
export const ease = (f: number, a: number, b: number, e: (x: number) => number = Easing.bezier(0.16, 1, 0.3, 1)) =>
	interpolate(f, [a, Math.max(b, a + 0.001)], [0, 1], {...cl, easing: e});

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const l3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const fois = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
export const cube = (s: number): V3 => [s, s, s];
export const ZERO: V3 = [0, 0, 0];
export const CACHE: Etat = {p: ZERO, r: ZERO, s: ZERO, c: COULEURS3D.blanc};

/** Passe d'un état à l'autre (k de 0 à 1). Ajouter ensuite un arc : e.p[1] += Math.sin(Math.PI * k) * h. */
export const melange = (a: Etat, b: Etat, k: number): Etat => ({
	p: l3(a.p, b.p, k),
	r: l3(a.r, b.r, k),
	s: l3(a.s, b.s, k),
	c: a.c.clone().lerp(b.c, k),
});

/**
 * Un lieu du monde où l'on pose une page : centre, `ry` (autour de la verticale), puis `rx`
 * (penché en arrière, ou −π/2 couché au sol), largeur L, hauteur H. Repère de la page :
 * u vers la droite, v vers le haut de l'image, w vers l'avant (vers le haut si elle est au sol).
 */
export type Lieu = {centre: V3; ry: number; rx: number; L: number; H: number};

/** Un point (u, v, w) d'une page, en coordonnées du monde (même ordre que Euler 'YXZ'). */
export const versMonde = (lieu: Pick<Lieu, 'centre' | 'ry' | 'rx'>, [u, v, w]: V3): V3 => {
	const y1 = v * Math.cos(lieu.rx) - w * Math.sin(lieu.rx);
	const z1 = v * Math.sin(lieu.rx) + w * Math.cos(lieu.rx);
	return [
		lieu.centre[0] + u * Math.cos(lieu.ry) + z1 * Math.sin(lieu.ry),
		lieu.centre[1] + y1,
		lieu.centre[2] - u * Math.sin(lieu.ry) + z1 * Math.cos(lieu.ry),
	];
};

/** Une page debout (ou penchée) posée par son pied, le milieu de son bord bas, sur le sol. */
export const lieuDebout = (pied: V3, ry: number, rx: number, L: number, H: number): Lieu => ({
	centre: versMonde({centre: pied, ry, rx}, [0, H / 2, 0]),
	ry,
	rx,
	L,
	H,
});

/**
 * Le point haut d'un voyage entre deux plans : à mi-chemin, un peu au-dessus (8 à 12 unités),
 * le regard déjà tourné vers la destination. Le mettre entre la clé de départ et celle d'arrivée
 * (arrivée avec e: Easing.out(Easing.sin)) : on voit le lieu suivant approcher.
 */
export const envol = (b: number, de: {pos: V3; cible: V3}, a: {pos: V3; cible: V3}, hauteur = 10): Cle => ({
	b,
	pos: [(de.pos[0] + a.pos[0]) / 2, Math.max(de.pos[1], a.pos[1]) + hauteur, (de.pos[2] + a.pos[2]) / 2],
	cible: a.cible,
	e: Easing.in(Easing.sin),
});

/**
 * Une clé de caméra posée sur un temps de la musique. `e` est la courbe du trajet qui
 * ARRIVE à cette clé. Deux clés identiques = un plan tenu. Pour un mouvement continu à
 * travers une clé : Easing.in(Easing.sin) pour y arriver, Easing.out(Easing.sin) pour en repartir.
 */
export type Cle = {b: number; pos: V3; cible: V3; fov?: number; e?: (x: number) => number};

export const cameraDepuisCles = (cles: Cle[]) => (f: number) => {
	let a = cles[0];
	let b = cles[cles.length - 1];
	for (let k = 0; k < cles.length - 1; k++) {
		if (f >= t(cles[k].b) && f <= t(cles[k + 1].b)) {
			a = cles[k];
			b = cles[k + 1];
			break;
		}
	}
	if (f > t(b.b)) a = b;
	if (f < t(cles[0].b)) b = a;
	const fovDe = (c: Cle) => cles.slice(0, cles.indexOf(c) + 1).reverse().find((x) => x.fov)?.fov ?? 40;
	const k = a === b ? 0 : ease(f, t(a.b), t(b.b), b.e ?? DOUX);
	return {pos: l3(a.pos, b.pos, k), cible: l3(a.cible, b.cible, k), fov: lerp(fovDe(a), fovDe(b), k)};
};
