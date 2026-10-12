// Range la vidéo finie dans le récap du projet, avec sa source, sa recette et son bilan.
//
//   node livrer.mjs <atelier> <racine du projet> [--nom <projet>] [--session <id>]
//
// → <racine>/__recap-system-100s/5-video/
//     <projet>-vN.mp4              la vidéo (N : la première version libre, jamais d'écrasement)
//     <projet>-vN-storyboard.md    le storyboard
//     <projet>-vN-pitch.md         le texte de la voix off, s'il y en a une
//     <projet>-vN-recette.md       les choix du film (style, DA, musique, voix, niveaux, bruitages,
//                                  son mesuré), pour en refaire un pareil : nouveau.mjs --recette
//     <projet>-vN-planche.png      neuf images du film, prises dans la vidéo livrée
//     <projet>-vN-source/         le code de la vidéo (src, réglages, données, DA, polices, logo), sans node_modules
//     <projet>-vN-bilan.md         temps, appels au modèle, agents, jetons, rendus
import {execFileSync} from 'node:child_process';
import {appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, join} from 'node:path';
import {binaire, environnement} from './binaires.mjs';
import {ecrirePng, lirePng, planche} from './png.mjs';

const [atelier, racine] = process.argv.slice(2);
const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
if (!atelier || !racine) throw new Error('Usage : node livrer.mjs <atelier> <racine du projet> [--nom <projet>]');
const film = join(atelier, 'renders', 'film.mp4');
if (!existsSync(film)) throw new Error(`Pas de film rendu : ${film} (lancer rendre.mjs d'abord)`);
const lire = (f) => (existsSync(f) ? readFileSync(f, 'utf-8').replace(/^﻿/, '') : '');
const json = (f) => {
	try {
		return JSON.parse(lire(f));
	} catch {
		return null;
	}
};

const nom = arg('nom') ?? basename(atelier).replace(/-v\d+$/, '');
const dossier = join(racine, '__recap-system-100s', '5-video');
mkdirSync(dossier, {recursive: true});
let n = 1;
while (existsSync(join(dossier, `${nom}-v${n}.mp4`))) n++;
const base = join(dossier, `${nom}-v${n}`);

copyFileSync(film, `${base}.mp4`);
if (existsSync(join(atelier, 'STORYBOARD.md'))) copyFileSync(join(atelier, 'STORYBOARD.md'), `${base}-storyboard.md`);
if (existsSync(join(atelier, 'PITCH.md'))) copyFileSync(join(atelier, 'PITCH.md'), `${base}-pitch.md`);
cpSync(join(atelier, 'src'), join(`${base}-source`, 'src'), {recursive: true});
for (const f of ['donnees.mjs', 'package.json', 'remotion.config.ts', 'da.json', 'apercus.json']) {
	if (existsSync(join(atelier, f))) copyFileSync(join(atelier, f), join(`${base}-source`, f));
}
// La DA se garde avec ses polices (dont celles du client) et son logo : sans eux, pas de refonte à l'identique.
for (const d of ['fonts', 'marque']) {
	if (existsSync(join(atelier, 'public', d))) cpSync(join(atelier, 'public', d), join(`${base}-source`, 'public', d), {recursive: true});
}
// La voix off se garde : un enregistrement de l'utilisateur ne se refait pas.
if (existsSync(join(atelier, 'public', 'voix', 'voix.wav'))) {
	mkdirSync(join(`${base}-source`, 'public', 'voix'), {recursive: true});
	copyFileSync(join(atelier, 'public', 'voix', 'voix.wav'), join(`${base}-source`, 'public', 'voix', 'voix.wav'));
}
// La palette des bruitages (noms, familles, niveaux), pour retrouver ceux du film.
if (existsSync(join(atelier, 'public', 'son', 'sons.json'))) {
	mkdirSync(join(`${base}-source`, 'public', 'son'), {recursive: true});
	copyFileSync(join(atelier, 'public', 'son', 'sons.json'), join(`${base}-source`, 'public', 'son', 'sons.json'));
}

