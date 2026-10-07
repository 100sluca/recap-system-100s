// Les chiffres de Doto (la police des chiffres du site), en matrice 5 × 7, relevés dans
// doto.woff2 (graisse 900). Pour écrire un nombre ou une heure en cubes, lisible en grand :
// le monter de face, deux colonnes vides entre les chiffres, cubes de 0,86 sur un pas de 1,15.
// Le deux-points de Doto est une croix : en cubes, prendre deux points (lignes 2 et 4).
import type {V3} from './outils3d';

export const DOTO: Record<string, string[]> = {
	'0': ['00100', '01010', '10001', '10001', '10001', '01010', '00100'],
	'1': ['00100', '01100', '10100', '00100', '00100', '00100', '11111'],
	'2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
	'3': ['11111', '00001', '00010', '00110', '00001', '10001', '01110'],
	'4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
	'5': ['11111', '10000', '10110', '11001', '00001', '10001', '01110'],
	'6': ['00110', '01000', '10000', '10110', '11001', '10001', '01110'],
	'7': ['11111', '00001', '00010', '00010', '00100', '01000', '01000'],
	'8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
	'9': ['01110', '10001', '10011', '01101', '00001', '00010', '01100'],
	':': ['0', '0', '1', '0', '1', '0', '0'],
};

/**
 * Les cases allumées d'un texte (chiffres et deux-points) : positions des cubes, debout sur le
 * sol, centrées en x. `ecart` = colonnes vides entre deux caractères.
 */
export const casesTexte = (texte: string, pas = 1.15, ecart = 2): {p: V3; car: number}[] => {
	const largeurs = texte.split('').map((c) => DOTO[c]?.[0].length ?? 0);
	const total = largeurs.reduce((a, b) => a + b, 0) + ecart * (texte.length - 1);
	const cases: {p: V3; car: number}[] = [];
	let col = 0;
	texte.split('').forEach((c, k) => {
		DOTO[c]?.forEach((ligne, l) =>
			ligne.split('').forEach((bit, x) => {
				if (bit === '1') cases.push({p: [(col + x - (total - 1) / 2) * pas, 0.5 + (6 - l) * pas, 0], car: k});
			}),
		);
		col += largeurs[k] + ecart;
	});
	return cases;
};
