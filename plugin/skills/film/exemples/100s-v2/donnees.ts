import {random} from 'remotion';
import {PIXEL_ORDRE} from '../charte';

// Le monde du film v2. Unité : un cube de pixel (≈ 1).
export const N = 600; // cubes en tout
export const NB_SOURCES = 281; // ceux qui ont une source officielle (le chiffre du site)

export type V3 = [number, number, number];

// ─── L'horloge : 4 chiffres + deux-points en matrice 5 × 7, de 08:59 à 09:00 ───
// Les chiffres de Doto, la police des chiffres du site (relevés dans doto.woff2, graisse 900).
const CHIFFRES: Record<string, string[]> = {
	'0': ['00100', '01010', '10001', '10001', '10001', '01010', '00100'],
	'5': ['11111', '10000', '10110', '11001', '00001', '10001', '01110'],
	'8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
	'9': ['01110', '10001', '10011', '01101', '00001', '00010', '01100'],
};
const AVANT = ['0', '8', '5', '9'];
const APRES = ['0', '9', '0', '0'];
// Deux colonnes vides entre les chiffres d'une paire : on les lit mieux en grand.
const COLONNE_CHIFFRE = [0, 7, 15, 22]; // le deux-points est en colonne 13, le centre aussi
export const PAS_HORLOGE = 1.15;

export type Case = {p: V3; avant: boolean; apres: boolean; ordre: number; ligne: number; col: number};
export const CASES: Case[] = [];
for (let d = 0; d < 4; d++) {
	for (let ligne = 0; ligne < 7; ligne++) {
		for (let col = 0; col < 5; col++) {
			const c = COLONNE_CHIFFRE[d] + col;
			CASES.push({
				p: [(c - 13) * PAS_HORLOGE, 0.5 + (6 - ligne) * PAS_HORLOGE, 0],
				avant: CHIFFRES[AVANT[d]][ligne][col] === '1',
				apres: CHIFFRES[APRES[d]][ligne][col] === '1',
				ordre: d < 2 ? d : d + 1, // le deux-points vient entre les deux paires
				ligne,
				col,
			});
		}
	}
}
for (const ligne of [2, 4]) {
	CASES.push({p: [0, 0.5 + (6 - ligne) * PAS_HORLOGE, 0], avant: true, apres: true, ordre: 2, ligne, col: 0});
}

// ─── Rang de chaque cube (ordre mélangé, reproductible) ───
const ordre = Array.from({length: N}, (_, i) => i).sort((a, b) => random(`rang-${a}`) - random(`rang-${b}`));
export const RANG: number[] = [];
ordre.forEach((i, r) => {
	RANG[i] = r;
});
export const estSource = (i: number) => RANG[i] < NB_SOURCES;

// ─── Le mur : les 281 fiches sourcées rangées en 20 colonnes ───
export const MUR_X = 8;
export const mur = (rang: number): V3 => [((rang % 20) - 9.5) * 1.08 + MUR_X, 1.0 + (14 - Math.floor(rang / 20)) * 1.08, -6];

// ─── Les 32 tours des sujets (8 × 4), deux cubes de large, 281 cubes en tout ───
const poids = Array.from({length: 32}, (_, k) => 0.45 + random(`tour-${k}`) ** 1.5);
const somme = poids.reduce((a, b) => a + b, 0);
const brut = poids.map((p) => (p / somme) * NB_SOURCES);
export const HAUTEURS = brut.map(Math.floor);
let manque = NB_SOURCES - HAUTEURS.reduce((a, b) => a + b, 0);
brut
	.map((b, k) => ({k, reste: b - Math.floor(b)}))
	.sort((a, b) => b.reste - a.reste)
	.forEach(({k}) => {
		if (manque > 0) {
			HAUTEURS[k]++;
			manque--;
		}
	});
export const TOUR_POS: V3[] = Array.from({length: 32}, (_, k) => [((k % 8) - 3.5) * 3.6, 0, -4 + (Math.floor(k / 8) - 1.5) * 2.8]);
export const NIVEAUX = HAUTEURS.map((h) => Math.ceil(h / 2));
export const ETAGE: {tour: number; niveau: number; cote: number}[] = [];
HAUTEURS.forEach((h, tour) => {
	for (let n = 0; n < h; n++) ETAGE.push({tour, niveau: Math.floor(n / 2), cote: n % 2});
});

// ─── La dalle de l'édition : 21 × 12 cubes, qui se redresse autour de son bord arrière ───
export const DALLE_L = 21;
export const DALLE_H = 12;
export const PIVOT: V3 = [0, 0, -10.3];
export const dalle = (rang: number) => ({cx: rang % DALLE_L, cz: Math.floor(rang / DALLE_L)});

