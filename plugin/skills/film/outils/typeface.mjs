// Convertit une police TTF en « typeface JSON » pour les lettres 3D de Three.js (FontLoader +
// TextGeometry), comme le fait TTFLoader, mais hors du navigateur (il charge opentype.js depuis
// un CDN, que le bundler de Remotion ne sait pas suivre).
//   node typeface.mjs <police.ttf> <sortie.json>   (opentype.js est dans le modèle : lancer depuis l atelier)
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

// opentype.js est installé dans l'atelier : le chercher depuis le dossier courant.
const opentype = createRequire(join(process.cwd(), 'package.json'))('opentype.js');

const [entree, sortie] = process.argv.slice(2);
const buf = readFileSync(entree);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const round = Math.round;
const scale = 100000 / ((font.unitsPerEm || 2048) * 72);
const glyphs = {};
for (const [unicode, index] of Object.entries(font.encoding.cmap.glyphIndexMap)) {
	const glyph = font.glyphs.get(index);
	let o = '';
	for (const c of glyph.path.commands) {
		const type = c.type.toLowerCase() === 'c' ? 'b' : c.type.toLowerCase();
		o += `${type} `;
		if (c.x !== undefined) o += `${round(c.x * scale)} ${round(c.y * scale)} `;
		if (c.x1 !== undefined) o += `${round(c.x1 * scale)} ${round(c.y1 * scale)} `;
		if (c.x2 !== undefined) o += `${round(c.x2 * scale)} ${round(c.y2 * scale)} `;
	}
	glyphs[String.fromCodePoint(Number(unicode))] = {
		ha: round(glyph.advanceWidth * scale),
		x_min: round((glyph.xMin ?? 0) * scale),
		x_max: round((glyph.xMax ?? 0) * scale),
		o,
	};
}
writeFileSync(
	sortie,
	JSON.stringify({
		glyphs,
		familyName: font.getEnglishName('fullName'),
		ascender: round(font.ascender * scale),
		descender: round(font.descender * scale),
		underlinePosition: font.tables.post.underlinePosition,
		underlineThickness: font.tables.post.underlineThickness,
		boundingBox: {xMin: font.tables.head.xMin, xMax: font.tables.head.xMax, yMin: font.tables.head.yMin, yMax: font.tables.head.yMax},
		resolution: 1000,
	}),
);
console.log(`${sortie} : ${Object.keys(glyphs).length} glyphes`);
