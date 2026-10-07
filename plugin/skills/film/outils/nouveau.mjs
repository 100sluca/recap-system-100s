// Crée l'atelier d'une vidéo : une copie du modèle Remotion, la musique et les bruitages,
// l'installation des paquets, le tempo de la musique et le journal du bilan.
//
//   node nouveau.mjs --projet <nom> --version <N> [--musique "<fichier>"] [--muet]
//
// La musique, dans l'ordre : --musique (un fichier, ou un nom de la banque-son), le réglage
// « musique », sinon rien : l'outil liste alors les morceaux de la banque-son et s'arrête. --muet
// fait un film sans son (105 temps par minute).
// Les bruitages : ceux que <banque-son>/bruitages.json nomme ({"clic.wav": "sound-effects/…", …}).
// Sans banque-son, le film n'a pas de bruitages ; le modèle se tait là où il en attendait.
// Réglages (banqueSon, musique, ateliers) : node ../../recap-system-100s/reglages.mjs
//
// L'atelier est hors des dépôts (ses node_modules pèsent 300 Mo) : <ateliers>/<nom>-v<N>/, par
// défaut ~/recap-film/. Sous Windows, ni sous Documents (l'accès contrôlé aux dossiers y bloque le
// ffmpeg de Remotion) ni sous %LOCALAPPDATA% (l'application Claude y redirige ses écritures vers un
// dossier privé, invisible depuis l'Explorateur).
import {execFileSync, execSync} from 'node:child_process';
import {appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename, extname, join} from 'node:path';
import {lireReglages} from '../../recap-system-100s/reglages.mjs';

const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
const projet = arg('projet');
const version = arg('version') ?? '1';
const muet = process.argv.includes('--muet');
if (!projet) throw new Error('Usage : node nouveau.mjs --projet <nom> --version <N> [--musique "<fichier>"] [--muet]');

const SKILL = join(import.meta.dirname, '..');
const reglages = lireReglages();
const BANQUE = reglages.banqueSon && existsSync(reglages.banqueSon) ? reglages.banqueSon : null;
const atelier = join(reglages.ateliers || join(homedir(), 'recap-film'), `${projet}-v${version}`);

// Un fichier de musique : absolu, relatif au dossier courant, ou cherché dans la banque-son.
function trouverMusique(nom) {
	if (!nom) return null;
	const candidats = [nom, BANQUE && join(BANQUE, nom), BANQUE && join(BANQUE, 'musique', nom)].filter(Boolean);
	return candidats.find((c) => existsSync(c)) ?? null;
}

if (existsSync(join(atelier, 'package.json'))) {
	console.log(`L'atelier existe déjà : ${atelier}`);
} else {
	const musique = muet ? null : trouverMusique(arg('musique')) ?? trouverMusique(reglages.musique);
	if (!muet && !musique) {
		const morceaux = BANQUE && existsSync(join(BANQUE, 'musique')) ? readdirSync(join(BANQUE, 'musique')).filter((f) => /\.(mp3|wav|m4a|ogg|flac)$/i.test(f)) : [];
		console.error(arg('musique') ? `Musique introuvable : ${arg('musique')}` : 'Aucune musique choisie.');
		if (morceaux.length) console.error(`Morceaux de la banque-son (${join(BANQUE, 'musique')}) :\n  ${morceaux.join('\n  ')}`);
		else console.error('Pas de banque-son réglée : passer --musique "<fichier audio>", ou --muet pour un film sans son.');
		process.exit(1);
	}

	cpSync(join(SKILL, 'modele'), atelier, {recursive: true});
	// Le journal du bilan : la première étape commence maintenant.
	appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({etape: 'Préparation', t: new Date().toISOString()}) + '\n');
	mkdirSync(join(atelier, 'public', 'son'), {recursive: true});
	mkdirSync(join(atelier, 'public', 'captures'), {recursive: true});

	const nomMusique = musique ? `musique${extname(musique)}` : '';
	if (musique) copyFileSync(musique, join(atelier, 'public', 'son', nomMusique));

	// Les bruitages de la banque, s'il y en a une.
	const sons = [];
	const carte = BANQUE && join(BANQUE, 'bruitages.json');
	if (carte && existsSync(carte)) {
		for (const [nom, chemin] of Object.entries(JSON.parse(readFileSync(carte, 'utf-8').replace(/^﻿/, '')))) {
			const source = join(BANQUE, chemin);
			if (existsSync(source)) {
				copyFileSync(source, join(atelier, 'public', 'son', nom));
				sons.push(nom);
			} else console.warn(`Bruitage absent de la banque : ${chemin}`);
		}
	}
	console.log(sons.length ? `Bruitages : ${sons.join(', ')}` : 'Pas de bruitages (pas de bruitages.json dans la banque-son).');

	console.log('Installation des paquets (environ une minute)…');
	execSync('npm install --no-audit --no-fund --loglevel=error', {cwd: atelier, stdio: 'inherit'});

	// Le tempo : tout le film s'écrit en temps de musique.
	let bpm = 105;
	let premier = 0;
	if (musique) {
		const sortie = execFileSync(process.execPath, [join(SKILL, 'outils', 'tempo.mjs'), musique, '--atelier', atelier], {encoding: 'utf-8'});
		console.log(sortie.trim().split('\n')[0]);
		const m = sortie.match(/BPM=([\d.]+) PREMIER_TEMPS=([\d.]+)/);
		if (m) [bpm, premier] = [Number(m[1]), Number(m[2])];
	}
	writeFileSync(
		join(atelier, 'src', 'reglages.ts'),
		[
			`// Réglages propres à cette vidéo (${projet} v${version}), écrits par outils/nouveau.mjs.`,
			musique ? `// Musique : ${basename(musique)} ; tempo mesuré par outils/tempo.mjs.` : '// Film muet : pas de musique, 105 temps par minute.',
			`export const MUSIQUE = '${nomMusique ? `son/${nomMusique}` : ''}';`,
			`export const BPM = ${bpm};`,
			`export const PREMIER_TEMPS = ${premier}; // en secondes`,
			'export const NB_TEMPS = 16; // durée du film, en temps de musique',
			`export const SONS: readonly string[] = ${JSON.stringify(sons)};`,
			'',
		].join('\n'),
	);
}
console.log(`Atelier : ${atelier}`);
console.log(`Studio  : npx remotion studio --port=3073 (dans l'atelier)`);