// ─── La recette : ce qui a été choisi pour ce film, relu dans l'atelier ───────────────────────────
const journal = lire(join(atelier, 'journal.jsonl')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const dernier = (cle) => journal.filter((e) => e[cle] !== undefined).at(-1)?.[cle];
const images = dernier('images');
const duree = images ? Math.round((images / 30) * 10) / 10 : null;
const son = dernier('sonie');

const reglages = lire(join(atelier, 'src', 'reglages.ts'));
const nombre = (texte, variable) => {
	const m = texte.match(new RegExp(`${variable} = (-?[\\d.]+)`));
	return m ? Number(m[1]) : null;
};
const musique = reglages.match(/\/\/ Musique : (.+?) ; /)?.[1] ?? null;
let niveaux = null;
try {
	niveaux = JSON.parse(reglages.match(/NIVEAUX = (\{.*\});/)[1].replace(/(\w+):/g, '"$1":'));
} catch {
	// un atelier d'avant les niveaux
}

// Le code du film (sans les kits des styles ni Son.tsx, qui définit Effet et Suite).
// Le style : celui que le code passe à adapterDA (le plus employé), sinon le storyboard.
const fichiers = (d) =>
	readdirSync(d, {withFileTypes: true}).flatMap((e) =>
		e.isDirectory() ? (e.name === 'styles' ? [] : fichiers(join(d, e.name))) : /\.tsx?$/.test(e.name) && e.name !== 'Son.tsx' ? [join(d, e.name)] : [],
	);
const code = fichiers(join(atelier, 'src')).map((f) => readFileSync(f, 'utf-8')).join('\n');
const catalogue = json(join(atelier, 'src', 'styles', 'catalogue.json')) ?? [];
const comptes = {};
for (const m of code.matchAll(/adapterDA\(\s*['"](\w+)['"]/g)) comptes[m[1]] = (comptes[m[1]] ?? 0) + 1;
let style = Object.entries(comptes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
if (!style) {
	const ligne = lire(join(atelier, 'STORYBOARD.md')).split('\n').find((l) => /style/i.test(l)) ?? '';
	style = catalogue.find((s) => new RegExp(`\\b(${s.id}|${s.nom})\\b`, 'i').test(ligne))?.id ?? null;
}
const nomStyle = catalogue.find((s) => s.id === style)?.nom ?? style;

// La voix : d'après l'en-tête de pitch.ts (écrit par voix.mjs).
const pitch = lire(join(atelier, 'src', 'pitch.ts'));
const origineVoix = pitch.match(/voix\.mjs le .+? : (.+)\.\r?\n/)?.[1] ?? '';
const nbPhrases = (pitch.match(/\{debut: /g) ?? []).length;
const voix = !nbPhrases
	? {mode: 'aucune'}
	: /Gemini/.test(origineVoix)
		? {mode: 'ia', nom: origineVoix.match(/voix (\w+)/)?.[1] ?? 'Achird'}
		: {mode: /doublage|prévu/.test(origineVoix) ? 'doublage' : 'enregistrement'};

// Les bruitages écrits dans le code (un emploi dans une boucle compte pour un) et les suites.
const emplois = {};
for (const m of code.matchAll(/<(Effet|Suite)\b[^>]*?\bsrc=\{?["'`]([^"'`]+)["'`]/g)) {
	const e = (emplois[m[2]] ??= {effets: 0, suites: 0});
	e[m[1] === 'Suite' ? 'suites' : 'effets']++;
}
const montes = (code.match(/<Effet\b[^>]*\bton=/g) ?? []).length;
const da = json(join(atelier, 'da.json'));

// La planche : neuf images prises dans la vidéo livrée, au milieu de chaque neuvième du film.
let plancheOk = false;
if (duree) {
	const ffmpeg = binaire(atelier);
	const tmp = mkdtempSync(join(tmpdir(), 'planche-'));
	try {
		const vues = [];
		for (let i = 0; i < 9; i++) {
			const png = join(tmp, `${i}.png`);
			execFileSync(ffmpeg, ['-v', 'error', '-y', '-ss', ((duree * (i + 0.5)) / 9).toFixed(2), '-i', film, '-frames:v', '1', '-vf', 'scale=640:-2', png], {env: environnement(ffmpeg)});
			vues.push(lirePng(readFileSync(png)));
		}
		writeFileSync(`${base}-planche.png`, ecrirePng(planche(vues)));
		plancheOk = true;
	} catch (e) {
		console.warn(`Planche impossible : ${e.message.split('\n')[0]}`);
	} finally {
		rmSync(tmp, {recursive: true, force: true});
	}
}

const fr = (x) => String(x).replace('.', ',').replace(/^-/, '−');
const nomFichier = basename(base);
const donnees = {
	version: 1,
	film: `${nomFichier}.mp4`,
	source: `${nomFichier}-source`,
	style,
	da: da?.nom ?? null,
	musique,
	bpm: nombre(reglages, 'BPM'),
	musiqueLufs: nombre(reglages, 'MUSIQUE_LUFS'),
	niveaux,
	voix,
	duree,
	nbTemps: nombre(reglages, 'NB_TEMPS'),
};
const texteVoix = {
	ia: `IA (Gemini), voix ${voix.nom}`,
	doublage: "celle de l'utilisateur, en doublage sur le film",
	enregistrement: "celle de l'utilisateur, lecture enregistrée",
	aucune: 'aucune (film musical)',
}[voix.mode];
const md = [
	`# Recette : ${nom} v${n}`,
	'',
	"Les choix de ce film, pour en refaire un dans le même esprit (un autre projet, ou une suite).",
	"L'histoire, elle, se réécrit toujours : ni le storyboard, ni le pitch, ni les captures ne se reprennent.",
	'',
	`Livré le ${new Date().toLocaleDateString('fr-FR')}${duree ? ` · ${fr(duree)} s` : ''}${images ? ` · ${images} images` : ''} · [${nomFichier}.mp4](${nomFichier}.mp4)`,
	'',
	...(plancheOk ? [`![Neuf images du film](${nomFichier}-planche.png)`, ''] : []),
	'## Les choix',
	'',
	'| | |',
	'|---|---|',
	`| Style | ${style ? `${nomStyle} (\`${style}\`), fiche \`styles/${style}.md\` du skill film` : '(pas trouvé dans le code)'} |`,
	...(da
		? [
				`| DA | ${da.nom}${da.source && da.source !== 'style' ? ` (${da.source})` : ''} |`,
				`| Couleurs | ${Object.entries(da.couleurs ?? {}).map(([r, c]) => `${r} \`${c}\``).join(' · ')} |`,
				`| Polices | ${Object.entries(da.polices ?? {}).map(([r, p]) => `${r} ${p.famille}${p.graisse ? ` ${p.graisse}` : ''}`).join(' · ')} |`,
			]
		: ['| DA | (pas de da.json) |']),
	`| Musique | ${musique ? `${musique} · ${fr(nombre(reglages, 'BPM'))} temps/min${nombre(reglages, 'MUSIQUE_LUFS') !== null ? ` · sonie du morceau ${fr(nombre(reglages, 'MUSIQUE_LUFS'))} LUFS` : ''}` : 'aucune (film muet)'} |`,
	`| Voix off | ${texteVoix}${nbPhrases ? ` · ${nbPhrases} phrases · ${fr(nombre(pitch, 'DUREE_VOIX'))} s` : ''} |`,
	`| Niveaux | ${niveaux ? `musique seule ${fr(niveaux.musique)} · entre les phrases ${fr(niveaux.entreVoix)} · sous la voix ${fr(niveaux.sousVoix)} (${-14 - niveaux.sousVoix} dB sous elle) · bruitage à volume 1 : ${fr(niveaux.bruitage)} LUFS` : "atelier d'avant les niveaux"} |`,
	`| Son mesuré | ${son ? `film ${fr(son.film)} LUFS, crête ${fr(son.crete)} dB${son.ecart !== undefined ? ` · voix ${fr(son.voix)} · écart voix/musique ${fr(son.ecart)} dB en médiane` : ''}` : 'pas mesuré (rendre.mjs le fait après chaque film)'} |`,
	`| Durée | ${nombre(reglages, 'NB_TEMPS')} temps de musique${duree ? `, ${fr(duree)} s` : ''} |`,
	'',
	'## Les bruitages',
	'',
	...(Object.keys(emplois).length
		? [
				'| Bruitage | Emplois dans le code | Dont suites qui montent |',
				'|---|--:|--:|',
				...Object.entries(emplois)
					.sort((a, b) => b[1].effets + b[1].suites - (a[1].effets + a[1].suites))
					.map(([s, e]) => `| ${s} | ${e.effets + e.suites} | ${e.suites || ''} |`),
				'',
				`Un emploi écrit dans une boucle (\`.map\`) compte pour un.${montes ? ` Et ${montes} Effet avec un \`ton\` réglé à la main.` : ''}`,
			]
		: ['Aucun.']),
	'',
	'## Refaire un film avec cette recette',
	'',
	"Dans Claude Code : « refais un film avec la recette de " + `${nom} v${n} ». Ou directement :`,
	'',
	'```bash',
	`node "<skill film>/outils/nouveau.mjs" --projet <nom> --version <N> --recette "${base}-recette.md"`,
	'```',
	'',
	"Reprend la DA (sauf `--da` ou `--style`), la musique (sauf `--musique` : la reprendre est le choix de",
	"l'utilisateur, la règle « jamais la musique des derniers films » ne joue pas) et les niveaux ; rappelle",
	'le style et la voix.',
	'',
	'```json recette',
	JSON.stringify(donnees, null, '\t'),
	'```',
	'',
].join('\n');
writeFileSync(`${base}-recette.md`, md);

// Le bilan : fin du travail maintenant, puis le calcul sur les journaux de Claude Code.
appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({etape: 'fin', t: new Date().toISOString()}) + '\n');
copyFileSync(join(atelier, 'journal.jsonl'), join(`${base}-source`, 'journal.jsonl'));
const args = [join(import.meta.dirname, 'bilan.mjs'), 'calculer', '--journal', join(atelier, 'journal.jsonl'), '--titre', `${nom} v${n}`, '--md', `${base}-bilan.md`];
if (arg('session')) args.push('--session', arg('session'));
console.log(execFileSync('node', args, {encoding: 'utf-8'}));
console.log(`Livré : ${base}.mp4`);
console.log(`Recette : ${base}-recette.md${plancheOk ? ` (planche : ${base}-planche.png)` : ''}`);
