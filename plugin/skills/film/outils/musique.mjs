// La musique des films, variée d'un film à l'autre. Un historique durable (les ateliers, eux, sont
// supprimés après livraison) et une proposition pour chaque film : des morceaux de la banque-son
// dont le tempo va avec le style choisi, jamais ceux des derniers films, tirés au sort parmi les
// meilleurs pour ne pas toujours tomber sur le même.
//
//   node musique.mjs choisir --style <id> [--atelier <atelier>]   classe les morceaux, en propose trois
//   node musique.mjs noter <projet> <version> <morceau>            ajoute un film à l'historique
//   node musique.mjs historique                                    montre l'historique
//
// Rangé dans ~/.claude/recap-system-100s/musiques.json : {tempos: {morceau: bpm}, films: [{projet,
// version, morceau, date}]}. Les tempos sont mesurés une fois (outils/tempo.mjs, avec le ffmpeg de
// l'atelier) puis gardés. nouveau.mjs note chaque musique posée.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename, join} from 'node:path';
import {lireReglages} from '../../recap-system-100s/reglages.mjs';

const SKILL = join(import.meta.dirname, '..');
const DOSSIER = join(homedir(), '.claude', 'recap-system-100s');
const FICHIER = join(DOSSIER, 'musiques.json');
const reglages = lireReglages();
const BANQUE = reglages.banqueSon && existsSync(join(reglages.banqueSon, 'musique')) ? join(reglages.banqueSon, 'musique') : null;
const RACINE = reglages.ateliers || join(homedir(), 'recap-film');
const args = process.argv.slice(2);
const arg = (nom) => {
	const i = args.indexOf(`--${nom}`);
	return i >= 0 ? args[i + 1] : undefined;
};

const lire = () => {
	try {
		return JSON.parse(readFileSync(FICHIER, 'utf-8').replace(/^﻿/, ''));
	} catch {
		// Premier passage : l'historique part des ateliers encore présents (commentaire de reglages.ts).
		const films = [];
		if (existsSync(RACINE))
			for (const a of readdirSync(RACINE)) {
				const r = join(RACINE, a, 'src', 'reglages.ts');
				const m = existsSync(r) && readFileSync(r, 'utf-8').match(/Musique : ([^;(]+?\.(?:mp3|wav|m4a|ogg|flac))/i);
				const v = a.match(/^(.*)-v(\d+)$/);
				if (m && v && !/(^|-)(dev|test|essai)(-|$)/.test(v[1])) films.push({projet: v[1], version: Number(v[2]), morceau: m[1].trim(), date: null});
			}
		return {tempos: {}, films};
	}
};
const ecrire = (d) => {
	mkdirSync(DOSSIER, {recursive: true});
	writeFileSync(FICHIER, JSON.stringify(d, null, '\t') + '\n');
};

const commande = args[0];
const donnees = lire();

if (commande === 'noter') {
	const [, projet, version, morceau] = args;
	if (!projet || !morceau) throw new Error('Usage : node musique.mjs noter <projet> <version> <morceau>');
	donnees.films = donnees.films.filter((x) => !(x.projet === projet && String(x.version) === String(version)));
	donnees.films.push({projet, version: Number(version) || version, morceau: basename(morceau), date: new Date().toISOString().slice(0, 10)});
	ecrire(donnees);
	console.log(`Noté : ${projet} v${version} → ${basename(morceau)}`);
} else if (commande === 'historique') {
	ecrire(donnees);
	if (!donnees.films.length) console.log('Aucun film noté.');
	for (const x of donnees.films) console.log(`${String(x.date ?? '—').padEnd(10)}  ${x.projet} v${x.version}  ${x.morceau}`);
} else if (commande === 'choisir') {
	if (!BANQUE) throw new Error("Pas de banque-son réglée (réglage banqueSon) : demander à l'utilisateur un fichier audio dont il a les droits.");
	const style = arg('style');
	const catalogue = JSON.parse(readFileSync(join(SKILL, 'modele', 'src', 'styles', 'catalogue.json'), 'utf-8'));
	const s = style ? catalogue.find((x) => x.id === style) : null;
	if (style && !s) throw new Error(`Style inconnu : ${style}. Styles : ${catalogue.map((x) => x.id).join(', ')}`);
	const [mini, maxi] = (s?.tempo.match(/(\d+)\s*à\s*(\d+)/)?.slice(1).map(Number) ?? [90, 130]);
	const morceaux = readdirSync(BANQUE).filter((f) => /\.(mp3|wav|m4a|ogg|flac)$/i.test(f));
	// Les tempos manquants, mesurés une fois.
	const manquants = morceaux.filter((m) => !donnees.tempos[m]);
	if (manquants.length) console.log(`Mesure du tempo de ${manquants.length} morceau(x), une fois pour toutes…`);
	for (const m of manquants) {
		try {
			const sortie = execFileSync(process.execPath, [join(SKILL, 'outils', 'tempo.mjs'), join(BANQUE, m), ...(arg('atelier') ? ['--atelier', arg('atelier')] : [])], {encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore']});
			const bpm = Number(sortie.match(/BPM=([\d.]+)/)?.[1]);
			if (bpm) donnees.tempos[m] = Math.round(bpm * 10) / 10;
		} catch {
			/* pas de ffmpeg sous la main : on classera sans le tempo */
		}
	}
	ecrire(donnees);
	// Classement : écart au tempo du style (en comptant le double et la moitié), films récents.
	const recents = donnees.films.slice(-4).map((x) => x.morceau);
	const ecart = (bpm) => {
		if (!bpm) return 15;
		return Math.min(...[bpm, bpm * 2, bpm / 2].map((b) => (b < mini ? mini - b : b > maxi ? b - maxi : 0)));
	};
	const lignes = morceaux
		.map((m) => {
			const pris = donnees.films.filter((x) => x.morceau === m);
			const note = ecart(donnees.tempos[m]) + (recents.includes(m) ? 100 : 0) + pris.length * 6;
			return {m, bpm: donnees.tempos[m], pris, note};
		})
		.sort((a, b) => a.note - b.note);
	console.log(`Morceaux pour le style « ${s?.nom ?? 'sans style'} » (${mini} à ${maxi} temps/min), du plus adapté au moins adapté :`);
	for (const l of lignes)
		console.log(
			`  ${l.m.padEnd(30)} ${l.bpm ? `${String(l.bpm).padStart(5)} t/min` : '    ? t/min'}  ${l.pris.length ? `déjà pris : ${l.pris.map((x) => `${x.projet} v${x.version}`).join(', ')}` : 'jamais pris'}${recents.includes(l.m) ? '  ← récent, à éviter' : ''}`,
		);
	// Trois propositions tirées au sort parmi les bons candidats (pour varier).
	const bons = lignes.filter((l) => l.note <= lignes[0].note + 8).slice(0, 6);
	const tirage = [...bons].sort(() => Math.random() - 0.5).slice(0, 3);
	console.log(`\nPropositions : ${tirage.map((l) => l.m).join(' · ')}`);
	console.log('Les proposer à l\'utilisateur (ou prendre la première), puis : node OUTILS/nouveau.mjs --projet <nom> --version <N> --musique "<morceau>"');
} else {
	console.log('Commandes : choisir --style <id> [--atelier <atelier>] · noter <projet> <version> <morceau> · historique');
}
