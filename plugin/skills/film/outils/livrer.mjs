// Range la vidéo finie dans le récap du projet, avec sa source et son bilan.
//
//   node livrer.mjs <atelier> <racine du projet> [--nom <projet>] [--session <id>]
//
// → <racine>/__recap-system-100s/5-video/
//     <projet>-vN.mp4              la vidéo (N : la première version libre, jamais d'écrasement)
//     <projet>-vN-storyboard.md    le storyboard
//     <projet>-vN-source/          le code de la vidéo (src, réglages, données), sans node_modules
//     <projet>-vN-bilan.md         temps, appels au modèle, agents, jetons, rendus
import {execFileSync} from 'node:child_process';
import {appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync} from 'node:fs';
import {basename, join} from 'node:path';

const [atelier, racine] = process.argv.slice(2);
const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
if (!atelier || !racine) throw new Error('Usage : node livrer.mjs <atelier> <racine du projet> [--nom <projet>]');
const film = join(atelier, 'renders', 'film.mp4');
if (!existsSync(film)) throw new Error(`Pas de film rendu : ${film} (lancer rendre.mjs d'abord)`);

const nom = arg('nom') ?? basename(atelier).replace(/-v\d+$/, '');
const dossier = join(racine, '__recap-system-100s', '5-video');
mkdirSync(dossier, {recursive: true});
let n = 1;
while (existsSync(join(dossier, `${nom}-v${n}.mp4`))) n++;
const base = join(dossier, `${nom}-v${n}`);

copyFileSync(film, `${base}.mp4`);
if (existsSync(join(atelier, 'STORYBOARD.md'))) copyFileSync(join(atelier, 'STORYBOARD.md'), `${base}-storyboard.md`);
cpSync(join(atelier, 'src'), join(`${base}-source`, 'src'), {recursive: true});
for (const f of ['donnees.mjs', 'package.json', 'remotion.config.ts', 'journal.jsonl']) {
	if (existsSync(join(atelier, f))) copyFileSync(join(atelier, f), join(`${base}-source`, f));
}

// Le bilan : fin du travail maintenant, puis le calcul sur les journaux de Claude Code.
appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({etape: 'fin', t: new Date().toISOString()}) + '\n');
const args = [join(import.meta.dirname, 'bilan.mjs'), 'calculer', '--journal', join(atelier, 'journal.jsonl'), '--titre', `${nom} v${n}`, '--md', `${base}-bilan.md`];
if (arg('session')) args.push('--session', arg('session'));
console.log(execFileSync('node', args, {encoding: 'utf-8'}));
console.log(`Livré : ${base}.mp4`);
