// Rend la vidéo d'un atelier, ou une planche d'images clés pour la contrôler.
//
//   node rendre.mjs <atelier> --temps 0.5,4,8.5,12     planche : une image par temps de musique, sans son
//   node rendre.mjs <atelier> --images 15,120,300      planche : numéros d'image
//   node rendre.mjs <atelier>                          le film complet → <atelier>/renders/film.mp4
//
// Les chiffres du film : si l'atelier a un donnees.mjs (export default async () => ({…})), il est
// appelé avant chaque rendu (chiffres du jour relus sur le site, par exemple) ; sinon les defaultProps.
// Le film complet est rendu dans le dossier temporaire puis recopié : sous Windows, l'accès contrôlé
// aux dossiers bloque le ffmpeg de Remotion sous Documents. La durée du rendu est notée dans
// journal.jsonl. Rien d'autre à installer : Remotion apporte son Chrome et son ffmpeg.
import {execFileSync, execSync} from 'node:child_process';
import {appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {binaire, environnement} from './binaires.mjs';
import {ecrirePng, lirePng, planche as assembler} from './png.mjs';

const atelier = process.argv[2];
if (!atelier || !existsSync(join(atelier, 'package.json'))) throw new Error('Usage : node rendre.mjs <atelier> [--temps …|--images …]');
const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
const reglages = readFileSync(join(atelier, 'src', 'reglages.ts'), 'utf-8');
const bpm = Number(reglages.match(/BPM = ([\d.]+)/)?.[1] ?? 105);
const image = (temps) => Math.round((temps * 30 * 60) / bpm);

let props = {};
if (existsSync(join(atelier, 'donnees.mjs'))) {
	props = await (await import(pathToFileURL(join(atelier, 'donnees.mjs')).href)).default();
	console.log('Chiffres relus :', props);
}
mkdirSync(join(atelier, 'out'), {recursive: true});

const choix = arg('temps')
	? arg('temps').split(',').map((x) => image(Number(x)))
	: arg('images')?.split(',').map(Number);

if (choix) {
	// Les images au tiers de leur taille (640 × 360), assemblées en 3 colonnes dans l'ordre demandé.
	const dossier = join(atelier, 'out', `planche-${Date.now()}`);
	writeFileSync(join(atelier, 'out', 'props-planche.json'), JSON.stringify({...props, son: false}));
	execSync(
		`npx remotion render Film "${dossier}" --props=out/props-planche.json --frames=${choix.join(',')} --image-format=png --scale=0.3333333 --concurrency=4 --log=error`,
		{cwd: atelier, stdio: 'inherit'},
	);
	const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.png')).sort();
	const feuille = join(dossier, 'planche.png');
	writeFileSync(feuille, ecrirePng(assembler(fichiers.map((f) => lirePng(readFileSync(join(dossier, f)))))));
	console.log(`Planche (images ${fichiers.map((f) => Number(f.match(/(\d+)\.png$/)[1])).join(', ')}, de gauche à droite puis de haut en bas) : ${feuille}`);
} else {
	writeFileSync(join(atelier, 'out', 'props.json'), JSON.stringify(props));
	const temporaire = join(tmpdir(), `film-${Date.now()}.mp4`);
	const debut = Date.now();
	execSync(`npx remotion render Film "${temporaire}" --props=out/props.json --codec=h264 --crf=20 --concurrency=4`, {
		cwd: atelier,
		stdio: 'inherit',
	});
	const secondes = (Date.now() - debut) / 1000;
	mkdirSync(join(atelier, 'renders'), {recursive: true});
	copyFileSync(temporaire, join(atelier, 'renders', 'film.mp4'));
	rmSync(temporaire);
	const ffprobe = binaire(atelier, 'ffprobe');
	const nbImages = Number(
		execFileSync(ffprobe, ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', join(atelier, 'renders', 'film.mp4')], {encoding: 'utf-8', env: environnement(ffprobe)}).replace(/[^\d]/g, ''),
	);
	appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({rendu: secondes, images: nbImages, t: new Date().toISOString()}) + '\n');
	console.log(`Film : ${join(atelier, 'renders', 'film.mp4')} (${nbImages} images, rendu en ${Math.round(secondes)} s)`);
}
