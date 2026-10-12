// Crée l'atelier d'une vidéo : une copie du modèle Remotion, les bruitages, l'installation des
// paquets, la DA, puis (quand elle est choisie) la musique et son tempo, et le journal du bilan.
//
//   node nouveau.mjs --projet <nom> --version <N> [--da <dossier|marque>] [--style <id>] [--musique "<fichier>"] [--muet]
//
// En deux temps, dans l'ordre du circuit (SKILL.md) :
// 1. à la création, la DA : --da installe une DA relevée (dossier de da.mjs) ou une marque rangée
//    (outils/da.mjs --appliquer) ; sinon --style installe la palette propre d'un style ; sinon la DA
//    neutre du modèle, à remplacer (references/da.md). Sans --musique, l'atelier est créé muet et
//    l'outil liste les morceaux de la banque-son, avec ceux que les derniers films ont déjà pris ;
// 2. une fois le style choisi, la même commande avec --musique (un fichier, ou un nom de la
//    banque-son) pose la musique dans l'atelier existant et mesure son tempo.
// Jamais la même musique d'un film à l'autre : outils/musique.mjs propose des morceaux qui vont avec
// le style et qu'aucun des derniers films n'a pris ; chaque musique posée y est notée.
// --muet : un film sans son, assumé (105 temps par minute).
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
const style = arg('style');
const daSource = arg('da');
if (!projet) throw new Error('Usage : node nouveau.mjs --projet <nom> --version <N> [--da <dossier|marque>] [--style <id>] [--musique "<fichier>"] [--muet]');

const SKILL = join(import.meta.dirname, '..');
const reglages = lireReglages();
const BANQUE = reglages.banqueSon && existsSync(reglages.banqueSon) ? reglages.banqueSon : null;
const RACINE = reglages.ateliers || join(homedir(), 'recap-film');
const atelier = join(RACINE, `${projet}-v${version}`);

// Un fichier de musique : absolu, relatif au dossier courant, ou cherché dans la banque-son.
function trouverMusique(nom) {
	if (!nom) return null;
	const candidats = [nom, BANQUE && join(BANQUE, nom), BANQUE && join(BANQUE, 'musique', nom)].filter(Boolean);
	return candidats.find((c) => existsSync(c)) ?? null;
}

// Les morceaux de la banque-son, classés pour le style (tempo) et l'historique des films
// (outils/musique.mjs : jamais ceux des derniers films, trois propositions tirées au sort).
function listerMusiques() {
	if (!BANQUE) {
		console.log("Pas de banque-son réglée : demander un fichier audio dont l'utilisateur a les droits (jamais en télécharger un), ou --muet.");
		return;
	}
	execFileSync(process.execPath, [join(SKILL, 'outils', 'musique.mjs'), 'choisir', ...(style ? ['--style', style] : []), '--atelier', atelier], {stdio: 'inherit'});
}

// Les réglages de la vidéo (reglages.ts) : la musique, son tempo, la durée et les bruitages.
function ecrireReglages({nomMusique, origine, bpm, premier, sons, nbTemps}) {
	writeFileSync(
		join(atelier, 'src', 'reglages.ts'),
		[
			`// Réglages propres à cette vidéo (${projet} v${version}), écrits par outils/nouveau.mjs.`,
			origine ? `// Musique : ${origine} ; tempo mesuré par outils/tempo.mjs.` : muet ? '// Film muet : pas de musique, 105 temps par minute.' : '// Musique pas encore choisie (nouveau.mjs --musique, une fois le style choisi).',
			`export const MUSIQUE = '${nomMusique ? `son/${nomMusique}` : ''}';`,
			`export const BPM = ${bpm};`,
			`export const PREMIER_TEMPS = ${premier}; // en secondes`,
			`export const NB_TEMPS = ${nbTemps}; // durée du film, en temps de musique`,
			`export const SONS: readonly string[] = ${JSON.stringify(sons)};`,
			'',
		].join('\n'),
	);
}

const neuf = !existsSync(join(atelier, 'package.json'));
if (neuf) {
	cpSync(join(SKILL, 'modele'), atelier, {recursive: true});
	// Le journal du bilan : la première étape commence maintenant.
	appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({etape: 'Préparation', t: new Date().toISOString()}) + '\n');
	mkdirSync(join(atelier, 'public', 'son'), {recursive: true});
	mkdirSync(join(atelier, 'public', 'captures'), {recursive: true});

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
	ecrireReglages({nomMusique: '', origine: '', bpm: 105, premier: 0, sons, nbTemps: 16});

	console.log('Installation des paquets (environ une minute)…');
	execSync('npm install --no-audit --no-fund --loglevel=error', {cwd: atelier, stdio: 'inherit'});
} else {
	console.log(`L'atelier existe déjà : ${atelier}`);
}

// La musique : posée maintenant si elle est donnée (à la création ou plus tard), sinon listée.
if (arg('musique')) {
	const musique = trouverMusique(arg('musique'));
	if (!musique) {
		console.error(`Musique introuvable : ${arg('musique')}`);
		listerMusiques();
		process.exit(1);
	}
	const nomMusique = `musique${extname(musique)}`;
	copyFileSync(musique, join(atelier, 'public', 'son', nomMusique));
	const sortie = execFileSync(process.execPath, [join(SKILL, 'outils', 'tempo.mjs'), musique, '--atelier', atelier], {encoding: 'utf-8'});
	console.log(sortie.trim().split('\n')[0]);
	const m = sortie.match(/BPM=([\d.]+) PREMIER_TEMPS=([\d.]+)/);
	const avant = readFileSync(join(atelier, 'src', 'reglages.ts'), 'utf-8');
	ecrireReglages({
		nomMusique,
		origine: basename(musique),
		bpm: m ? Number(m[1]) : 105,
		premier: m ? Number(m[2]) : 0,
		sons: JSON.parse(avant.match(/SONS: readonly string\[\] = (\[.*\]);/)?.[1] ?? '[]'),
		nbTemps: Number(avant.match(/NB_TEMPS = (\d+)/)?.[1] ?? 16),
	});
	// L'historique des musiques, pour varier d'un film à l'autre.
	execFileSync(process.execPath, [join(SKILL, 'outils', 'musique.mjs'), 'noter', projet, version, basename(musique)], {stdio: 'inherit'});
} else if (neuf && !muet) {
	console.log('Musique : pas encore choisie. Une fois le style choisi : node OUTILS/musique.mjs choisir --style <id> --atelier <atelier>, puis relancer avec --musique "<fichier>".');
	listerMusiques();
}

// La DA : relevée ou marque (--da), sinon la palette du style (--style), sinon la DA neutre du modèle.
if (daSource) {
	execFileSync(process.execPath, [join(SKILL, 'outils', 'da.mjs'), '--appliquer', daSource, atelier], {stdio: 'inherit'});
} else if (style) {
	const catalogue = JSON.parse(readFileSync(join(atelier, 'src', 'styles', 'catalogue.json'), 'utf-8'));
	const choisi = catalogue.find((x) => x.id === style);
	if (!choisi) throw new Error(`Style inconnu : ${style}. Styles : ${catalogue.map((x) => x.id).join(', ')}`);
	writeFileSync(join(atelier, 'da.json'), JSON.stringify(choisi.da, null, '\t') + '\n');
	console.log(`DA : la palette du style « ${choisi.nom} ».`);
} else if (neuf) {
	console.log('DA : la DA neutre du modèle, à remplacer (references/da.md, outils/da.mjs).');
}
console.log(`Atelier : ${atelier}`);
console.log(`Studio  : npx remotion studio --port=3073 (dans l'atelier)`);
