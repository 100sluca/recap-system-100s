// Crée l'atelier d'une vidéo : une copie du modèle Remotion, les bruitages, l'installation des
// paquets, la DA, puis (quand elle est choisie) la musique et son tempo, et le journal du bilan.
//
//   node nouveau.mjs --projet <nom> --version <N> [--da <dossier|marque>] [--style <id>] [--musique "<fichier>"] [--muet]
//                    [--recette <…-recette.md>]
//
// En deux temps, dans l'ordre du circuit (SKILL.md) :
// 1. à la création, la DA : --da installe une DA relevée (dossier de da.mjs) ou une marque rangée
//    (outils/da.mjs --appliquer) ; sinon --style installe la palette propre d'un style ; sinon la DA
//    neutre du modèle, à remplacer (references/da.md). Sans --musique, l'atelier est créé muet et
//    l'outil liste les morceaux de la banque-son, avec ceux que les derniers films ont déjà pris ;
// 2. une fois le style choisi, la même commande avec --musique (un fichier, ou un nom de la
//    banque-son) pose la musique dans l'atelier existant et mesure son tempo et sa sonie.
// Jamais la même musique d'un film à l'autre : outils/musique.mjs propose des morceaux qui vont avec
// le style et qu'aucun des derniers films n'a pris ; chaque musique posée y est notée.
// --muet : un film sans son, assumé (105 temps par minute).
// --recette : repart des choix d'un film livré (son <projet>-vN-recette.md, écrit par livrer.mjs) :
//    sa DA (sauf --da ou --style), sa musique (sauf --musique) et ses niveaux. Le style et la voix
//    sont rappelés ; l'histoire, le pitch et les captures, jamais repris.
//
// Les bruitages : ceux que <banque-son>/bruitages.json nomme, à plat ({"clic.wav": "sound-effects/…"})
// ou par famille ({"clic": {"clic.wav": "…", "clic-bouton.mp3": "…"}, "swoosh": {…}}). Chacun est
// mesuré (outils/sonie.mjs) : Effet les ramène tous au même niveau, et la palette par famille est
// écrite dans public/son/sons.json. Sans banque-son, le film n'a pas de bruitages ; le modèle se tait
// là où il en attendait.
// La musique est mesurée aussi (MUSIQUE_LUFS) : Musique la ramène aux NIVEAUX de reglages.ts, dont
// l'écart sous la voix vient du réglage musiqueSousVoix (18 dB par défaut).
// Réglages (banqueSon, musique, ateliers, musiqueSousVoix) : node ../../recap-system-100s/reglages.mjs
//
// L'atelier est hors des dépôts (ses node_modules pèsent 300 Mo) : <ateliers>/<nom>-v<N>/, par
// défaut ~/recap-film/. Sous Windows, ni sous Documents (l'accès contrôlé aux dossiers y bloque le
// ffmpeg de Remotion) ni sous %LOCALAPPDATA% (l'application Claude y redirige ses écritures vers un
// dossier privé, invisible depuis l'Explorateur).
import {execFileSync, execSync} from 'node:child_process';
import {appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename, dirname, extname, join, resolve} from 'node:path';
import {lireReglages} from '../../recap-system-100s/reglages.mjs';
import {mesurer} from './sonie.mjs';

const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
const projet = arg('projet');
const version = arg('version') ?? '1';
const muet = process.argv.includes('--muet');
const style = arg('style');
const daSource = arg('da');
if (!projet) throw new Error('Usage : node nouveau.mjs --projet <nom> --version <N> [--da <dossier|marque>] [--style <id>] [--musique "<fichier>"] [--muet] [--recette <recette.md>]');

const SKILL = join(import.meta.dirname, '..');
const reglages = lireReglages();
const BANQUE = reglages.banqueSon && existsSync(reglages.banqueSon) ? reglages.banqueSon : null;
const RACINE = reglages.ateliers || join(homedir(), 'recap-film');
const atelier = join(RACINE, `${projet}-v${version}`);
const lireJson = (f) => JSON.parse(readFileSync(f, 'utf-8').replace(/^﻿/, ''));

// Les niveaux de base du mix (LUFS, le film joué en stéréo). La voix off est à −17 LUFS en mono
// (outils/voix.mjs), soit −14 dans le film. La musique passe `musiqueSousVoix` dB sous elle pendant
// les phrases : 18 par défaut (Gamaths v3 à 10 dB : la musique couvrait la voix ; v4 à 13 dB : mieux).
const ECART = Number(reglages.musiqueSousVoix) || 18;
const NIVEAUX_BASE = {musique: -16, entreVoix: -20, sousVoix: -14 - ECART, bruitage: -14};

