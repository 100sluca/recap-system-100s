// La voix off d'un film : le pitch de l'atelier (PITCH.md) lu par une voix IA ou par
// l'utilisateur, et l'instant où commence chaque phrase, pour caler les plans dessus.
//
//   node voix.mjs echantillons <atelier> [--voix Achird,Charon,Sulafat,Kore] [--style "…"]
//       les deux premières phrases du pitch lues par chaque voix : public/voix/echantillons/<voix>.wav
//   node voix.mjs ia <atelier> [--voix Achird] [--style "…"] [--modele gemini-3.8-flash-tts] [--par-phrase] [--debut 1]
//       tout le pitch lu par une voix IA : public/voix/voix.wav + src/pitch.ts
//   node voix.mjs prevoir <atelier> [--debit 2.6] [--debut 2]
//       sa propre voix, en doublage : le minutage prévu (sans audio, rien ne sort de la machine),
//       pour faire le film d'abord ; puis outils/doublage.mjs pour s'enregistrer sur le film
//   node voix.mjs importer <atelier> <fichier audio> [--doublage --decalage <s>] [--debut 1]
//       un enregistrement de l'utilisateur (wav, mp3, m4a, webm…). Avec --doublage (appelé par
//       doublage.mjs) : la prise faite sur le film, recalée sur lui ; sinon une lecture libre.
//
// La voix IA : Gemini TTS (gemini-3.8-flash-tts, gratuit dans la limite du palier gratuit de
// l'API Gemini, plus de 130 langues dont le français). Voix par défaut : le réglage « voix »,
// sinon Achird. La clé : GEMINI_API_KEY ou GOOGLE_API_KEY dans l'environnement, sinon le fichier
// .env nommé par le réglage « envGemini ». Elle n'est jamais affichée ni écrite ailleurs.
//
// Le minutage :
// - voix IA en un seul appel : les fins de phrase sont cherchées dans les silences, là où les place
//   la longueur du texte (écart mesuré : 0,5 s au plus) ; avec --par-phrase, chaque phrase est lue
//   à part puis recollée, et le minutage est exact ;
// - doublage : chaque phrase est cherchée près de l'instant prévu (1,5 s autour), là où la voix
//   reprend après un silence ; les plans, calés sur p(i), suivent alors la vraie voix.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {lireReglages} from '../../recap-system-100s/reglages.mjs';
import {binaire, environnement} from './binaires.mjs';

const [mode, atelier, fichierAudio] = process.argv.slice(2);
const arg = (nom, def) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def;
};
const USAGE =
	'Usage : node voix.mjs echantillons|ia|prevoir|importer <atelier> [<fichier audio>] [--voix <nom>] [--style "…"] [--par-phrase] [--debut 1] [--doublage --decalage <s>]';
if (!['echantillons', 'ia', 'prevoir', 'importer'].includes(mode) || !atelier || !existsSync(atelier)) throw new Error(USAGE);

const MODELE = arg('modele', 'gemini-3.8-flash-tts');
const VOIX_DEFAUT = lireReglages().voix || 'Achird';
const STYLE = arg(
	'style',
	"voix off d'un pitch de projet, en français de France : posée, chaleureuse, confiante, rythme vif mais bien " +
		"articulé, une courte pause entre chaque phrase, un peu plus d'énergie sur la dernière phrase",
);
const DEBUT = Number(arg('debut', mode === 'prevoir' ? '2' : '1')); // secondes de film avant la première phrase
const dossierVoix = join(atelier, 'public', 'voix');
const dossierDoublage = join(atelier, 'doublage'); // hors de public/ : Remotion n'a pas à l'empaqueter

