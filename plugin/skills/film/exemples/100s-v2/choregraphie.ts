import {Easing, interpolate, random, spring} from 'remotion';
import * as THREE from 'three';
import {DOUX, TRAINE, TRAINEE_CLAIR, t} from '../charte';
import {
	CASES,
	DALLE_H,
	DALLE_L,
	ETAGE,
	NIVEAUX,
	NB_SOURCES,
	ACTEURS,
	FRESQUE,
	LIEUX,
	TOPO,
	VEILLE,
	S_BASE,
	versMonde,
	PIVOT,
	RANG,
	S_CUBES,
	S_CUBES_PETITS,
	S_REDUIT,
	TOUR_POS,
	type V3,
	dalle,
	estSource,
	mur,
} from './donnees';

// La chorégraphie des 600 cubes : pour chaque cube i et chaque image f, sa position,
// sa rotation, sa taille et sa couleur. Tout est fonction de f : le rendu est reproductible.
// B(n) = image du temps n de la musique (105 temps/min).
const B = t;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (f: number, a: number, b: number, e: (x: number) => number = TRAINE) =>
	interpolate(f, [a, Math.max(b, a + 0.001)], [0, 1], {...cl, easing: e});
const lineaire = Easing.linear;

export const COULEURS = {
	encre: new THREE.Color('#16110c'),
	orange: new THREE.Color('#ff5f00'),
	blanc: new THREE.Color('#ffffff'),
	gris: new THREE.Color('#cbc4b8'),
	pale: new THREE.Color('#e7e2d9'),
};
const TRAINEE = TRAINEE_CLAIR.map((c) => new THREE.Color(c));

export type Etat = {p: V3; r: V3; s: V3; c: THREE.Color};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const l3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const melange = (a: Etat, b: Etat, k: number): Etat => ({
	p: l3(a.p, b.p, k),
	r: l3(a.r, b.r, k),
	s: l3(a.s, b.s, k),
	c: a.c.clone().lerp(b.c, k),
});
const cube = (s: number): V3 => [s, s, s];
const fois = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
const ZERO: V3 = [0, 0, 0];
const CACHE: Etat = {p: ZERO, r: ZERO, s: ZERO, c: COULEURS.blanc};

// ─── 1. 09:00 (temps 0–8) ───
const horloge = (i: number, f: number): Etat => {
	if (i >= CASES.length) return {p: nuageBase(i), r: ZERO, s: ZERO, c: COULEURS.blanc};
	const k = CASES[i];
	const arrivee = B(0.5 + k.ordre * 0.55) + k.ligne * 1.2 + k.col * 0.5;
	const bascule = B(5) + k.col * 0.9 + k.ligne * 0.5;
	let taille = 0;
	let dy = 0;
	let depart = arrivee;
	if (k.avant) {
		const a = ease(f, arrivee, arrivee + 9);
		taille = a;
		dy = -0.8 * (1 - a);
		if (!k.apres) {
			const q = ease(f, bascule, bascule + 8, Easing.in(Easing.quad));
			taille *= 1 - q;
			dy -= 1.4 * q;
		}
	} else if (k.apres) {
		depart = bascule + 3;
		const a = ease(f, depart, depart + 9);
		taille = a;
		dy = -0.8 * (1 - a);
	}
	// Chaque cube arrive orange et s'éteint vers l'encre : la traînée du logo.
	const c = COULEURS.orange.clone().lerp(COULEURS.encre, ease(f, depart + 2, depart + 14, lineaire));
	const elan = ease(f, B(7), B(8), Easing.in(Easing.cubic));
	return {p: [k.p[0], k.p[1] + dy + elan * 0.7, k.p[2]], r: ZERO, s: cube(0.92 * taille * (1 + 0.12 * elan)), c};
};