// La recette d'un film livré : le bloc ```json recette``` de son -recette.md.
let recette = null;
let sourceRecette = null;
if (arg('recette')) {
	const fichier = resolve(arg('recette'));
	const bloc = readFileSync(fichier, 'utf-8').match(/```json recette\s*\n([\s\S]*?)\n```/);
	if (!bloc) throw new Error(`Pas de bloc « json recette » dans ${fichier} (écrit par livrer.mjs).`);
	recette = JSON.parse(bloc[1]);
	sourceRecette = recette.source ? resolve(dirname(fichier), recette.source) : null;
	if (sourceRecette && !existsSync(sourceRecette)) sourceRecette = null;
}

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

// Les bruitages nommés par bruitages.json, à plat ou par famille : [{nom, chemin, famille}].
function carteBruitages() {
	const carte = BANQUE && join(BANQUE, 'bruitages.json');
	if (!carte || !existsSync(carte)) return [];
	const liste = [];
	for (const [cle, valeur] of Object.entries(lireJson(carte))) {
		if (typeof valeur === 'string') liste.push({nom: cle, chemin: valeur, famille: cle.replace(/\.[^.]+$/, '').split('-')[0]});
		else for (const [nom, chemin] of Object.entries(valeur)) liste.push({nom, chemin, famille: cle});
	}
	return liste;
}

// Ce que reglages.ts contient déjà (pour ne réécrire que ce qui change).
function reglagesActuels() {
	const f = join(atelier, 'src', 'reglages.ts');
	const t = existsSync(f) ? readFileSync(f, 'utf-8') : '';
	const nombre = (nom, defaut) => Number(t.match(new RegExp(`${nom} = (-?[\\d.]+)`))?.[1] ?? defaut);
	return {
		nomMusique: t.match(/MUSIQUE = 'son\/([^']*)'/)?.[1] ?? '',
		origine: t.match(/\/\/ Musique : (.+?) ; /)?.[1] ?? '',
		bpm: nombre('BPM', 105),
		premier: nombre('PREMIER_TEMPS', 0),
		lufs: nombre('MUSIQUE_LUFS', -14),
		nbTemps: nombre('NB_TEMPS', 16),
		niveaux: (() => {
			try {
				return JSON.parse(t.match(/NIVEAUX = (\{.*\});/)[1].replace(/(\w+):/g, '"$1":'));
			} catch {
				return null;
			}
		})(),
	};
}

// Les réglages de la vidéo (reglages.ts) : la musique, son tempo, sa sonie, la durée, les niveaux,
// les bruitages. Un atelier d'avant les niveaux (Son.tsx sans NIVEAUX) garde l'ancien format.
function ecrireReglages({nomMusique, origine, bpm, premier, lufs, nbTemps, niveaux}) {
	const sons = existsSync(join(atelier, 'public', 'son', 'sons.json')) ? lireJson(join(atelier, 'public', 'son', 'sons.json')) : {};
	const ancien = atelierAncien();
	const n = niveaux ?? NIVEAUX_BASE;
	// Un atelier d'avant : sa liste de bruitages telle qu'elle était.
	const listeAncienne = readFileSync(join(atelier, 'src', 'reglages.ts'), 'utf-8').match(/SONS: readonly string\[\] = (\[.*\]);/)?.[1];
	writeFileSync(
		join(atelier, 'src', 'reglages.ts'),
		[
			`// Réglages propres à cette vidéo (${projet} v${version}), écrits par outils/nouveau.mjs.`,
			origine ? `// Musique : ${origine} ; tempo mesuré par outils/tempo.mjs, sonie par outils/sonie.mjs.` : muet ? '// Film muet : pas de musique, 105 temps par minute.' : '// Musique pas encore choisie (nouveau.mjs --musique, une fois le style choisi).',
			`export const MUSIQUE = '${nomMusique ? `son/${nomMusique}` : ''}';`,
			`export const BPM = ${bpm};`,
			`export const PREMIER_TEMPS = ${premier}; // en secondes`,
			...(ancien ? [] : [`export const MUSIQUE_LUFS = ${lufs}; // sonie mesurée du morceau (ses deux premières minutes)`]),
			`export const NB_TEMPS = ${nbTemps}; // durée du film, en temps de musique`,
			...(ancien
				? [`export const SONS: readonly string[] = ${listeAncienne ?? JSON.stringify(Object.keys(sons))};`]
				: [
						'// Les niveaux du mix, en LUFS (le film joué en stéréo) ; la voix off est vers −14 dans le film.',
						'// musique : film sans voix off · entreVoix : film avec voix, quand on ne parle pas · sousVoix :',
						`// sous les phrases (${-14 - n.sousVoix} dB sous la voix) · bruitage : un Effet joué à volume 1.`,
						`export const NIVEAUX = {musique: ${n.musique}, entreVoix: ${n.entreVoix}, sousVoix: ${n.sousVoix}, bruitage: ${n.bruitage}};`,
						"// Les bruitages présents dans public/son/, avec leur crête de sonie en LUFS ; un Effet absent se",
						'// tait. La palette par famille, avec les durées : public/son/sons.json.',
						`export const SONS: Readonly<Record<string, number>> = ${JSON.stringify(Object.fromEntries(Object.entries(sons).map(([k, v]) => [k, v.crete])))};`,
					]),
			'',
		].join('\n'),
	);
}