// ---------- le pitch : les phrases, une par ligne, sous des titres « ## »
function lirePitch() {
	const fichier = join(atelier, 'PITCH.md');
	if (!existsSync(fichier)) throw new Error(`Pas de pitch : écrire d'abord ${fichier} (voir references/pitch.md).`);
	const phrases = [];
	let partie = null;
	for (const ligne of readFileSync(fichier, 'utf8').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
		if (ligne.startsWith('## ')) partie = ligne.slice(3).trim();
		else if (partie && ligne.trim() && !/^\s*[#>|]/.test(ligne)) phrases.push({partie, texte: ligne.trim()});
	}
	if (!phrases.length) throw new Error(`${fichier} : aucune phrase sous un titre « ## ».`);
	return phrases;
}

// ---------- Gemini TTS
function cle() {
	if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
	const env = lireReglages().envGemini;
	if (env && existsSync(env)) {
		const m = readFileSync(env, 'utf8').match(/^\s*(?:GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*["']?([^"'\r\n]+)/m);
		if (m) return m[1].trim();
	}
	throw new Error(
		"Pas de clé Gemini : mettre GEMINI_API_KEY dans l'environnement, ou régler « envGemini » sur un fichier .env qui la contient " +
			'(node ../../recap-system-100s/reglages.mjs envGemini "<fichier .env>"). Une clé gratuite : https://aistudio.google.com/apikey',
	);
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/** Un texte lu par une voix : PCM 16 bits mono et sa fréquence. Réessaie sur 429/503. */
async function lire(texte, voix) {
	for (let essai = 1; ; essai++) {
		const rep = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
			method: 'POST',
			headers: {'x-goog-api-key': cle(), 'Content-Type': 'application/json'},
			body: JSON.stringify({
				model: MODELE,
				input: [{type: 'user_input', content: [{type: 'text', text: texte, annotations: [{type: 'speech_metadata', style: STYLE}]}]}],
				response_format: {type: 'audio'},
				generation_config: {speech_config: [{voice: voix}]},
			}),
		});
		const json = await rep.json().catch(() => ({}));
		if ((rep.status === 429 || rep.status >= 500) && essai < 4) {
			const delai = JSON.stringify(json).match(/"retryDelay":"(\d+(?:\.\d+)?)s"/);
			const s = delai ? Number(delai[1]) + 1 : 10 * essai;
			console.error(`  Gemini ${rep.status}, nouvel essai dans ${Math.round(s)} s`);
			await attendre(s * 1000);
			continue;
		}
		if (!rep.ok) throw new Error(`Gemini ${rep.status} : ${JSON.stringify(json).slice(0, 400)}`);
		const audio = (json.steps || [])
			.filter((s) => s.type === 'model_output')
			.flatMap((s) => s.content || [])
			.filter((c) => c.type === 'audio')
			.pop();
		if (!audio) throw new Error(`Gemini n'a pas rendu d'audio : ${JSON.stringify(json).slice(0, 400)}`);
		return lireWav(Buffer.from(audio.data, 'base64'), 24000);
	}
}

// ---------- WAV
function lireWav(buf, freqParDefaut) {
	if (buf.toString('ascii', 0, 4) !== 'RIFF') return {pcm: buf, freq: freqParDefaut};
	let freq = freqParDefaut;
	for (let o = 12; o + 8 <= buf.length; ) {
		const id = buf.toString('ascii', o, o + 4);
		const n = buf.readUInt32LE(o + 4);
		if (id === 'fmt ') freq = buf.readUInt32LE(o + 12);
		if (id === 'data') return {pcm: buf.subarray(o + 8, o + 8 + n), freq};
		o += 8 + n + (n % 2);
	}
	throw new Error('WAV sans données');
}

function ecrireWav(fichier, pcm, freq) {
	const e = Buffer.alloc(44);
	e.write('RIFF', 0);
	e.writeUInt32LE(36 + pcm.length, 4);
	e.write('WAVEfmt ', 8);
	e.writeUInt32LE(16, 16);
	e.writeUInt16LE(1, 20);
	e.writeUInt16LE(1, 22);
	e.writeUInt32LE(freq, 24);
	e.writeUInt32LE(freq * 2, 28);
	e.writeUInt16LE(2, 32);
	e.writeUInt16LE(16, 34);
	e.write('data', 36);
	e.writeUInt32LE(pcm.length, 40);
	writeFileSync(fichier, Buffer.concat([e, pcm]));
}

const silence = (s, freq) => Buffer.alloc(Math.round(s * freq) * 2);

// ---------- l'analyse : énergie par fenêtres de 20 ms
const PAS = 0.02;

function energie(pcm, freq) {
	const ech = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
	const fen = Math.round(freq * PAS);
	const rms = [];
	for (let i = 0; i + fen <= ech.length; i += fen) {
		let s = 0;
		for (let j = i; j < i + fen; j++) s += ech[j] * ech[j];
		rms.push(Math.sqrt(s / fen));
	}
	// Seuil : au-dessus du bruit de fond d'un micro (3 fois le 10e centile), et au moins 3 % du plus fort.
	// Le seuil bas sert à remonter jusqu'à l'attaque d'une phrase, souvent douce.
	const tri = [...rms].sort((a, b) => a - b);
	const fond = tri[Math.floor(tri.length * 0.1)];
	const crete = tri[tri.length - 1];
	return {rms, seuil: Math.max(fond * 3, crete * 0.03), bas: Math.max(fond * 1.6, crete * 0.008)};
}

/** Les silences : [début, fin) en fenêtres. */
function silencesDe({rms, seuil}) {
	const silences = [];
	let deb = -1;
	rms.forEach((v, k) => {
		if (v < seuil) deb = deb < 0 ? k : deb;
		else if (deb >= 0) silences.push([deb, k]), (deb = -1);
	});
	if (deb >= 0) silences.push([deb, rms.length]);
	return silences;
}

/** Les passages parlés, en secondes : les trous de moins de 0,25 s sont comblés, les bruits de moins de 0,12 s ignorés. */
function paroles(analyse) {
	const n = analyse.rms.length;
	const morceaux = [];
	let a = 0;
	for (const [s, e] of silencesDe(analyse)) {
		if (s > a) morceaux.push([a * PAS, s * PAS]);
		a = e;
	}
	if (a < n) morceaux.push([a * PAS, n * PAS]);
	const fondus = [];
	for (const m of morceaux) {
		const der = fondus[fondus.length - 1];
		if (der && m[0] - der[1] < 0.25) der[1] = m[1];
		else fondus.push([...m]);
	}
	// Chaque passage commence à son attaque : on recule tant que l'énergie reste au-dessus du seuil bas.
	return fondus
		.filter(([d, f]) => f - d >= 0.12)
		.map(([d, f], i, tous) => {
			let k = Math.round(d / PAS);
			const limite = i ? Math.round(tous[i - 1][1] / PAS) : 0;
			while (k > limite && analyse.rms[k - 1] > analyse.bas) k--;
			return [k * PAS, f];
		});
}

/** Une prise d'un seul tenant (voix IA, lecture libre) : le débit est à peu près constant, la fin de
 *  chaque phrase est cherchée dans le silence le plus proche de la position que lui donne sa part du
 *  texte, les plus longs d'abord. */
function minuter(pcm, freq, phrases) {
	const analyse = energie(pcm, freq);
	const n = analyse.rms.length;
	const silences = silencesDe(analyse);
	const debutParole = silences[0]?.[0] === 0 ? silences[0][1] * PAS : 0;
	const derSil = silences[silences.length - 1];
	const finParole = derSil?.[1] === n ? derSil[0] * PAS : n * PAS;
	const candidats = silences
		.filter(([a, b]) => a > 0 && b < n && (b - a) * PAS >= 0.12)
		.map(([a, b]) => ({a: a * PAS, b: b * PAS, long: (b - a) * PAS}));
	const total = phrases.reduce((s, p) => s + p.texte.length, 0);
	const coupes = [];
	let cumul = 0;
	let apres = debutParole;
	for (let i = 0; i < phrases.length - 1; i++) {
		cumul += phrases[i].texte.length;
		const attendu = debutParole + (finParole - debutParole) * (cumul / total);
		const choix = candidats
			.filter((c) => c.a > apres)
			.map((c) => ({...c, cout: Math.abs((c.a + c.b) / 2 - attendu) - 2 * c.long}))
			.sort((x, y) => x.cout - y.cout)[0];
		coupes.push(choix ? {fin: choix.a, debut: choix.b} : {fin: attendu, debut: attendu});
		apres = choix ? choix.b : attendu;
	}
	return phrases.map((p, i) => ({
		...p,
		debut: i === 0 ? debutParole : coupes[i - 1].debut,
		fin: i === phrases.length - 1 ? finParole : coupes[i].fin,
	}));
}

/** Une prise de doublage (déjà ramenée au temps du film) : chaque phrase commence au début de
 *  passage parlé le plus proche de l'instant prévu, à 1,5 s au plus, après la phrase d'avant. */
function caler(pcm, freq, prevu) {
	const morceaux = paroles(energie(pcm, freq));
	const debuts = [];
	for (const [i, p] of prevu.entries()) {
		const avant = i ? debuts[i - 1].t + 0.3 : -Infinity;
		const choix = morceaux
			.filter(([d]) => d >= avant && Math.abs(d - p.debut) <= 1.5)
			.sort((x, y) => Math.abs(x[0] - p.debut) - Math.abs(y[0] - p.debut))[0];
		debuts.push(choix ? {t: Math.max(0, choix[0] - 0.05), trouve: true} : {t: Math.max(avant, p.debut), trouve: false});
	}
	return prevu.map((p, i) => {
		const suivant = i + 1 < prevu.length ? debuts[i + 1].t : Infinity;
		const dedans = morceaux.filter(([d]) => d >= debuts[i].t - 0.05 && d < suivant);
		const fin = dedans.length ? Math.max(...dedans.map(([, f]) => f)) : p.fin - p.debut + debuts[i].t;
		return {partie: p.partie, texte: p.texte, debut: debuts[i].t, fin: Math.min(fin, suivant), prevu: p.debut, trouve: debuts[i].trouve};
	});
}

// ---------- sorties
const r2 = (x) => Math.round(x * 100) / 100;

function ecrirePitchTs(minutage, {voix, debutVoix, duree, source}) {
	const lignes = minutage.map(
		(p) => `\t{debut: ${r2(p.debut)}, fin: ${r2(p.fin)}, partie: ${JSON.stringify(p.partie)}, texte: ${JSON.stringify(p.texte)}},`,
	);
	writeFileSync(
		join(atelier, 'src', 'pitch.ts'),
		[
			`// La voix off, écrite par outils/voix.mjs le ${new Date().toLocaleString('fr-FR')} : ${source}.`,
			'// Les instants sont en secondes depuis le début de la voix ; le film la fait entrer à DEBUT_VOIX.',
			'// Pour changer le texte : corriger PITCH.md et relancer voix.mjs (jamais ce fichier à la main).',
			`export const VOIX = '${voix}';${voix ? '' : ' // pas encore de voix : minutage prévu, pour le doublage'}`,
			`export const DEBUT_VOIX = ${debutVoix}; // secondes de film avant le début de la voix`,
			`export const DUREE_VOIX = ${r2(duree)}; // secondes`,
			'export const PHRASES: readonly {debut: number; fin: number; partie: string; texte: string}[] = [',
			...lignes,
			'];',
			'',
		].join('\n'),
	);
}

function ecrireSorties(pcm, freq, minutage, source, debutVoix = DEBUT) {
	mkdirSync(dossierVoix, {recursive: true});
	ecrireWav(join(dossierVoix, 'voix.wav'), pcm, freq);
	const duree = pcm.length / 2 / freq;
	ecrirePitchTs(minutage, {voix: 'voix/voix.wav', debutVoix, duree, source});
	console.log(`Voix : public/voix/voix.wav · ${duree.toFixed(1)} s · ${minutage.length} phrases · ${source}`);
	for (const p of minutage) {
		const ecart = p.prevu === undefined ? '' : p.trouve ? `  (${p.debut - p.prevu >= 0 ? '+' : ''}${(p.debut - p.prevu).toFixed(1)} s)` : '  (pas trouvée : laissée au prévu)';
		console.log(`  ${(debutVoix + p.debut).toFixed(1).padStart(5)} → ${(debutVoix + p.fin).toFixed(1).padEnd(5)} ${p.texte.slice(0, 70)}${ecart}`);
	}
	console.log(`Film : au moins ${(debutVoix + duree + 2).toFixed(1)} s (voix + ${debutVoix} s avant + 2 s pour la fin).`);
}

/** Un fichier audio en WAV mono 48 kHz (ffmpeg de Remotion), ramené à −17 LUFS (avec la musique
 *  dessous, le film tombe vers −14), dont on retire les `decalage` premières secondes. */
function convertir(fichier, sortie, decalage = 0) {
	const ffmpeg = binaire(atelier);
	const avant = decalage > 0 ? ['-ss', String(decalage)] : [];
	const filtre = ['-af', `${decalage < 0 ? `adelay=${Math.round(-decalage * 1000)},` : ''}loudnorm=I=-17:TP=-1.5:LRA=11`];
	execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...avant, '-i', fichier, ...filtre, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', sortie], {
		env: environnement(ffmpeg),
	});
	return lireWav(readFileSync(sortie), 48000);
}

// ---------- les usages
if (mode === 'echantillons') {
	const phrases = lirePitch();
	const texte = arg('texte', phrases.slice(0, 2).map((p) => p.texte).join('\n'));
	const dossier = join(dossierVoix, 'echantillons');
	mkdirSync(dossier, {recursive: true});
	for (const voix of arg('voix', 'Achird,Charon,Sulafat,Kore').split(',')) {
		const {pcm, freq} = await lire(texte, voix.trim());
		ecrireWav(join(dossier, `${voix.trim()}.wav`), pcm, freq);
		console.log(`  ${voix.trim().padEnd(10)} ${(pcm.length / 2 / freq).toFixed(1)} s → ${join(dossier, `${voix.trim()}.wav`)}`);
	}
} else if (mode === 'ia') {
	const voix = arg('voix', VOIX_DEFAUT);
	const phrases = lirePitch();
	if (process.argv.includes('--par-phrase')) {
		// Chaque phrase à part, recollées avec une pause (plus longue entre deux parties).
		const morceaux = [];
		let t = 0;
		let freq = 24000;
		const minutage = [];
		for (const [i, p] of phrases.entries()) {
			const lu = await lire(p.texte, voix);
			freq = lu.freq;
			const pause = i === 0 ? 0 : phrases[i - 1].partie === p.partie ? 0.3 : 0.6;
			morceaux.push(silence(pause, freq));
			t += pause;
			const m = minuter(lu.pcm, freq, [p])[0];
			minutage.push({...p, debut: t + m.debut, fin: t + m.fin});
			morceaux.push(lu.pcm);
			t += lu.pcm.length / 2 / freq;
		}
		ecrireSorties(Buffer.concat(morceaux), freq, minutage, `Gemini ${MODELE}, voix ${voix}, phrase par phrase`);
	} else {
		const {pcm, freq} = await lire(phrases.map((p) => p.texte).join('\n'), voix);
		ecrireSorties(pcm, freq, minuter(pcm, freq, phrases), `Gemini ${MODELE}, voix ${voix}`);
	}
} else if (mode === 'prevoir') {
	// Le minutage d'une lecture posée : le débit (mots par seconde), une pause entre les phrases,
	// une plus longue entre les parties. Le film se fait sur ce minutage, puis l'utilisateur se
	// double dessus (doublage.mjs) et les plans se recalent sur sa vraie voix.
	const debit = Number(arg('debit', '2.6'));
	const phrases = lirePitch();
	let t = 0;
	const prevu = phrases.map((p, i) => {
		if (i) t += phrases[i - 1].partie === p.partie ? 0.5 : 0.9;
		const mots = p.texte.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
		const debut = t;
		t += Math.max(1.2, mots / debit);
		return {...p, debut, fin: t};
	});
	ecrirePitchTs(prevu, {voix: '', debutVoix: DEBUT, duree: t, source: `minutage prévu à ${debit} mots/s, pour le doublage`});
	mkdirSync(dossierDoublage, {recursive: true});
	writeFileSync(
		join(dossierDoublage, 'prevu.json'),
		JSON.stringify({debit, debutVoix: DEBUT, phrases: prevu.map((p) => ({...p, debut: r2(DEBUT + p.debut), fin: r2(DEBUT + p.fin)}))}, null, 2),
	);
	// Le film de doublage d'avant ne correspond plus à ce minutage.
	rmSync(join(dossierDoublage, 'video.mp4'), {force: true});
	console.log(`Minutage prévu : ${phrases.length} phrases, ${t.toFixed(1)} s de voix à ${debit} mots/s, à partir de ${DEBUT} s.`);
	for (const p of prevu) console.log(`  ${(DEBUT + p.debut).toFixed(1).padStart(5)} → ${(DEBUT + p.fin).toFixed(1).padEnd(5)} ${p.texte.slice(0, 70)}`);
	console.log(`Film : au moins ${(DEBUT + t + 2).toFixed(1)} s. Faire le film sur p(i), le rendre, puis : node doublage.mjs ${atelier}`);
} else {
	// Un enregistrement de l'utilisateur, converti en WAV mono 48 kHz à −17 LUFS.
	if (!fichierAudio || !existsSync(fichierAudio)) throw new Error(`Fichier audio introuvable : ${fichierAudio ?? '(aucun)'}\n${USAGE}`);
	mkdirSync(dossierVoix, {recursive: true});
	const nom = fichierAudio.split(/[\\/]/).pop();
	if (process.argv.includes('--doublage')) {
		// La prise faite sur le film : on retire ce qui précède l'image 0 du film, et la voix entre
		// alors à 0 ; chaque phrase est recalée près de son instant prévu.
		const prevu = JSON.parse(readFileSync(join(dossierDoublage, 'prevu.json'), 'utf8')).phrases;
		const {pcm, freq} = convertir(fichierAudio, join(dossierVoix, 'import.wav'), Number(arg('decalage', '0')));
		ecrireSorties(pcm, freq, caler(pcm, freq, prevu), `doublage de l'utilisateur (${nom})`, 0);
	} else {
		const {pcm, freq} = convertir(fichierAudio, join(dossierVoix, 'import.wav'));
		ecrireSorties(pcm, freq, minuter(pcm, freq, lirePitch()), `enregistrement de l'utilisateur (${nom})`);
	}
}
