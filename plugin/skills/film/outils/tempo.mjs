// Tempo d'une musique : battements par minute et instant du premier temps fort.
// Usage : node tempo.mjs <fichier audio> [--atelier <dossier>]
// Dernière ligne, lue par nouveau.mjs :  BPM=105.00 PREMIER_TEMPS=0.348
// Méthode : flux spectral (montées d'énergie), puis peigne de temps réguliers ajusté sur ce flux ;
// le temps fort de la mesure (4 temps) est celui où le flux est le plus fort.
// Le son est décodé par le ffmpeg de Remotion (celui de l'atelier), sinon par celui du système.
import {execFileSync} from 'node:child_process';
import {binaire, environnement} from './binaires.mjs';

const fichier = process.argv[2];
const i = process.argv.indexOf('--atelier');
const atelier = i >= 0 ? process.argv[i + 1] : undefined;
if (!fichier) throw new Error('Usage : node tempo.mjs <fichier audio> [--atelier <dossier>]');

const SR = 22050;
const ffmpeg = binaire(atelier);
// En WAV 16 bits : le ffmpeg allégé de Remotion n'écrit pas de flux brut.
const wav = execFileSync(ffmpeg, ['-v', 'error', '-i', fichier, '-t', '70', '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', '-f', 'wav', '-'], {
	maxBuffer: 64 * 1024 * 1024,
	env: environnement(ffmpeg),
});
const debutDonnees = wav.indexOf('data', 12) + 8;
const nbEchantillons = Math.floor((wav.length - debutDonnees) / 2);
const x = Float32Array.from({length: nbEchantillons}, (_, k) => wav.readInt16LE(debutDonnees + 2 * k) / 32768);

// Spectre de chaque tranche de 64 échantillons (fenêtre de Hann), puis montées d'énergie.
const PAS = 64;
const ips = SR / PAS; // images d'analyse par seconde
const n = Math.floor(x.length / PAS);
const BANDES = PAS / 2 + 1;
const hann = Float64Array.from({length: PAS}, (_, k) => 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (PAS - 1)));
const cos = new Float64Array(BANDES * PAS);
const sin = new Float64Array(BANDES * PAS);
for (let b = 0; b < BANDES; b++) {
	for (let k = 0; k < PAS; k++) {
		cos[b * PAS + k] = Math.cos((2 * Math.PI * b * k) / PAS);
		sin[b * PAS + k] = Math.sin((2 * Math.PI * b * k) / PAS);
	}
}
const L = new Float64Array(n * BANDES);
const tranche = new Float64Array(PAS);
for (let t = 0; t < n; t++) {
	for (let k = 0; k < PAS; k++) tranche[k] = x[t * PAS + k] * hann[k];
	for (let b = 0; b < BANDES; b++) {
		let re = 0;
		let im = 0;
		for (let k = 0; k < PAS; k++) {
			re += tranche[k] * cos[b * PAS + k];
			im -= tranche[k] * sin[b * PAS + k];
		}
		L[t * BANDES + b] = Math.log1p(Math.hypot(re, im) * 50);
	}
}
const brutFlux = new Float64Array(n - 1);
for (let t = 0; t < n - 1; t++) {
	let s = 0;
	for (let b = 0; b < BANDES; b++) s += Math.max(0, L[(t + 1) * BANDES + b] - L[t * BANDES + b]);
	brutFlux[t] = s;
}
// Lissage sur 3 tranches (bords complétés par des zéros), puis centré.
const flux = brutFlux.map((_, t) => ((brutFlux[t - 1] ?? 0) + brutFlux[t] + (brutFlux[t + 1] ?? 0)) / 3);
const moyenne = flux.reduce((a, b) => a + b, 0) / flux.length;
const o = flux.map((v) => v - moyenne);

function score(bpm) {
	const periode = (60 / bpm) * ips;
	let meilleur = [-1e18, 0];
	for (let ph = 0; ph < periode; ph++) {
		let s = 0;
		const nb = Math.ceil((o.length - ph) / periode);
		for (let k = 0; k < nb; k++) s += o[Math.floor(ph + k * periode)];
		if (s > meilleur[0]) meilleur = [s, ph];
	}
	return meilleur;
}
const plage = (debut, fin, pas) => Array.from({length: Math.ceil((fin - debut) / pas)}, (_, k) => debut + k * pas);
const meilleurDe = (bpms) => bpms.reduce((m, b) => {
	const s = score(b)[0];
	return s > m[0] ? [s, b] : m;
}, [-Infinity, 0])[1];

// Recherche grossière de 70 à 180, puis fine autour du meilleur.
const grossier = meilleurDe(plage(70, 180, 0.5));
const fin = meilleurDe(plage(grossier - 1, grossier + 1, 0.02));
const [, phase] = score(fin);
const temps = 60 / fin;
let t0 = phase / ips;
const battements = Array.from({length: 200}, (_, k) => t0 + k * temps).filter((b) => b < 60);
const forces = battements.map((b) => {
	const c = Math.floor(b * ips);
	let m = -Infinity;
	for (let k = Math.max(0, c - 2); k < Math.min(o.length, c + 3); k++) m = Math.max(m, o[k]);
	return m;
});
const moyenneDe = (k) => {
	const v = forces.filter((_, j) => j % 4 === k);
	return v.reduce((a, b) => a + b, 0) / v.length;
};
const tempsFort = [0, 1, 2, 3].reduce((m, k) => (moyenneDe(k) > moyenneDe(m) ? k : m), 0);
t0 += tempsFort * temps;

console.log(`Tempo : ${fin.toFixed(2)} temps/min (un temps = ${temps.toFixed(4)} s), premier temps fort à ${t0.toFixed(3)} s`);
console.log(`BPM=${fin.toFixed(2)} PREMIER_TEMPS=${t0.toFixed(3)}`);
