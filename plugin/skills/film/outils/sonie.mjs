// La sonie (le volume perçu, en LUFS) d'un son ou d'un film, mesurée en Node selon la norme
// UIT-R BS.1770 : pondération K, blocs de 400 ms tous les 100 ms, portes à −70 LUFS et −10 LU.
// Le son est décodé par le ffmpeg de Remotion (en WAV 16 bits : il n'a ni ebur128 ni flux brut).
//
//   node sonie.mjs mesurer <fichier> [--atelier <atelier>]   sonie intégrée, crête de sonie, crête, durée
//   node sonie.mjs <atelier> [film.mp4]                       contrôle du mix d'un film rendu
//
// Tout se mesure tel que le film le joue : un son mono passe à l'identique sur les deux canaux
// (comme le fait Remotion), il compte donc 3 dB de plus que mesuré seul.
//
// Le contrôle du mix (lancé par rendre.mjs après chaque film) : la sonie du film (viser −16 à
// −14 LUFS), sa crête, et s'il y a une voix off, l'écart entre la voix et ce qui joue dessous
// (musique + bruitages). Pour l'avoir, la voix est retirée du film (même fichier, recalé à
// l'échantillon près) : il reste la musique et les bruitages, mesurés aux mêmes instants que la voix.
// Repères : 18 dB d'écart en médiane (les niveaux de base de Son.tsx), 15 au moins ; jamais moins de
// 9 dB, même sous un bruitage. Gamaths v3 (12/10/2026), jugée trop forte : 9,8 dB en médiane.
import {execFileSync} from 'node:child_process';
import {appendFileSync, existsSync, readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {binaire, environnement} from './binaires.mjs';

export const FREQ = 48000;
const BLOC = 0.4 * FREQ; // 400 ms
const PAS = 0.1 * FREQ; // 100 ms

/** Les canaux d'un fichier audio (ou de la piste son d'une vidéo), à 48 kHz, en flottants ;
 *  `debut` et `duree` (secondes) pour n'en prendre qu'un morceau. */
export function decoder(fichier, atelier, {debut, duree} = {}) {
	const ffmpeg = binaire(atelier);
	const wav = execFileSync(
		ffmpeg,
		['-v', 'error', ...(debut ? ['-ss', String(debut)] : []), '-i', fichier, ...(duree ? ['-t', String(duree)] : []), '-vn', '-map_metadata', '-1', '-fflags', '+bitexact', '-ar', String(FREQ), '-c:a', 'pcm_s16le', '-f', 'wav', '-'],
		{maxBuffer: 1024 * 1024 * 1024, env: environnement(ffmpeg)},
	);
	const nbCanaux = wav.readUInt16LE(22);
	const donnees = wav.indexOf('data', 12) + 8;
	const n = Math.floor((wav.length - donnees) / 2 / nbCanaux);
	const canaux = Array.from({length: nbCanaux}, () => new Float32Array(n));
	for (let k = 0; k < n; k++) for (let c = 0; c < nbCanaux; c++) canaux[c][k] = wav.readInt16LE(donnees + 2 * (k * nbCanaux + c)) / 32768;
	return canaux;
}

/** Tel que joué dans le film : un mono passe sur les deux canaux, au même niveau. */
export const stereo = (canaux) => (canaux.length === 1 ? [canaux[0], canaux[0]] : canaux.slice(0, 2));

/** La pondération K (deux filtres du second ordre, coefficients de la norme à 48 kHz). */
function ponderer(x) {
	const etages = [
		[1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585],
		[1, -2, 1, -1.99004745483398, 0.99007225036621],
	];
	let entree = x;
	for (const [b0, b1, b2, a1, a2] of etages) {
		const y = new Float32Array(entree.length);
		let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
		for (let k = 0; k < entree.length; k++) {
			const v = b0 * entree[k] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
			x2 = x1; x1 = entree[k]; y2 = y1; y1 = v;
			y[k] = v;
		}
		entree = y;
	}
	return entree;
}

const lufs = (puissance) => (puissance > 0 ? -0.691 + 10 * Math.log10(puissance) : -Infinity);

/** La puissance pondérée de chaque bloc de 400 ms, tous les 100 ms (somme des canaux). */
export function blocs(canaux, bloc = BLOC) {
	const ponderes = canaux.map(ponderer);
	const n = ponderes[0].length;
	const cumul = ponderes.map((y) => {
		const c = new Float64Array(n + 1);
		for (let k = 0; k < n; k++) c[k + 1] = c[k] + y[k] * y[k];
		return c;
	});
	const sortie = [];
	for (let debut = 0; debut + bloc <= n; debut += PAS) {
		let p = 0;
		for (const c of cumul) p += (c[debut + bloc] - c[debut]) / bloc;
		sortie.push(p);
	}
	// Un son plus court qu'un bloc : un seul bloc, sur sa durée.
	if (!sortie.length && n) sortie.push(cumul.reduce((s, c) => s + c[n] / n, 0));
	return sortie;
}

/** La sonie intégrée (portes absolue et relative de la norme). */
export function integree(puissances) {
	const absolus = puissances.filter((p) => lufs(p) > -70);
	if (!absolus.length) return -Infinity;
	const seuil = lufs(absolus.reduce((a, b) => a + b, 0) / absolus.length) - 10;
	const gardes = absolus.filter((p) => lufs(p) > seuil);
	return lufs(gardes.reduce((a, b) => a + b, 0) / gardes.length);
}

const crete = (canaux) => {
	let m = 0;
	for (const x of canaux) for (let k = 0; k < x.length; k++) m = Math.max(m, Math.abs(x[k]));
	return m > 0 ? 20 * Math.log10(m) : -Infinity;
};

/** Ce qu'il faut savoir d'un son : sonie intégrée, crête de sonie (le bloc de 400 ms le plus fort,
 *  ce qui compte pour un bruitage), crête d'échantillon, durée. En dB/LUFS, arrondis au dixième. */
export function mesurer(fichier, atelier, morceau) {
	const canaux = stereo(decoder(fichier, atelier, morceau));
	const p = blocs(canaux);
	const r = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : -99);
	return {integree: r(integree(p)), creteSonie: r(lufs(Math.max(...p))), crete: r(crete(canaux)), duree: Math.round((canaux[0].length / FREQ) * 100) / 100};
}

