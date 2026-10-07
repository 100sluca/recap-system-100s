// Lire et écrire des PNG sans dépendance (zlib de Node), pour assembler une planche d'images.
// Lit les PNG 8 bits RVB ou RVBA non entrelacés, ceux que Remotion écrit ; écrit du RVB.
import {deflateSync, inflateSync} from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** → {largeur, hauteur, pixels} : pixels en RVB, 3 octets par point. */
export function lirePng(octets) {
	if (!octets.subarray(0, 8).equals(SIGNATURE)) throw new Error("ce n'est pas un PNG");
	let i = 8;
	let largeur = 0;
	let hauteur = 0;
	let canaux = 0;
	const morceaux = [];
	while (i < octets.length) {
		const taille = octets.readUInt32BE(i);
		const type = octets.toString('latin1', i + 4, i + 8);
		const donnees = octets.subarray(i + 8, i + 8 + taille);
		if (type === 'IHDR') {
			largeur = donnees.readUInt32BE(0);
			hauteur = donnees.readUInt32BE(4);
			const [profondeur, couleur, , , entrelace] = donnees.subarray(8, 13);
			if (profondeur !== 8 || entrelace !== 0 || (couleur !== 2 && couleur !== 6)) throw new Error('PNG non pris en charge (8 bits RVB ou RVBA, non entrelacé)');
			canaux = couleur === 6 ? 4 : 3;
		} else if (type === 'IDAT') morceaux.push(donnees);
		else if (type === 'IEND') break;
		i += 12 + taille;
	}
	const brut = inflateSync(Buffer.concat(morceaux));
	const ligne = largeur * canaux;
	const image = Buffer.alloc(hauteur * ligne);
	for (let y = 0; y < hauteur; y++) {
		const filtre = brut[y * (ligne + 1)];
		const src = brut.subarray(y * (ligne + 1) + 1, (y + 1) * (ligne + 1));
		const dst = image.subarray(y * ligne, (y + 1) * ligne);
		const haut = y > 0 ? image.subarray((y - 1) * ligne, y * ligne) : null;
		for (let x = 0; x < ligne; x++) {
			const a = x >= canaux ? dst[x - canaux] : 0;
			const b = haut ? haut[x] : 0;
			const c = haut && x >= canaux ? haut[x - canaux] : 0;
			let v = src[x];
			if (filtre === 1) v += a;
			else if (filtre === 2) v += b;
			else if (filtre === 3) v += (a + b) >> 1;
			else if (filtre === 4) {
				const p = a + b - c;
				const pa = Math.abs(p - a);
				const pb = Math.abs(p - b);
				const pc = Math.abs(p - c);
				v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			}
			dst[x] = v & 0xff;
		}
	}
	if (canaux === 3) return {largeur, hauteur, pixels: image};
	// RVBA → RVB sur fond gris.
	const pixels = Buffer.alloc(largeur * hauteur * 3);
	for (let p = 0; p < largeur * hauteur; p++) {
		const al = image[p * 4 + 3] / 255;
		for (let k = 0; k < 3; k++) pixels[p * 3 + k] = Math.round(image[p * 4 + k] * al + 128 * (1 - al));
	}
	return {largeur, hauteur, pixels};
}

const TABLE = Array.from({length: 256}, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc = (b) => {
	let c = 0xffffffff;
	for (const o of b) c = TABLE[(c ^ o) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
const morceau = (type, donnees) => {
	const t = Buffer.concat([Buffer.from(type, 'latin1'), donnees]);
	const entete = Buffer.alloc(4);
	entete.writeUInt32BE(donnees.length);
	const fin = Buffer.alloc(4);
	fin.writeUInt32BE(crc(t));
	return Buffer.concat([entete, t, fin]);
};

/** {largeur, hauteur, pixels RVB} → octets PNG. */
export function ecrirePng({largeur, hauteur, pixels}) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(largeur, 0);
	ihdr.writeUInt32BE(hauteur, 4);
	ihdr.set([8, 2, 0, 0, 0], 8);
	const brut = Buffer.alloc(hauteur * (largeur * 3 + 1));
	for (let y = 0; y < hauteur; y++) pixels.copy(brut, y * (largeur * 3 + 1) + 1, y * largeur * 3, (y + 1) * largeur * 3);
	return Buffer.concat([SIGNATURE, morceau('IHDR', ihdr), morceau('IDAT', deflateSync(brut)), morceau('IEND', Buffer.alloc(0))]);
}

/** Une planche : les images en grille de `colonnes`, chacune à sa taille, sur fond gris. */
export function planche(images, colonnes = 3) {
	const l = Math.max(...images.map((im) => im.largeur));
	const h = Math.max(...images.map((im) => im.hauteur));
	const lignes = Math.ceil(images.length / colonnes);
	const largeur = l * Math.min(colonnes, images.length);
	const hauteur = h * lignes;
	const pixels = Buffer.alloc(largeur * hauteur * 3, 128);
	images.forEach((im, n) => {
		const x0 = (n % colonnes) * l;
		const y0 = Math.floor(n / colonnes) * h;
		for (let y = 0; y < im.hauteur; y++) {
			im.pixels.copy(pixels, ((y0 + y) * largeur + x0) * 3, y * im.largeur * 3, (y + 1) * im.largeur * 3);
		}
	});
	return {largeur, hauteur, pixels};
}