const atelierAncien = () => !readFileSync(join(atelier, 'src', 'Son.tsx'), 'utf-8').includes('NIVEAUX');

// La palette des bruitages, par famille, pour choisir (et varier) au storyboard.
function montrerPalette() {
	const f = join(atelier, 'public', 'son', 'sons.json');
	if (!existsSync(f)) return console.log('Pas de bruitages (pas de bruitages.json dans la banque-son).');
	const familles = {};
	for (const [nom, s] of Object.entries(lireJson(f))) (familles[s.famille] ??= []).push(`${nom} (${String(s.duree).replace('.', ',')} s)`);
	console.log(`Bruitages, nivelés (Effet volume 1 = la voix) — en varier, et monter le ton des suites (<Suite />) :`);
	for (const [famille, noms] of Object.entries(familles)) console.log(`  ${famille.padEnd(12)} ${noms.join(' · ')}`);
}

const neuf = !existsSync(join(atelier, 'package.json'));
if (neuf) {
	cpSync(join(SKILL, 'modele'), atelier, {recursive: true});
	// Le journal du bilan : la première étape commence maintenant.
	appendFileSync(join(atelier, 'journal.jsonl'), JSON.stringify({etape: 'Préparation', t: new Date().toISOString()}) + '\n');
	mkdirSync(join(atelier, 'public', 'son'), {recursive: true});
	mkdirSync(join(atelier, 'public', 'captures'), {recursive: true});

	// Les bruitages de la banque, s'il y en a une.
	const bruitages = [];
	for (const b of carteBruitages()) {
		const source = join(BANQUE, b.chemin);
		if (existsSync(source)) {
			copyFileSync(source, join(atelier, 'public', 'son', b.nom));
			bruitages.push(b);
		} else console.warn(`Bruitage absent de la banque : ${b.chemin}`);
	}
	ecrireReglages({...reglagesActuels(), nomMusique: '', origine: '', bpm: 105, premier: 0, nbTemps: 16, niveaux: recette?.niveaux});

	console.log('Installation des paquets (environ une minute)…');
	execSync('npm install --no-audit --no-fund --loglevel=error', {cwd: atelier, stdio: 'inherit'});

	// Les bruitages mesurés avec le ffmpeg que Remotion vient d'installer.
	if (bruitages.length) {
		const sons = {};
		for (const b of bruitages) {
			const m = mesurer(join(atelier, 'public', 'son', b.nom), atelier);
			sons[b.nom] = {famille: b.famille, crete: m.creteSonie, duree: m.duree};
		}
		writeFileSync(join(atelier, 'public', 'son', 'sons.json'), JSON.stringify(sons, null, '\t') + '\n');
		ecrireReglages({...reglagesActuels(), niveaux: recette?.niveaux});
	}
	montrerPalette();
} else {
	console.log(`L'atelier existe déjà : ${atelier}`);
}