// ─── 2. Le flux (8–20) : des fiches qui dérivent vers la caméra ───
const derive = (f: number) => {
	if (f < B(8)) return 0;
	if (f <= B(20)) return f - B(8);
	return B(20) - B(8) + 24 * (1 - Math.exp(-(f - B(20)) / 24));
};
function nuageBase(i: number): V3 {
	return [(random(`nx-${i}`) - 0.5) * 58, 1.5 + random(`ny-${i}`) * 13, -70 + random(`nz-${i}`) * 72];
}
const nuage = (i: number, f: number): Etat => {
	const d = derive(f);
	const b = nuageBase(i);
	const v = 0.045 + random(`nv-${i}`) * 0.06;
	const rot = (cle: string) => random(`${cle}-${i}`) * Math.PI * 2 + d * (random(`${cle}v-${i}`) - 0.5) * 0.04;
	const r = random(`nc-${i}`);
	const c = r < 0.6 ? COULEURS.blanc : r < 0.86 ? COULEURS.gris : COULEURS.encre;
	return {
		p: [b[0], b[1] + Math.sin(d * 0.03 + i) * 0.4, b[2] + v * d],
		r: [rot('rx'), rot('ry'), rot('rz')],
		s: [1.5, 0.95, 0.1],
		c,
	};
};
const flux = (i: number, f: number): Etat => {
	const n = nuage(i, f);
	if (i < CASES.length && CASES[i].apres) {
		// L'horloge explose : ses cubes deviennent les premières fiches.
		const k = ease(f, B(8), B(9.4), Easing.out(Easing.cubic));
		const e = melange(horloge(i, B(8)), n, k);
		e.p[1] += Math.sin(Math.PI * k) * 3;
		return e;
	}
	const d = B(8) + random(`apparait-${i}`) * B(1.5);
	return {...n, s: fois(n.s, ease(f, d, d + 12))};
};

// ─── 3. La source (20–32) : le balayage orange, puis le mur des 281 ───
const X0 = -34;
const X1 = 34;
export const balayage = (f: number) => interpolate(f, [B(21), B(25)], [X0, X1], cl);
const instantBalayage = (x: number) => B(21) + ((x - X0) / (X1 - X0)) * (B(25) - B(21));
const tri = (i: number, f: number): Etat => {
	const n = nuage(i, f);
	const h = instantBalayage(n.p[0]);
	const q = ease(f, h, h + 9);
	const e: Etat = {p: n.p, r: [n.r[0] * (1 - q), n.r[1] + Math.PI * q, n.r[2] * (1 - q)], s: n.s, c: n.c};
	if (estSource(i)) {
		e.c = n.c.clone().lerp(COULEURS.orange, ease(f, h + 2, h + 9, lineaire));
		const rang = RANG[i];
		const dep = B(26) + (rang / NB_SOURCES) * B(2.2);
		const k = ease(f, dep, dep + 15);
		const quart = Math.round(e.r[1] / (Math.PI / 2)) * (Math.PI / 2);
		const m = melange(e, {p: mur(rang), r: [0, quart, 0], s: cube(0.95), c: COULEURS.orange}, k);
		m.p[1] += Math.sin(Math.PI * k) * 2.5;
		return m;
	}
	e.c = n.c.clone().lerp(COULEURS.pale, ease(f, h + 2, h + 10, lineaire));
	const chute = ease(f, h + 10, h + 10 + B(1.5), Easing.in(Easing.quad));
	e.p = [e.p[0], e.p[1] - chute * 5, e.p[2]];
	e.s = fois(e.s, 1 - chute);
	return e;
};

// ─── 4. Les sujets (32–44) : 32 tours, le sommet reste orange ───
const sujets = (i: number, f: number): Etat => {
	if (!estSource(i)) return CACHE;
	const rang = RANG[i];
	const {tour, niveau, cote} = ETAGE[rang];
	const base = TOUR_POS[tour];
	const dep = B(32) + niveau * 2.2 + cote * 1.1 + tour * 1.1;
	const k = ease(f, dep, dep + 13);
	const sommet = niveau === NIVEAUX[tour] - 1;
	const c = sommet
		? COULEURS.orange
		: COULEURS.orange.clone().lerp(COULEURS.encre, ease(f, dep + 11, dep + 22, lineaire));
	const m = melange(tri(i, B(32)), {p: [base[0] + (cote - 0.5) * 0.98, 0.48 + niveau * 0.98, base[2]], r: ZERO, s: cube(0.92), c}, k);
	m.p[1] += Math.sin(Math.PI * k) * 3.5;
	return m;
};