const quantile = (x, q) => {
	const s = [...x].sort((a, b) => a - b);
	return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : NaN;
};

/** Le contrôle du mix d'un film rendu. Rend les chiffres, et la liste de ce qui ne va pas. */
export function controler(atelier, film = join(atelier, 'renders', 'film.mp4')) {
	const canaux = stereo(decoder(film, atelier));
	const p = blocs(canaux);
	const res = {film: Math.round(integree(p) * 10) / 10, crete: Math.round(crete(canaux) * 10) / 10, alertes: []};
	if (res.film > -13 || res.film < -17) res.alertes.push(`film à ${res.film} LUFS : viser −16 à −14`);
	if (res.crete > -0.5) res.alertes.push(`crête à ${res.crete} dB : risque de saturation (baisser un bruitage fort ou la musique)`);

	const pitch = existsSync(join(atelier, 'src', 'pitch.ts')) ? readFileSync(join(atelier, 'src', 'pitch.ts'), 'utf-8') : '';
	const voix = pitch.match(/export const VOIX = '([^']+)'/)?.[1];
	if (!voix || !existsSync(join(atelier, 'public', voix))) return res;
	const debutVoix = Number(pitch.match(/DEBUT_VOIX = ([\d.]+)/)?.[1] ?? 0);

	// La voix posée dans le film à DEBUT_VOIX, recalée et mise à l'échelle sur ce que le film contient.
	const v = stereo(decoder(join(atelier, 'public', voix), atelier))[0];
	const n = canaux[0].length;
	const place = (decalage) => {
		const x = new Float32Array(n);
		const d = Math.round(debutVoix * FREQ) + decalage;
		for (let k = Math.max(0, -d); k < v.length && k + d < n; k++) x[k + d] = v[k];
		return x;
	};
	// Le recalage : l'écart (±5 ms) qui retire le mieux la voix, sur ses 20 premières secondes.
	const a = Math.round(debutVoix * FREQ);
	const b = Math.min(n, a + 20 * FREQ);
	const energie = (dec) => {
		let s = 0;
		const d = a + dec;
		for (let k = a; k < b; k += 4) {
			const r = canaux[0][k] - (v[k - d] ?? 0);
			s += r * r;
		}
		return s;
	};
	let decalage = 0;
	let meilleure = energie(0);
	for (let dec = -240; dec <= 240; dec++) {
		const e = energie(dec);
		if (e < meilleure) [decalage, meilleure] = [dec, e];
	}
	// Si rien ne s'annule, la voix du film n'est pas celle de public/voix (refaite depuis le rendu).
	let film0 = 0;
	for (let k = a; k < b; k += 4) film0 += canaux[0][k] * canaux[0][k];
	if (meilleure > 0.5 * film0) {
		res.alertes.push("écart voix/musique non mesuré : la voix du film n'est pas celle de public/voix (refaite après le rendu ?)");
		return res;
	}
	const vp = place(decalage);
	let num = 0, den = 0;
	for (let k = 0; k < n; k++) {
		num += vp[k] * (canaux[0][k] + canaux[1][k]) / 2;
		den += vp[k] * vp[k];
	}
	const gain = den ? num / den : 1;
	for (let k = 0; k < n; k++) vp[k] *= gain;
	const reste = canaux.map((c) => c.map((x, k) => x - vp[k]));

	const pv = blocs([vp, vp]);
	const pr = blocs(reste);
	const voixLufs = integree(pv);
	const ecarts = [];
	const sous = [];
	const faibles = [];
	for (let i = 0; i < Math.min(pv.length, pr.length); i++) {
		if (lufs(pv[i]) < voixLufs - 8) continue; // on ne parle pas vraiment dans ce bloc
		const e = lufs(pv[i]) - lufs(pr[i]);
		ecarts.push(e);
		sous.push(lufs(pr[i]));
		// Couverte : en pleine phrase (pas une fin de mot qui retombe) et moins de 9 dB au-dessus.
		if (e < 9 && lufs(pv[i]) >= voixLufs - 4) faibles.push(i / 10 + 0.2);
	}
	const hors = pr.filter((_, i) => lufs(pv[i] ?? 0) < voixLufs - 20).map(lufs).filter(Number.isFinite);
	const r1 = (x) => Math.round(x * 10) / 10;
	Object.assign(res, {
		voix: r1(voixLufs),
		sousVoix: r1(quantile(sous, 0.5)),
		ecart: r1(quantile(ecarts, 0.5)),
		ecartBas: r1(quantile(ecarts, 0.1)),
		horsVoix: hors.length ? r1(quantile(hors, 0.5)) : null,
		recalage: {decalage, gain: Math.round(gain * 1000) / 1000},
	});
	// Les moments où quelque chose couvre la voix, regroupés.
	const moments = [];
	for (const t of faibles) {
		const dernier = moments[moments.length - 1];
		if (dernier && t - dernier[1] <= 0.5) dernier[1] = t;
		else moments.push([t, t]);
	}
	res.moments = moments.map(([x, y]) => (y - x < 0.15 ? `${x.toFixed(1)} s` : `${x.toFixed(1)}–${y.toFixed(1)} s`));
	if (res.ecart < 15) res.alertes.push(`musique trop forte sous la voix : ${res.ecart} dB d'écart en médiane (viser 18, 15 au moins) → <Musique volume={${Math.round(10 ** ((res.ecart - 18) / 20) * 100) / 100}} /> ou le réglage musiqueSousVoix`);
	if (res.moments.length) res.alertes.push(`la voix est couverte (moins de 9 dB d'écart) à ${res.moments.slice(0, 8).join(', ')}${res.moments.length > 8 ? '…' : ''} : un bruitage trop fort ou une remontée de la musique`);
	return res;
}