// La musique : posée maintenant si elle est donnée (à la création ou plus tard), ou reprise de la
// recette, sinon listée.
const deLaRecette = !arg('musique') && neuf && !muet && recette?.musique ? trouverMusique(recette.musique) : null;
if (recette?.musique && !arg('musique') && neuf && !muet && !deLaRecette) console.warn(`La musique de la recette n'est pas dans la banque-son : ${recette.musique}. En choisir une autre (--musique).`);
const demandee = arg('musique') ?? deLaRecette;
if (demandee) {
	const musique = trouverMusique(demandee);
	if (!musique) {
		console.error(`Musique introuvable : ${demandee}`);
		listerMusiques();
		process.exit(1);
	}
	const nomMusique = `musique${extname(musique)}`;
	copyFileSync(musique, join(atelier, 'public', 'son', nomMusique));
	const sortie = execFileSync(process.execPath, [join(SKILL, 'outils', 'tempo.mjs'), musique, '--atelier', atelier], {encoding: 'utf-8'});
	console.log(sortie.trim().split('\n')[0]);
	const m = sortie.match(/BPM=([\d.]+) PREMIER_TEMPS=([\d.]+)/);
	const premier = m ? Number(m[2]) : 0;
	// La sonie de ce que le film en jouera : deux minutes depuis le premier temps.
	const lufs = mesurer(musique, atelier, {debut: premier, duree: 120}).integree;
	const avant = reglagesActuels();
	ecrireReglages({...avant, nomMusique, origine: basename(musique), bpm: m ? Number(m[1]) : 105, premier, lufs});
	const n = avant.niveaux ?? NIVEAUX_BASE;
	if (!atelierAncien()) console.log(`Sonie : ${lufs} LUFS → ramenée à ${n.musique} sans voix off, ${n.entreVoix} entre les phrases et ${n.sousVoix} sous la voix (${-14 - n.sousVoix} dB sous elle).`);
	// L'historique des musiques, pour varier d'un film à l'autre.
	execFileSync(process.execPath, [join(SKILL, 'outils', 'musique.mjs'), 'noter', projet, version, basename(musique)], {stdio: 'inherit'});
} else if (neuf && !muet) {
	console.log('Musique : pas encore choisie. Une fois le style choisi : node OUTILS/musique.mjs choisir --style <id> --atelier <atelier>, puis relancer avec --musique "<fichier>".');
	listerMusiques();
}

// La DA : relevée ou marque (--da), sinon la palette du style (--style), sinon celle de la recette,
// sinon la DA neutre du modèle.
if (daSource) {
	execFileSync(process.execPath, [join(SKILL, 'outils', 'da.mjs'), '--appliquer', daSource, atelier], {stdio: 'inherit'});
} else if (style) {
	const catalogue = lireJson(join(atelier, 'src', 'styles', 'catalogue.json'));
	const choisi = catalogue.find((x) => x.id === style);
	if (!choisi) throw new Error(`Style inconnu : ${style}. Styles : ${catalogue.map((x) => x.id).join(', ')}`);
	writeFileSync(join(atelier, 'da.json'), JSON.stringify(choisi.da, null, '\t') + '\n');
	console.log(`DA : la palette du style « ${choisi.nom} ».`);
} else if (neuf && sourceRecette && existsSync(join(sourceRecette, 'da.json'))) {
	// La DA du film d'origine, avec ses polices, son logo et ses fichiers de marque.
	copyFileSync(join(sourceRecette, 'da.json'), join(atelier, 'da.json'));
	const registre = join(atelier, 'public', 'fonts', 'polices.json');
	const polices = lireJson(registre);
	const leur = join(sourceRecette, 'public', 'fonts', 'polices.json');
	if (existsSync(leur)) {
		for (const p of lireJson(leur)) {
			if (existsSync(join(sourceRecette, 'public', 'fonts', p.fichier))) copyFileSync(join(sourceRecette, 'public', 'fonts', p.fichier), join(atelier, 'public', 'fonts', p.fichier));
			if (!polices.some((q) => q.fichier === p.fichier)) polices.push(p);
		}
		writeFileSync(registre, JSON.stringify(polices, null, '\t') + '\n');
	}
	for (const d of [['public', 'marque'], ['src', 'marque']]) {
		if (existsSync(join(sourceRecette, ...d))) cpSync(join(sourceRecette, ...d), join(atelier, ...d), {recursive: true});
	}
	console.log(`DA : celle de la recette (${lireJson(join(atelier, 'da.json')).nom}).`);
} else if (neuf) {
	console.log('DA : la DA neutre du modèle, à remplacer (references/da.md, outils/da.mjs).');
}

if (recette) {
	console.log('Recette reprise :');
	if (recette.style) console.log(`  style : ${recette.style} (lire styles/${recette.style}.md ; pas d'aperçus à refaire)`);
	if (recette.voix?.mode === 'ia') console.log(`  voix : IA, ${recette.voix.nom} → node OUTILS/voix.mjs ia <atelier> --voix ${recette.voix.nom}`);
	else if (recette.voix?.mode === 'doublage') console.log("  voix : celle de l'utilisateur, en doublage (voix.mjs prevoir, puis doublage.mjs)");
	else if (recette.voix) console.log('  voix : aucune (film musical)');
	if (recette.duree) console.log(`  durée du film d'origine : ${recette.duree} s`);
	console.log("  à refaire pour ce film : l'histoire (STORYBOARD.md), le pitch, les captures.");
}
console.log(`Atelier : ${atelier}`);
console.log(`Studio  : npx remotion studio --port=3073 (dans l'atelier)`);