// ─── 5. L'édition (44–56) : la dalle blanche se redresse et s'efface sur la page ───
const poseDalle = (cx: number, cz: number, theta: number): {p: V3; r: V3} => {
	const d = 0.5 + cz;
	return {
		p: [
			cx - (DALLE_L - 1) / 2,
			PIVOT[1] + d * Math.sin(theta) + 0.5 * Math.cos(theta),
			PIVOT[2] + d * Math.cos(theta) - 0.5 * Math.sin(theta),
		],
		r: [-theta, 0, 0],
	};
};
const edition = (i: number, f: number): Etat => {
	if (!estSource(i)) return CACHE;
	const rang = RANG[i];
	const de = sujets(i, B(44));
	const dep = B(44) + ETAGE[rang].tour * 1.0 + random(`eff-${i}`) * 6;
	const k = ease(f, dep, dep + 14);
	if (rang >= DALLE_L * DALLE_H) return {...de, s: fois(de.s, 1 - k)};
	const {cx, cz} = dalle(rang);
	const theta = (Math.PI / 2) * ease(f, B(47), B(49), DOUX);
	const pose = poseDalle(cx, cz, theta);
	const blanc = de.c.clone().lerp(COULEURS.blanc, ease(f, dep + 4, dep + 16, lineaire));
	const m = melange({...de, c: blanc}, {p: pose.p, r: pose.r, s: cube(0.97), c: blanc}, k);
	m.p[1] += Math.sin(Math.PI * k) * 2.5;
	// La page apparaît derrière : les cubes s'effacent en vague diagonale.
	const rd = B(49.6) + ((cx + (DALLE_H - 1 - cz)) / (DALLE_L + DALLE_H - 2)) * B(1.6);
	const rv = ease(f, rd, rd + 7);
	m.s = fois(m.s, 1 - rv);
	m.p[2] += rv * 1.2;
	return m;
};

// ─── 7. Le S (92–104) : les cinq pages se défont en cubes qui forment le S géant ───
export const arriveeGrosCube = (j: number) => B(94 + j * 0.5);
const formeS = (i: number, f: number): Etat => {
	const lieu = LIEUX[i % LIEUX.length];
	const depart = versMonde(lieu, [(random(`su-${i}`) - 0.5) * lieu.L, (random(`sv-${i}`) - 0.5) * lieu.H, 0.4]);
	const sp = B(92) + random(`sp-${i}`) * B(0.8);
	const j = i % 10;
	const centre = S_CUBES[j];
	const cible: V3 = [
		centre[0] + (random(`jx-${i}`) - 0.5) * 3.2,
		centre[1] + (random(`jy-${i}`) - 0.5) * 3.2,
		centre[2] + (random(`jz-${i}`) - 0.5) * 3.2,
	];
	const A = arriveeGrosCube(j);
	const fs = Math.min(sp + 6 + random(`fs-${i}`) * B(0.4), A - 8);
	const k = ease(f, fs, A, DOUX);
	const p = l3(depart, cible, k);
	p[1] += Math.sin(Math.PI * k) * 7;
	const base = random(`sc-${i}`) < 0.5 ? COULEURS.encre : COULEURS.blanc;
	return {
		p,
		r: [k * 3 + random(`sr-${i}`) * 2, k * 2, 0],
		s: cube(0.7 * ease(f, sp, sp + 6) * (1 - ease(f, A, A + 5))),
		c: base.clone().lerp(COULEURS.orange, ease(f, A - 6, A, lineaire)),
	};
};

export const etat = (i: number, f: number): Etat => {
	if (f < B(8)) return horloge(i, f);
	if (f < B(20)) return flux(i, f);
	if (f < B(32)) return tri(i, f);
	if (f < B(44)) return sujets(i, f);
	if (f < B(56)) return edition(i, f);
	if (f < B(92)) return CACHE;
	return formeS(i, f);
};

