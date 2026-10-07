// Bilan d'une vidéo : temps, appels au modèle, agents et jetons, lus dans les
// journaux de Claude Code (~/.claude/projects/<dossier>/<session>.jsonl et
// <session>/subagents/*.jsonl), découpés par les étapes notées pendant le travail.
//
//   node bilan.mjs etape <journal.jsonl> "<nom de l'étape>"   note le début d'une étape (maintenant)
//   node bilan.mjs etape <journal.jsonl> fin                   note la fin du travail
//   node bilan.mjs rendu <journal.jsonl> <secondes> <images>   note un rendu (rendre.mjs le fait seul)
//   node bilan.mjs calculer --journal <journal.jsonl> [--session <id>] [--md <bilan.md>] [--titre "…"]
//     sans --session : la session est retrouvée seule (celle dont le journal cite le plus le nom de l'atelier)
//   node bilan.mjs calculer --session <id> --depuis <ISO> --jusqua <ISO> [--md …]   sans journal
//
// Aucune dépendance. Les heures sont en UTC dans les journaux, affichées en heure de Paris.
import {appendFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {basename, dirname, join} from 'node:path';

const [, , commande, ...reste] = process.argv;
const option = (nom) => {
	const i = reste.indexOf(`--${nom}`);
	return i >= 0 ? reste[i + 1] : undefined;
};

if (commande === 'etape') {
	const [journal, nom] = reste;
	appendFileSync(journal, JSON.stringify({etape: nom, t: new Date().toISOString()}) + '\n');
	console.log(`étape notée : ${nom}`);
	process.exitCode = 0;
} else if (commande === 'rendu') {
	const [journal, secondes, images] = reste;
	appendFileSync(
		journal,
		JSON.stringify({rendu: Number(secondes), images: Number(images), t: new Date().toISOString()}) + '\n',
	);
} else if (commande === 'calculer') {
	calculer();
} else {
	console.log('Commandes : etape, rendu, calculer (voir l’en-tête du fichier).');
}

// La session qui a fait la vidéo : parmi les journaux modifiés depuis le début du travail,
// celui qui cite le plus souvent l'indice (le nom du dossier de l'atelier).
function sessionAuto(indice, depuis) {
	const racine = join(homedir(), '.claude', 'projects');
	let meilleure = null;
	for (const dossier of readdirSync(racine)) {
		const d = join(racine, dossier);
		if (!statSync(d).isDirectory()) continue;
		for (const f of readdirSync(d).filter((x) => x.endsWith('.jsonl'))) {
			const chemin = join(d, f);
			if (statSync(chemin).mtimeMs < depuis) continue;
			const n = readFileSync(chemin, 'utf-8').split(indice).length - 1;
			if (n > 0 && (!meilleure || n > meilleure.n)) meilleure = {n, id: f.replace(/\.jsonl$/, '')};
		}
	}
	if (!meilleure) throw new Error(`Aucune session ne cite « ${indice} » : passer --session <id>`);
	return meilleure.id;
}

function trouverSession(id) {
	const racine = join(homedir(), '.claude', 'projects');
	for (const dossier of readdirSync(racine)) {
		const f = join(racine, dossier, `${id}.jsonl`);
		if (existsSync(f)) return {principal: f, dossier: join(racine, dossier, id)};
	}
	throw new Error(`Session introuvable : ${id}`);
}

// Un appel au modèle peut s'étaler sur plusieurs lignes (une par bloc) : on garde
// la dernière ligne de chaque requestId, qui porte l'usage final.
function lireAppels(fichier, agent) {
	const appels = new Map();
	for (const ligne of readFileSync(fichier, 'utf-8').split('\n')) {
		if (!ligne.trim()) continue;
		let d;
		try {
			d = JSON.parse(ligne);
		} catch {
			continue;
		}
		if (d.type !== 'assistant' || !d.message?.usage) continue;
		const cle = d.requestId ?? d.message.id ?? d.uuid;
		appels.set(cle, {t: Date.parse(d.timestamp), u: d.message.usage, agent, modele: d.message.model});
	}
	return [...appels.values()];
}

function calculer() {
	const journalChemin = option('journal');
	let id = option('session');
	if (!id) {
		const premiere = JSON.parse(readFileSync(journalChemin, 'utf-8').split('\n')[0]).t;
		id = sessionAuto(option('indice') ?? basename(dirname(journalChemin)), Date.parse(premiere));
	}
	const {principal, dossier} = trouverSession(id);
	let appels = lireAppels(principal, null);
	const sous = join(dossier, 'subagents');
	const noms = {};
	if (existsSync(sous)) {
		for (const f of readdirSync(sous).filter((x) => x.endsWith('.jsonl'))) {
			const id = f.replace(/\.jsonl$/, '');
			const meta = join(sous, `${id}.meta.json`);
			noms[id] = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf-8')).description ?? id : id;
			appels = appels.concat(lireAppels(join(sous, f), id));
		}
	}

	// Les étapes : du journal, ou une seule fenêtre --depuis/--jusqua.
	let etapes = [];
	let rendus = [];
	const journal = option('journal');
	if (journal) {
		const lignes = readFileSync(journal, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
		const marques = lignes.filter((l) => l.etape);
		rendus = lignes.filter((l) => l.rendu !== undefined);
		for (let i = 0; i < marques.length; i++) {
			if (marques[i].etape === 'fin') continue;
			const fin = marques[i + 1]?.t ?? option('jusqua') ?? new Date().toISOString();
			etapes.push({nom: marques[i].etape, debut: Date.parse(marques[i].t), fin: Date.parse(fin)});
		}
	} else {
		etapes = [
			{
				nom: option('titre') ?? 'Travail',
				debut: Date.parse(option('depuis')),
				fin: Date.parse(option('jusqua') ?? new Date().toISOString()),
			},
		];
	}

	const somme = (liste) => {
		const s = {appels: liste.length, entree: 0, ecrit: 0, lu: 0, sortie: 0, agents: new Set()};
		for (const a of liste) {
			s.entree += a.u.input_tokens ?? 0;
			s.ecrit += a.u.cache_creation_input_tokens ?? 0;
			s.lu += a.u.cache_read_input_tokens ?? 0;
			s.sortie += a.u.output_tokens ?? 0;
			if (a.agent) s.agents.add(a.agent);
		}
		s.total = s.entree + s.ecrit + s.lu + s.sortie;
		return s;
	};
	// Temps actif : on ne compte pas les silences de plus de 5 min (attente d'une réponse de l'utilisateur).
	const actif = (liste, debut, fin) => {
		const t = [debut, ...liste.map((a) => a.t).sort((a, b) => a - b), fin];
		let s = 0;
		for (let i = 1; i < t.length; i++) s += Math.min(t[i] - t[i - 1], 5 * 60e3);
		return s;
	};

	const nb = (n) => n.toLocaleString('fr-FR');
	const mn = (ms) => {
		const m = Math.round(ms / 60e3);
		return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
	};
	const heure = (t) =>
		new Date(t).toLocaleString('fr-FR', {timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short'});

	const lignes = [];
	const tout = [];
	for (const e of etapes) {
		const dedans = appels.filter((a) => a.t >= e.debut && a.t < e.fin);
		tout.push(...dedans);
		const s = somme(dedans);
		lignes.push(
			`| ${e.nom} | ${mn(e.fin - e.debut)} | ${mn(actif(dedans, e.debut, e.fin))} | ${s.appels} | ${s.agents.size || '—'} | ${nb(s.sortie)} | ${nb(s.total)} |`,
		);
	}
	const debut = Math.min(...etapes.map((e) => e.debut));
	const fin = Math.max(...etapes.map((e) => e.fin));
	const s = somme(tout);
	const modeles = [...new Set(tout.map((a) => a.modele).filter(Boolean))].join(', ');
	const tempsRendu = rendus.reduce((x, r) => x + r.rendu, 0);

	const md = [
		`# Bilan${option('titre') ? ` : ${option('titre')}` : ''}`,
		'',
		`Du ${heure(debut)} au ${heure(fin)} (heure de Paris). Modèle : ${modeles || '—'}.`,
		'',
		'| Étape | Durée | Temps actif | Appels au modèle | Agents | Jetons écrits | Jetons traités |',
		'|---|--:|--:|--:|--:|--:|--:|',
		...lignes,
		`| **Total** | **${mn(fin - debut)}** | **${mn(actif(tout, debut, fin))}** | **${s.appels}** | **${s.agents.size || '—'}** | **${nb(s.sortie)}** | **${nb(s.total)}** |`,
		'',
		`- **Rendus** : ${rendus.length ? `${rendus.length} rendu(s), ${Math.round(tempsRendu)} s au total (${rendus.map((r) => `${Math.round(r.rendu)} s pour ${r.images} images`).join(' ; ')})` : 'non notés'}.`,
		`- **Agents** : ${s.agents.size ? [...s.agents].map((a) => noms[a]).join(' ; ') : 'aucun, un seul Claude a tout fait'}.`,
		`- **Jetons traités** = ${nb(s.lu)} relus en cache + ${nb(s.ecrit)} mis en cache + ${nb(s.entree)} nouveaux + ${nb(s.sortie)} écrits par le modèle.`,
		'  À chaque appel, le modèle relit toute la conversation : c\'est pourquoi les jetons relus dominent ; ils coûtent environ dix fois moins cher que les autres.',
		'- **Temps actif** : durée sans les silences de plus de 5 min (attente d\'une réponse de l\'utilisateur).',
		'',
	].join('\n');

	console.log(md);
	if (option('md')) writeFileSync(option('md'), md);
}
