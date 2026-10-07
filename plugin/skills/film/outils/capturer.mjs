// Captures d'un vrai site pour un film, via Chrome sans fenêtre piloté par le protocole
// DevTools (aucune dépendance : WebSocket natif de Node). Chaque page est défilée jusqu'en bas
// pour déclencher les apparitions, puis on attend la fin des animations.
// Le navigateur : Chrome, Chromium, Edge ou Brave s'il est installé, sinon le Chrome sans fenêtre
// que Remotion a téléchargé dans l'atelier (le dossier de sortie est dans l'atelier).
//
//   node capturer.mjs <url du site> <dossier de sortie> [/chemin …] [--long /chemin]
//     ex. : node capturer.mjs https://mon-site.fr <atelier>/public/captures . blog/ tarifs/ --long .
//   → <nom>.png en 1920 × 1080 (« accueil » pour /), et <nom>-long.png en page entière pour --long.
import {spawn} from 'node:child_process';
import {mkdtempSync, writeFileSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {trouverNavigateur} from '../../recap-system-100s/navigateur.mjs';
import {chromeRemotion} from './binaires.mjs';

const [SITE, SORTIE, ...reste] = process.argv.slice(2);
if (!SITE || !SORTIE) throw new Error('Usage : node capturer.mjs <url du site> <dossier de sortie> [/chemin …] [--long /chemin]');
const CHROME = trouverNavigateur() ?? chromeRemotion(resolve(SORTIE));
if (!CHROME) throw new Error("Aucun navigateur : installer Chrome, ou lancer d'abord nouveau.mjs (Remotion télécharge le sien dans l'atelier).");
const PORT = 9333;
const nomDe = (chemin) => chemin.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'accueil';
// Chemins acceptés avec ou sans « / » initial (« . » = l'accueil) : en Git Bash, écrire
// « fresques/google/ » plutôt que « /fresques/google/ », que Bash transforme en chemin Windows.
const normal = (c) => (c === '.' ? '/' : `/${c.replace(/^\/+/, '')}`);

// nom → [chemin, hauteur (0 = page entière)]
const PAGES = {};
for (let i = 0; i < reste.length; i++) {
	if (reste[i] === '--long') {
		const c = normal(reste[i + 1]);
		PAGES[`${nomDe(c)}-long`] = [c, 0];
		i++;
	} else PAGES[nomDe(normal(reste[i]))] = [normal(reste[i]), 1080];
}
if (!Object.keys(PAGES).length) PAGES.accueil = ['/', 1080];

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${mkdtempSync(join(tmpdir(), 'film-captures-'))}`,
	'--hide-scrollbars',
	'--force-device-scale-factor=1',
	'--window-size=1920,1080',
	'about:blank',
]);

let version;
for (let i = 0; i < 50 && !version; i++) {
	await attendre(200);
	version = await fetch(`http://127.0.0.1:${PORT}/json/version`)
		.then((r) => r.json())
		.catch(() => undefined);
}
const cible = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
	method: 'PUT',
}).then((r) => r.json());

const ws = new WebSocket(cible.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, {once: true}));
let id = 0;
const enAttente = new Map();
ws.addEventListener('message', (e) => {
	const m = JSON.parse(e.data);
	if (m.id && enAttente.has(m.id)) {
		enAttente.get(m.id)(m);
		enAttente.delete(m.id);
	}
});
const cdp = (method, params = {}) =>
	new Promise((resolve) => {
		const n = ++id;
		enAttente.set(n, resolve);
		ws.send(JSON.stringify({id: n, method, params}));
	});
const evaluer = async (expression) =>
	(await cdp('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true}))
		.result?.result?.value;

mkdirSync(SORTIE, {recursive: true});
await cdp('Page.enable');

for (const [nom, [chemin, hauteur]] of Object.entries(PAGES)) {
	await cdp('Emulation.setDeviceMetricsOverride', {
		width: 1920,
		height: 1080,
		deviceScaleFactor: 1,
		mobile: false,
	});
	await cdp('Page.navigate', {url: SITE.replace(/\/$/, '') + chemin});
	await attendre(3500);
	// Faire défiler toute la page pour déclencher les apparitions au défilement.
	const total = await evaluer('document.documentElement.scrollHeight');
	for (let y = 0; y < total; y += 700) {
		await evaluer(`window.scrollTo(0, ${y})`);
		await attendre(250);
	}
	await evaluer('window.scrollTo(0, 0)');
	await attendre(1800);
	const h = hauteur || (await evaluer('document.documentElement.scrollHeight'));
	if (!hauteur) {
		await cdp('Emulation.setDeviceMetricsOverride', {
			width: 1920,
			height: h,
			deviceScaleFactor: 1,
			mobile: false,
		});
		await attendre(2500);
	}
	const {result} = await cdp('Page.captureScreenshot', {
		format: 'png',
		clip: {x: 0, y: 0, width: 1920, height: h, scale: 1},
		captureBeyondViewport: !hauteur,
	});
	writeFileSync(join(SORTIE, `${nom}.png`), Buffer.from(result.data, 'base64'));
	console.log(`${nom}.png  1920×${h}`);
}

ws.close();
chrome.kill();
process.exit(0);