/** Un des 10 gros cubes du S : il naît quand son essaim arrive, orange, puis prend sa couleur de traînée. */
export const grosCube = (j: number, f: number) => {
	const A = arriveeGrosCube(j);
	const g = f < A - 1 ? 0 : spring({frame: f - (A - 1), fps: 30, config: {damping: 200, mass: 0.6}});
	// À la fin, le S rétrécit et va se poser comme la dernière lettre du logo.
	const r = ease(f, B(104) + j * 0.6, B(105.4) + j * 0.6, DOUX);
	return {
		p: l3(S_CUBES[j], S_CUBES_PETITS[j], r),
		taille: (g > 0 ? 0.3 + 0.7 * g : 0) * lerp(1, S_REDUIT, r),
		ry: (1 - g) * 0.7,
		c: COULEURS.orange.clone().lerp(TRAINEE[j] ?? COULEURS.encre, ease(f, A + 4, A + 18, lineaire)),
	};
};

// ─── La caméra : des clés posées sur les temps, reliées en douceur ───
type Cle = {b: number; pos: V3; cible: V3; fov?: number; e?: (x: number) => number};
const sinus = Easing.inOut(Easing.sin);
const CLES: Cle[] = [
	{b: 0, pos: [-9, 2.0, 11], cible: [-5, 3.5, 0], fov: 40},
	{b: 3.5, pos: [0, 4.2, 31], cible: [0, 4.2, 0], e: sinus},
	{b: 7.6, pos: [0, 4.3, 28.5], cible: [0, 4.3, 0], e: sinus},
	{b: 9, pos: [1, 7, 24], cible: [0, 6, -10], fov: 50, e: TRAINE},
	{b: 19.5, pos: [-1, 7.5, -4], cible: [0, 7, -40], fov: 52, e: sinus},
	{b: 22, pos: [0, 20, 30], cible: [0, 6, -14], fov: 42, e: DOUX},
	{b: 25.5, pos: [10, 9, 36], cible: [6, 9.5, -8], e: sinus},
	{b: 30, pos: [0.5, 9, 24], cible: [2.2, 8.6, -6], fov: 40, e: DOUX},
	{b: 32, pos: [0.7, 9, 22.5], cible: [2.2, 8.6, -6], e: lineaire},
	{b: 33.5, pos: [0, 10, 23], cible: [0, 3, -4], e: DOUX},
	{b: 37.5, pos: [-15, 15, 15], cible: [0, 2.5, -4], e: sinus},
	{b: 43.5, pos: [10, 27, 11], cible: [0, 1, -4.5], e: sinus},
	{b: 46.5, pos: [0, 31, 8], cible: [0, 0, -4.5], e: DOUX},
	{b: 49.2, pos: [-10.5, 10.5, 17], cible: [-6.8, 6, -10.8], e: DOUX},
	{b: 53, pos: [-10, 7.5, 12.5], cible: [-6.3, 6, -10.85], e: sinus},
	{b: 55.8, pos: [-1.2, 6.5, 7.5], cible: [0, 6.0, -10.85], e: DOUX},
	...vuesLieux(),
	...relatifS([
		{b: 94.5, pos: [0, 24, 78], cible: [0, 10, -10], fov: 42, e: DOUX},
		{b: 98.5, pos: [-34.5, 18, 56], cible: [0, 10, 0], e: sinus},
		{b: 103.5, pos: [15.5, 15, 68], cible: [0, 7.5, 0], fov: 40, e: sinus},
		{b: 106.2, pos: [1.5, 7, 68], cible: [0, 3, 0], e: DOUX},
		{b: 112, pos: [0, 6.5, 64], cible: [0, 3.2, 0], e: lineaire},
	]),
];

/** Des clés écrites autour du S (positions relatives à S_BASE). */
function relatifS(cles: Cle[]): Cle[] {
	const plus = (v: V3): V3 => [v[0] + S_BASE[0], v[1] + S_BASE[1], v[2] + S_BASE[2]];
	return cles.map((c) => ({...c, pos: plus(c.pos), cible: plus(c.cible)}));
}