// ─── Les pages du site, chacune à son endroit du monde (v4) ───
// Une page = une capture posée dans le monde : centre, orientation (ry autour de la verticale,
// puis rx qui la penche en arrière, ou la couche au sol à −π/2), largeur L, hauteur H.
// Dans le repère d'une page : u vers la droite, v vers le haut de l'image, w vers l'avant.
export const PAGE_L = 21;
export const PAGE_H = (21 * 1080) / 1920;

type Lieu = {
	src: string;
	centre: V3;
	ry: number;
	rx: number;
	L: number;
	H: number;
	pixels?: number; // hauteur de la capture, si la page défile dans une fenêtre 16:9
};

/** Un point (u, v, w) d'une page, en coordonnées du monde (rotation rx, puis ry). */
export const versMonde = (lieu: Pick<Lieu, 'centre' | 'ry' | 'rx'>, [u, v, w]: V3): V3 => {
	const y1 = v * Math.cos(lieu.rx) - w * Math.sin(lieu.rx);
	const z1 = v * Math.sin(lieu.rx) + w * Math.cos(lieu.rx);
	return [
		lieu.centre[0] + u * Math.cos(lieu.ry) + z1 * Math.sin(lieu.ry),
		lieu.centre[1] + y1,
		lieu.centre[2] - u * Math.sin(lieu.ry) + z1 * Math.cos(lieu.ry),
	];
};
/** Une page debout ou penchée, posée par son pied (le milieu de son bord bas) sur le sol. */
const debout = (src: string, pied: V3, ry: number, rx: number, L: number, pixels: number): Lieu => {
	const H = (L * pixels) / 1920;
	return {src, centre: versMonde({centre: pied, ry, rx}, [0, H / 2, 0]), ry, rx, L, H};
};

export const EDITION: Lieu = {src: 'captures/newsletter.png', centre: [0, 6.0, -10.85], ry: 0, rx: 0, L: PAGE_L, H: PAGE_H};
export const VEILLE = debout('captures/veille-mur.png', [-50, 0, -80], 0.5, 0, 24, 5400);
export const ACTEURS = debout('captures/acteurs-mur.png', [50, 0, -90], -0.5, -0.28, 24, 4600);
// La fresque est couchée au sol, le haut de l'image vers l'avant (+z) : on la parcourt en
// regardant vers +z, et le texte se lit à l'endroit.
export const FRESQUE: Lieu = {src: 'captures/fresque-sol.png', centre: [0, 0.05, -175], ry: Math.PI, rx: -Math.PI / 2, L: 30, H: (30 * 5600) / 1920};
// Le Topo : un écran flottant, la page y défile.
export const TOPO: Lieu = {src: 'captures/topo-defile.png', centre: [-55, 7.4, -175], ry: 1.0, rx: 0, L: PAGE_L, H: PAGE_H, pixels: 3400};
export const LIEUX = [EDITION, VEILLE, ACTEURS, FRESQUE, TOPO];

// ─── Le S géant : les 10 pixels du logo, cubes de 4,5 sur une grille de 5,5 ───
export const S_BASE: V3 = [0, 0, -110];
export const S_TAILLE = 4.5;
export const S_CUBES: V3[] = PIXEL_ORDRE.map(([col, ligne]) => [
	S_BASE[0] + (col * 11 + 4.5 - 21) * 0.5,
	S_BASE[1] + ((4 - ligne) * 11 + 4.5) * 0.5,
	S_BASE[2],
]);

// ─── La fin : le S rétrécit et devient la dernière lettre du logo « luca100 » + S ───
// Comme sur le site : le S fait 0,7 em, posé sur la ligne de base, à 0,125 em du « 0 ».
export const S_REDUIT = 0.4;
export const EM = (26.5 * S_REDUIT) / 0.7; // 15,1 unités
export const LOGO_TEXTE_L = 3.41 * EM; // « luca100 » en Funnel Display 500, interlettrage −0,045 em
const LOGO_L = LOGO_TEXTE_L + 0.125 * EM + 21 * S_REDUIT;
export const LOGO_GAUCHE = S_BASE[0] - LOGO_L / 2;
const S_PETIT_X = LOGO_GAUCHE + LOGO_TEXTE_L + 0.125 * EM + (21 * S_REDUIT) / 2;
export const S_CUBES_PETITS: V3[] = PIXEL_ORDRE.map(([col, ligne]) => [
	S_PETIT_X + (col * 11 + 4.5 - 21) * 0.5 * S_REDUIT,
	((4 - ligne) * 11 + 4.5) * 0.5 * S_REDUIT,
	S_BASE[2],
]);