/** Le rapport en clair, une ligne par mesure. */
export function rapport(r) {
	const lignes = [`Son du film : ${r.film} LUFS (viser −16 à −14), crête ${r.crete} dB`];
	if (r.voix !== undefined) {
		lignes.push(`  voix ${r.voix} LUFS · dessous (musique + bruitages) ${r.sousVoix} LUFS · écart médian ${r.ecart} dB (viser 18), 10 % du temps sous ${r.ecartBas} dB${r.horsVoix !== null ? ` · musique seule ${r.horsVoix} LUFS` : ''}`);
		if (Math.abs(r.recalage.gain - 1) > 0.2) lignes.push(`  (voix jouée à ${r.recalage.gain} de son niveau : <Voix volume> a été changé)`);
	}
	lignes.push(...(r.alertes.length ? r.alertes.map((a) => `  ⚠ ${a}`) : ['  ✓ mix dans les repères']));
	return lignes.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	const i = args.indexOf('--atelier');
	const atelier = i >= 0 ? args[i + 1] : undefined;
	if (args[0] === 'mesurer' && args[1]) {
		console.log(JSON.stringify(mesurer(args[1], atelier)));
	} else if (args[0] && existsSync(join(args[0], 'package.json'))) {
		const r = controler(args[0], args[1] && !args[1].startsWith('--') ? args[1] : undefined);
		console.log(rapport(r));
		if (args.includes('--journal')) appendFileSync(join(args[0], 'journal.jsonl'), JSON.stringify({sonie: r, t: new Date().toISOString()}) + '\n');
	} else {
		throw new Error('Usage : node sonie.mjs mesurer <fichier> [--atelier <atelier>] | node sonie.mjs <atelier> [film.mp4] [--journal]');
	}
}