// Le site (temps 56–92) : quatre lieux du monde, chacun parcouru en défilement, et un vrai
// voyage entre deux lieux (la caméra s'élève, survole les autres pages, redescend).
// Repère d'une page : u à droite, v vers le haut de l'image, w vers l'avant (au-dessus pour la fresque).
function vuesLieux(): Cle[] {
	const P = (lieu: Parameters<typeof versMonde>[0], u: number, v: number, w: number) => versMonde(lieu, [u, v, w]);
	const hV = VEILLE.H / 2;
	const hA = ACTEURS.H / 2;
	const hF = FRESQUE.H / 2;
	// Le point haut d'un voyage : à mi-chemin, un peu au-dessus des deux lieux, le regard
	// déjà tourné vers le lieu suivant (on le voit arriver).
	const envol = (b: number, de: {pos: V3; cible: V3}, a: {pos: V3; cible: V3}, hauteur: number): Cle => ({
		b,
		pos: [(de.pos[0] + a.pos[0]) / 2, Math.max(de.pos[1], a.pos[1]) + hauteur, (de.pos[2] + a.pos[2]) / 2],
		cible: a.cible,
		e: Easing.in(Easing.sin),
	});
	const edition = {pos: [-1.2, 6.5, 7.5] as V3, cible: [0, 6.0, -10.85] as V3};
	const veilleHaut = {pos: P(VEILLE, -4, hV - 6, 21), cible: P(VEILLE, 0, hV - 7, 0)};
	const veilleBas = {pos: P(VEILLE, 4, -8, 19), cible: P(VEILLE, 0, -10, 0)};
	const acteursHaut = {pos: P(ACTEURS, -6, hA - 7, 21), cible: P(ACTEURS, 0, hA - 8, 0)};
	const acteursBas = {pos: P(ACTEURS, 7, -6, 20), cible: P(ACTEURS, 0, -8, 0)};
	// La fresque : vue de dessus, la caméra du côté du bas de l'image regarde vers son haut
	// (le texte se lit à l'endroit) et recule vers le bas : la page défile.
	const fresqueHaut = {pos: P(FRESQUE, -2, hF - 22, 24), cible: P(FRESQUE, 0, hF - 8, 0)};
	const fresqueMilieu = {pos: P(FRESQUE, 3, hF - 52, 18), cible: P(FRESQUE, 1, hF - 40, 0)};
	const fresqueBas = {pos: P(FRESQUE, -1, -hF + 4, 24), cible: P(FRESQUE, 0, -hF + 16, 0)};
	const topoDebut = {pos: P(TOPO, -12, 1.5, 15), cible: P(TOPO, 0, 0, 0)};
	const topoFin = {pos: P(TOPO, 4, 0.5, 18.5), cible: P(TOPO, 0, 0, 0)};
	return [
		envol(57.0, edition, veilleHaut, 10),
		{b: 58.2, ...veilleHaut, e: Easing.out(Easing.sin)},
		{b: 63.6, ...veilleBas, e: sinus},
		envol(64.8, veilleBas, acteursHaut, 8),
		{b: 66.2, ...acteursHaut, e: Easing.out(Easing.sin)},
		{b: 71.6, ...acteursBas, e: sinus},
		envol(72.8, acteursBas, fresqueHaut, 12),
		{b: 74.2, ...fresqueHaut, e: Easing.out(Easing.sin)},
		{b: 79, ...fresqueMilieu, e: Easing.in(Easing.sin)},
		{b: 83.6, ...fresqueBas, e: Easing.out(Easing.sin)},
		envol(84.8, fresqueBas, topoDebut, 10),
		{b: 86.2, ...topoDebut, e: Easing.out(Easing.sin)},
		{b: 91.8, ...topoFin, e: sinus},
	];
}

export const camera = (f: number) => {
	let a = CLES[0];
	let b = CLES[CLES.length - 1];
	for (let k = 0; k < CLES.length - 1; k++) {
		if (f >= B(CLES[k].b) && f <= B(CLES[k + 1].b)) {
			a = CLES[k];
			b = CLES[k + 1];
			break;
		}
	}
	if (f > B(b.b)) a = b;
	const fovA = CLES.slice(0, CLES.indexOf(a) + 1).reverse().find((c) => c.fov)?.fov ?? 40;
	const fovB = CLES.slice(0, CLES.indexOf(b) + 1).reverse().find((c) => c.fov)?.fov ?? fovA;
	const k = a === b ? 0 : ease(f, B(a.b), B(b.b), b.e ?? DOUX);
	return {pos: l3(a.pos, b.pos, k), cible: l3(a.cible, b.cible, k), fov: lerp(fovA, fovB, k)};
};
