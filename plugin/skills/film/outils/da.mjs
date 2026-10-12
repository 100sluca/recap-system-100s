// La DA d'un site (celui du projet ou celui d'un client) : couleurs, polices, logo. Relevée dans un
// Chrome sans fenêtre (protocole DevTools, aucune dépendance), proposée par rôles (fond, surface,
// encre, accent…), et montrée sur une planche à faire valider avant le film.
//
//   node da.mjs <url> <dossier>                  relève la DA du site dans <dossier>
//   node da.mjs <url> --marque <nom>             pareil, rangée dans ~/.claude/recap-system-100s/marques/<nom>/
//   node da.mjs --appliquer <dossier|nom> <atelier>   installe une DA (dossier relevé, marque rangée ou
//                                                     marque livrée comme « 100s ») dans un atelier
//
// Le relevé écrit dans <dossier> : da.json (la DA proposée, à corriger à la main au besoin),
// releve.json (tout ce qui a été mesuré), site.png (le haut de la page), planche.png (la DA en un
// coup d'œil), logo.svg|png, fonts/ (les polices libres trouvées, avec fonts/polices.json).
// Les polices : celles de Google Fonts (licences libres) sont copiées. Une police servie par le site
// lui-même n'est copiée qu'avec --polices-du-site (la DA d'un client, pour son propre film, quand il
// l'accepte) ; Adobe Fonts, Typekit et autres ne le sont jamais : la DA prend alors une police libre
// proche, et releve.json le dit.
import {spawn} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {homedir, tmpdir} from 'node:os';
import {basename, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {trouverNavigateur} from '../../recap-system-100s/navigateur.mjs';
import {chromeRemotion} from './binaires.mjs';

const SKILL = join(import.meta.dirname, '..');
const MARQUES = join(homedir(), '.claude', 'recap-system-100s', 'marques');
const args = process.argv.slice(2);
const arg = (nom) => {
	const i = args.indexOf(`--${nom}`);
	return i >= 0 ? args[i + 1] : undefined;
};
const lireJson = (f) => JSON.parse(readFileSync(f, 'utf-8').replace(/^﻿/, ''));

// ─── Installer une DA dans un atelier ────────────────────────────────────────────────────────────
if (args[0] === '--appliquer') {
	const [, source, atelierBrut] = args;
	if (!source || !atelierBrut) throw new Error('Usage : node da.mjs --appliquer <dossier DA | nom de marque> <atelier>');
	const atelier = resolve(atelierBrut);
	const dossier = [source, join(MARQUES, source), join(SKILL, 'marques', source)].find((d) => existsSync(join(d, 'da.json')));
	if (!dossier) throw new Error(`Pas de da.json dans « ${source} », ni dans ${MARQUES}, ni dans les marques livrées.`);
	const da = lireJson(join(dossier, 'da.json'));
	// Les polices : les fichiers dans public/fonts/, une ligne chacune dans polices.json.
	const registre = join(atelier, 'public', 'fonts', 'polices.json');
	const polices = lireJson(registre);
	if (existsSync(join(dossier, 'fonts', 'polices.json'))) {
		for (const p of lireJson(join(dossier, 'fonts', 'polices.json'))) {
			copyFileSync(join(dossier, 'fonts', p.fichier), join(atelier, 'public', 'fonts', p.fichier));
			if (!polices.some((q) => q.fichier === p.fichier)) polices.push(p);
		}
		writeFileSync(registre, JSON.stringify(polices, null, '\t') + '\n');
	}
	// Le logo, et les fichiers de code propres à la marque (marques/100s/marque100s.tsx…).
	if (da.logo && existsSync(join(dossier, basename(da.logo)))) {
		mkdirSync(join(atelier, 'public', 'marque'), {recursive: true});
		copyFileSync(join(dossier, basename(da.logo)), join(atelier, 'public', 'marque', basename(da.logo)));
		da.logo = `marque/${basename(da.logo)}`;
	}
	for (const f of readdirSync(dossier).filter((x) => x.endsWith('.tsx'))) {
		mkdirSync(join(atelier, 'src', 'marque'), {recursive: true});
		copyFileSync(join(dossier, f), join(atelier, 'src', 'marque', f));
	}
	writeFileSync(join(atelier, 'da.json'), JSON.stringify(da, null, '\t') + '\n');
	const manque = ['titre', 'texte', 'mono'].map((r) => da.polices[r]?.famille).filter((fam) => fam && !polices.some((p) => p.famille === fam));
	console.log(`DA installée dans ${atelier} : ${da.nom}`);
	if (manque.length) console.log(`Attention, polices absentes de public/fonts/ (le navigateur prendra une police de secours) : ${manque.join(', ')}`);
	process.exit(0);
}

// ─── Relever la DA d'un site ─────────────────────────────────────────────────────────────────────
const URL_SITE = args[0];
const nomMarque = arg('marque');
const SORTIE = resolve(nomMarque ? join(MARQUES, nomMarque) : args[1] ?? '');
if (!URL_SITE || /^--/.test(URL_SITE) || (!nomMarque && !args[1])) throw new Error('Usage : node da.mjs <url> <dossier> | node da.mjs <url> --marque <nom>');
const policesDuSite = args.includes('--polices-du-site');
mkdirSync(join(SORTIE, 'fonts'), {recursive: true});

const CHROME = trouverNavigateur() ?? chromeRemotion(SKILL) ?? chromeRemotion(process.cwd());
if (!CHROME) throw new Error("Aucun navigateur : installer Chrome, ou lancer depuis un atelier (Remotion y a téléchargé le sien).");
const PORT = 9334;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'film-da-'))}`, '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1920,1080', 'about:blank']);
for (let i = 0; i < 50; i++) {
	await attendre(200);
	if (await fetch(`http://127.0.0.1:${PORT}/json/version`).then(() => true).catch(() => false)) break;
}
const cible = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {method: 'PUT'}).then((r) => r.json());
const ws = new WebSocket(cible.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, {once: true}));
let id = 0;
const attente = new Map();
ws.addEventListener('message', (e) => {
	const m = JSON.parse(e.data);
	if (m.id && attente.has(m.id)) {
		attente.get(m.id)(m);
		attente.delete(m.id);
	}
});
const cdp = (method, params = {}) =>
	new Promise((ok) => {
		const n = ++id;
		attente.set(n, ok);
		ws.send(JSON.stringify({id: n, method, params}));
	});
const evaluer = async (expression) => (await cdp('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})).result?.result?.value;
const photo = async (fichier, hauteur = 1080) => {
	const {result} = await cdp('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: 1920, height: hauteur, scale: 1}});
	writeFileSync(fichier, Buffer.from(result.data, 'base64'));
};

await cdp('Page.enable');
await cdp('Network.setUserAgentOverride', {userAgent: UA});
await cdp('Emulation.setDeviceMetricsOverride', {width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false});
await cdp('Page.navigate', {url: URL_SITE});
await attendre(4000);
const total = (await evaluer('document.documentElement.scrollHeight')) ?? 1080;
for (let y = 0; y < Math.min(total, 6000); y += 700) {
	await evaluer(`window.scrollTo(0, ${y})`);
	await attendre(200);
}
await evaluer('window.scrollTo(0, 0)');
await attendre(1500);
await photo(join(SORTIE, 'site.png'));

// Ce qu'on mesure dans la page. Toutes les couleurs passent par un canvas (oklch, hsl, color-mix… → sRGB).
const MESURE = String.raw`(async () => {
	const cv = document.createElement('canvas'); cv.width = cv.height = 1;
	const g = cv.getContext('2d', {willReadFrequently: true});
	const cache = new Map();
	const rgba = (css) => {
		if (!css || css === 'transparent' || css === 'none') return null;
		if (cache.has(css)) return cache.get(css);
		g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = css; g.fillRect(0, 0, 1, 1);
		const d = g.getImageData(0, 0, 1, 1).data;
		const v = d[3] < 8 ? null : {hex: '#' + [d[0], d[1], d[2]].map((x) => x.toString(16).padStart(2, '0')).join(''), a: d[3] / 255};
		cache.set(css, v); return v;
	};
	const ajoute = (tab, cle, poids) => { tab[cle] = (tab[cle] || 0) + poids; };
	const fonds = {}, textes = {}, boutons = {}, liens = {}, surBouton = {};
	const fondDe = (el) => {
		for (let n = el; n; n = n.parentElement) {
			const s = getComputedStyle(n);
			const c = rgba(s.backgroundColor);
			if (c && c.a > 0.5) return c.hex;
			if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(n.tagName) || (s.backgroundImage && s.backgroundImage !== 'none' && n !== document.body && n !== document.documentElement)) return 'image';
		}
		return '#ffffff';
	};
	// Le fond qu'on voit vraiment : une grille de points sur les trois premiers écrans.
	const H = Math.min(document.documentElement.scrollHeight, 3 * innerHeight);
	for (let y0 = 0; y0 < H; y0 += innerHeight) {
		scrollTo(0, y0); await new Promise((r) => setTimeout(r, 120));
		for (let i = 0; i < 48; i++) for (let j = 0; j < 27; j++) {
			const el = document.elementFromPoint((i + 0.5) * innerWidth / 48, (j + 0.5) * innerHeight / 27);
			if (el) ajoute(fonds, fondDe(el), 1);
		}
	}
	scrollTo(0, 0);
	// Les textes, pesés par longueur et taille ; les boutons et les liens.
	for (const el of document.querySelectorAll('body *')) {
		const r = el.getBoundingClientRect();
		if (!r.width || !r.height || r.top > H) continue;
		const s = getComputedStyle(el);
		if (s.visibility === 'hidden' || Number(s.opacity) < 0.3) continue;
		const propre = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ');
		if (propre) { const c = rgba(s.color); if (c) ajoute(textes, c.hex, propre.length * parseFloat(s.fontSize)); }
		const estBouton = el.matches('button, [role=button], input[type=submit], a[class*=btn], a[class*=button], a[class*=Button], a[class*=cta]');
		const bg = rgba(s.backgroundColor);
		if (estBouton && bg && bg.a > 0.5) { ajoute(boutons, bg.hex, r.width * r.height); const t = rgba(s.color); if (t) ajoute(surBouton, bg.hex + '>' + t.hex, 1); }
		if (el.tagName === 'A' && propre) { const c = rgba(s.color); if (c) ajoute(liens, c.hex, propre.length); }
	}
	// Les variables CSS de couleur déclarées sur :root.
	const variables = {};
	for (const f of document.styleSheets) {
		let regles; try { regles = f.cssRules; } catch { continue; }
		const parcourir = (rs) => { for (const r of rs) {
			if (r.cssRules && !r.selectorText) parcourir(r.cssRules);
			if (r.selectorText && /(^|,)\s*(:root|html)\b/.test(r.selectorText)) for (const p of r.style) if (p.startsWith('--')) {
				const v = r.style.getPropertyValue(p).trim(); if (CSS.supports('color', v)) { const c = rgba(v); if (c) variables[p] = c.hex; }
			}
		} };
		parcourir(regles);
	}
	// Les polices : celle des titres, du texte, des boutons, du code ; les @font-face lisibles ; les fichiers chargés.
	const police = (sel) => { const el = document.querySelector(sel); if (!el) return null; const s = getComputedStyle(el); return {pile: s.fontFamily, graisse: s.fontWeight, taille: parseFloat(s.fontSize)}; };
	const faces = [];
	for (const f of document.styleSheets) {
		let regles; try { regles = f.cssRules; } catch { continue; }
		for (const r of regles) if (r.constructor.name === 'CSSFontFaceRule') {
			const urls = [...r.style.getPropertyValue('src').matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => new URL(m[1], f.href || location.href).href);
			faces.push({famille: r.style.getPropertyValue('font-family').replace(/["']/g, '').trim(), graisse: r.style.getPropertyValue('font-weight') || '400', style: r.style.getPropertyValue('font-style') || 'normal', urls, plage: r.style.getPropertyValue('unicode-range')});
		}
	}
	const chargees = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => /\.(woff2?|ttf|otf)(\?|$)/i.test(u));
	const feuillesPolices = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).filter((h) => /fonts\.googleapis\.com|fonts\.bunny\.net|use\.typekit\.net|fonts\.adobe/i.test(h));
	// Le logo : d'abord ce qui est marqué comme tel (lien d'accueil, classe « logo », alt « logo »),
	// puis le premier visuel de l'en-tête ; jamais l'icône d'un bouton. Et le texte du lien d'accueil.
	const logos = [];
	const vus = new Set();
	const prendre = (el) => {
		if (vus.has(el) || logos.length >= 3) return;
		vus.add(el);
		const r = el.getBoundingClientRect();
		if (r.top > 260 || r.width < 24 || r.height < 14 || el.closest('button, [role=button]')) return;
		if (el.tagName.toLowerCase() === 'svg') {
			const clone = el.cloneNode(true); clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			if (!clone.getAttribute('width')) clone.setAttribute('width', Math.round(r.width)); if (!clone.getAttribute('height')) clone.setAttribute('height', Math.round(r.height));
			clone.setAttribute('color', getComputedStyle(el).color); clone.style.color = getComputedStyle(el).color;
			logos.push({type: 'svg', code: clone.outerHTML, l: r.width, h: r.height});
		} else logos.push({type: 'img', url: el.currentSrc || el.src, l: r.width, h: r.height});
	};
	for (const sel of ['a[href="/"] img, a[href="/"] svg, a[href="./"] img, a[href="./"] svg', '[class*=logo] img, [class*=logo] svg, [class*=Logo] img, [class*=Logo] svg, [id*=logo] img, [id*=logo] svg, img[alt*=logo i]', 'header img, header svg, nav img, nav svg'])
		for (const el of document.querySelectorAll(sel)) prendre(el);
	const accueil = [...document.querySelectorAll('a[href="/"], a[href="./"]')].find((a) => a.getBoundingClientRect().top < 200 && a.textContent.trim());
	const logoTexte = accueil ? accueil.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) : null;
	const meta = (sel, attr = 'content') => document.querySelector(sel)?.getAttribute(attr) || null;
	return {
		titre: document.title, site: meta('meta[property="og:site_name"]'), themeColor: rgba(meta('meta[name=theme-color]'))?.hex ?? null,
		icones: [...document.querySelectorAll('link[rel~=icon], link[rel=apple-touch-icon]')].map((l) => l.href), ogImage: meta('meta[property="og:image"]'),
		fonds, textes, boutons, liens, surBouton, variables,
		polices: {titre: police('h1') || police('h2'), sousTitre: police('h2'), texte: police('p') || police('body'), bouton: police('button, a[class*=btn], a[class*=button]'), code: police('code, pre, kbd')},
		faces, chargees, feuillesPolices, logos, logoTexte,
	};
})()`;
const releve = await evaluer(MESURE);
ws.close();
chrome.kill();
if (!releve) throw new Error(`Rien relevé sur ${URL_SITE} (page vide, bloquée ou trop lente).`);

// ─── Des mesures aux rôles ───────────────────────────────────────────────────────────────────────
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const versHex = (v) => '#' + v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const melange = (a, b, k) => versHex(rgb(a).map((x, i) => x + (rgb(b)[i] - x) * k));
const lum = (hex) => {
	const c = rgb(hex).map((x) => {
		const s = x / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// La chroma (écart entre la plus forte et la plus faible composante, de 0 à 1) : un quasi-noir
// teinté n'est pas une couleur vive, contrairement à ce que dirait la saturation HSV.
const saturation = (hex) => {
	const v = rgb(hex).map((x) => x / 255);
	return Math.max(...v) - Math.min(...v);
};
const tri = (tab) => Object.entries(tab ?? {}).filter(([c]) => c.startsWith('#')).sort((a, b) => b[1] - a[1]);

const fondsTries = tri(releve.fonds);
const fond = fondsTries[0]?.[0] ?? '#ffffff';
const clair = lum(fond) > 0.4;
// L'encre : parmi les couleurs de texte fréquentes (12 % du texte au moins), la plus contrastée ;
// le texte courant est souvent un gris plus doux que les titres. Le doux : la plus fréquente des autres.
const textesTries = tri(releve.textes).filter(([c]) => contraste(c, fond) > 1.6);
const poidsTextes = textesTries.reduce((s, x) => s + x[1], 0) || 1;
const frequents = textesTries.filter(([, n]) => n >= poidsTextes * 0.12);
const encre = [...frequents].sort((a, b) => contraste(b[0], fond) - contraste(a[0], fond))[0]?.[0] ?? (clair ? '#111111' : '#f5f5f5');
const doux = textesTries.find(([c]) => c !== encre && contraste(c, fond) < contraste(encre, fond))?.[0] ?? melange(encre, fond, 0.38);
const vives = (tab) => tri(tab).filter(([c]) => saturation(c) > 0.28 && contraste(c, fond) > 1.25);
// L'accent, dans l'ordre : la couleur de thème déclarée, les variables CSS qui se disent « marque »,
// les boutons, les liens, les fonds, les textes vifs, les autres variables.
const nommees = Object.entries(releve.variables ?? {}).filter(([nom, c]) => /brand|primary|accent|main|marque/i.test(nom) && !/foreground|text|fg|-on-/i.test(nom) && saturation(c) > 0.28);
const candidatsAccent = [
	...(releve.themeColor && saturation(releve.themeColor) > 0.28 ? [[releve.themeColor, Infinity]] : []),
	...nommees.map(([, c]) => [c, Infinity]),
	...vives(releve.boutons),
	...vives(releve.liens),
	...vives(releve.fonds),
	...vives(releve.textes),
	...Object.values(releve.variables ?? {}).filter((c) => saturation(c) > 0.35).map((c) => [c, 0]),
];
const accent = candidatsAccent[0]?.[0] ?? (tri(releve.boutons)[0]?.[0] && tri(releve.boutons)[0][0] !== fond ? tri(releve.boutons)[0][0] : encre);
const accent2 = candidatsAccent.find(([c]) => contraste(c, accent) > 1.5 && c !== accent)?.[0] ?? encre;
const surBouton = tri(releve.surBouton).find(([k]) => k.startsWith(accent + '>'))?.[0]?.split('>')[1];
const surAccent = surBouton ?? (contraste('#ffffff', accent) >= contraste('#111111', accent) ? '#ffffff' : '#111111');
const surface = fondsTries.map(([c]) => c).find((c) => c !== fond && c !== accent && saturation(c) < 0.12 && contraste(c, fond) > 1.06 && contraste(c, fond) < 1.6) ?? (clair ? (fond === '#ffffff' ? melange(fond, encre, 0.04) : '#ffffff') : melange(fond, '#ffffff', 0.07));
const [er, eg, eb] = rgb(encre);

// Les polices : la première famille de chaque pile, ses fichiers si on peut les prendre.
const premiere = (pile) => (pile ?? '').split(',')[0].replace(/["']/g, '').trim();
const generique = (pile) => (/\bmonospace\b/.test(pile ?? '') ? 'mono' : /(^|,)\s*serif\b/.test(pile ?? '') ? 'serif' : 'sans');
const SUBSTITUTS = {sans: 'Inter', serif: 'Instrument Serif', mono: 'JetBrains Mono', lourd: 'Archivo Black'};
const fontsCopiees = [];
const notesPolices = [];
const telecharger = async (url, nom) => {
	const r = await fetch(url, {headers: {'User-Agent': UA, Referer: URL_SITE}});
	if (!r.ok) return false;
	writeFileSync(join(SORTIE, 'fonts', nom), Buffer.from(await r.arrayBuffer()));
	return true;
};
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Les @font-face des feuilles Google Fonts (lues ici : le navigateur ne les donne pas, elles sont d'un autre domaine).
const facesGoogle = [];
for (const href of releve.feuillesPolices ?? []) {
	if (!/fonts\.googleapis\.com|fonts\.bunny\.net/.test(href)) {
		notesPolices.push(`Feuille de polices non libre ou non lue : ${href} (jamais copiée).`);
		continue;
	}
	const css = await fetch(href, {headers: {'User-Agent': UA}}).then((r) => r.text()).catch(() => '');
	for (const bloc of css.split('@font-face').slice(1)) {
		const famille = bloc.match(/font-family:\s*['"]?([^;'"]+)/)?.[1]?.trim();
		const url = bloc.match(/url\(([^)]+\.woff2)\)/)?.[1];
		const plage = bloc.match(/unicode-range:\s*([^;]+)/)?.[1] ?? '';
		if (famille && url && (!plage || /U\+0000/i.test(plage))) facesGoogle.push({famille, graisse: bloc.match(/font-weight:\s*([^;]+)/)?.[1]?.trim() ?? '400', style: bloc.match(/font-style:\s*([^;]+)/)?.[1]?.trim() ?? 'normal', urls: [url], libre: true});
	}
}
const choisirPolice = async (role, mesure, defaut) => {
	const famille = premiere(mesure?.pile);
	if (!famille || /^(system-ui|-apple-system|ui-sans-serif|BlinkMacSystemFont|Segoe UI|Arial|Helvetica|sans-serif|serif|monospace|ui-monospace)$/i.test(famille)) {
		const sub = SUBSTITUTS[generique(mesure?.pile)] ?? defaut;
		notesPolices.push(`${role} : police système « ${famille || '?'} » → ${sub}.`);
		return {famille: sub, graisse: Number(mesure?.graisse) || (role === 'titre' ? 700 : 400)};
	}
	const libres = facesGoogle.filter((f) => f.famille === famille);
	const duSite = (releve.faces ?? []).filter((f) => f.famille === famille && !/typekit|adobe|monotype|fonts\.com|myfonts/i.test(f.urls.join(' ')));
	const faces = libres.length ? libres : policesDuSite ? duSite : [];
	let ok = 0;
	for (const f of faces) {
		const url = f.urls.find((u) => /\.woff2(\?|$)/i.test(u)) ?? f.urls[0];
		if (!url) continue;
		const nom = `${slug(famille)}-${slug(String(f.graisse).replace(/\s+/g, '-'))}${f.style === 'italic' ? '-italic' : ''}.${url.match(/\.(woff2?|ttf|otf)(\?|$)/i)?.[1] ?? 'woff2'}`;
		if (fontsCopiees.some((p) => p.fichier === nom)) {
			ok++;
			continue;
		}
		if (await telecharger(url, nom)) {
			fontsCopiees.push({famille, fichier: nom, graisse: String(f.graisse), ...(f.style === 'italic' ? {style: 'italic'} : {})});
			ok++;
		}
	}
	if (ok) {
		notesPolices.push(`${role} : ${famille} (${libres.length ? 'Google Fonts, licence libre' : 'fichiers du site, copiés avec --polices-du-site : licence à confirmer avec le client'}).`);
		return {famille, graisse: Number(mesure?.graisse) || 400};
	}
	const sub = SUBSTITUTS[generique(mesure?.pile)] ?? defaut;
	notesPolices.push(`${role} : « ${famille} » n'est pas copiable${duSite.length ? ' (servie par le site : relancer avec --polices-du-site si le client l\'accepte)' : ' (police non libre ou introuvable)'} → ${sub}, la plus proche parmi les polices livrées.`);
	return {famille: sub, graisse: Number(mesure?.graisse) || 400};
};
const polices = {
	titre: await choisirPolice('titre', releve.polices.titre, 'Inter'),
	texte: await choisirPolice('texte', releve.polices.texte, 'Inter'),
	mono: releve.polices.code ? await choisirPolice('mono', releve.polices.code, 'JetBrains Mono') : {famille: 'JetBrains Mono', graisse: 400},
};
writeFileSync(join(SORTIE, 'fonts', 'polices.json'), JSON.stringify(fontsCopiees, null, '\t') + '\n');

// Le logo : un SVG en ligne, sinon l'image de l'en-tête, sinon l'icône du site.
let logo = null;
const lg = releve.logos?.[0];
if (lg?.type === 'svg') {
	writeFileSync(join(SORTIE, 'logo.svg'), lg.code);
	logo = 'logo.svg';
} else {
	const url = lg?.url ?? releve.icones?.find((u) => /apple-touch|\.svg/i.test(u)) ?? releve.icones?.[0];
	if (url) {
		const r = await fetch(url, {headers: {'User-Agent': UA, Referer: URL_SITE}}).catch(() => null);
		if (r?.ok) {
			const type = r.headers.get('content-type') ?? '';
			const ext = /svg/.test(type) || /\.svg(\?|$)/i.test(url) ? 'svg' : /png/.test(type) ? 'png' : /jpe?g/.test(type) ? 'jpg' : /webp/.test(type) ? 'webp' : 'png';
			writeFileSync(join(SORTIE, `logo.${ext}`), Buffer.from(await r.arrayBuffer()));
			logo = `logo.${ext}`;
		}
	}
}

const hote = new URL(URL_SITE).hostname.replace(/^www\./, '');
const da = {
	nom: `${releve.site || hote}, relevée sur ${hote} le ${new Date().toLocaleDateString('fr-FR')}`,
	source: nomMarque ? 'marque' : 'client',
	couleurs: {fond, surface, encre, doux, pale: melange(encre, fond, 0.62), accent, surAccent, accent2, filet: `rgba(${er},${eg},${eb},0.10)`},
	polices,
	logo,
	signature: null,
};
writeFileSync(join(SORTIE, 'da.json'), JSON.stringify(da, null, '\t') + '\n');
writeFileSync(join(SORTIE, 'releve.json'), JSON.stringify({url: URL_SITE, ...releve, notesPolices}, null, '\t') + '\n');

// ─── La planche ─────────────────────────────────────────────────────────────────────────────────
const echap = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const faceCss = fontsCopiees.map((p) => `@font-face{font-family:"${p.famille}";src:url("fonts/${p.fichier}");font-weight:${p.graisse};font-style:${p.style ?? 'normal'}}`).join('');
const livrees = lireJson(join(SKILL, 'modele', 'public', 'fonts', 'polices.json'))
	.map((p) => `@font-face{font-family:"${p.famille}";src:url("${pathToFileURL(join(SKILL, 'modele', 'public', 'fonts', p.fichier)).href}");font-weight:${p.graisse};font-style:${p.style ?? 'normal'}}`)
	.join('');
const pastille = (role, c) =>
	`<div class="p"><div class="c" style="background:${c}"></div><b>${role}</b><span>${c}</span></div>`;
const top = tri(releve.fonds).slice(0, 6).map(([c, n]) => `<span class="m" style="background:${c}"></span>${c} <i>${Math.round((n / fondsTries.reduce((s, x) => s + x[1], 0)) * 100)} %</i>`).join(' &nbsp; ');
writeFileSync(
	join(SORTIE, 'planche.html'),
	`<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${livrees}${faceCss}
body{margin:0;width:1920px;height:1080px;background:${fond};color:${encre};font-family:"${polices.texte.famille}";display:grid;grid-template-columns:1fr 760px;gap:60px;padding:70px;box-sizing:border-box}
h1{font-family:"${polices.titre.famille}";font-weight:${polices.titre.graisse};font-size:96px;line-height:1;margin:0 0 18px;letter-spacing:-0.02em}
.sous{font-size:30px;color:${doux};margin:0 0 40px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.p{background:${surface};border:1px solid ${da.couleurs.filet};border-radius:18px;padding:16px}.c{height:96px;border-radius:12px;margin-bottom:12px;border:1px solid ${da.couleurs.filet}}
.p b{display:block;font-size:22px}.p span{font-family:"${polices.mono.famille}";font-size:20px;color:${doux}}
.btn{display:inline-block;margin-top:36px;background:${accent};color:${surAccent};font-size:30px;padding:18px 34px;border-radius:999px}
.mono{font-family:"${polices.mono.famille}";font-size:22px;color:${doux};margin-top:28px;line-height:1.6}.m{display:inline-block;width:18px;height:18px;border-radius:4px;vertical-align:-3px;border:1px solid ${da.couleurs.filet}}
img{max-width:100%;border-radius:16px;border:1px solid ${da.couleurs.filet}}.logo{max-height:90px;max-width:420px;margin-bottom:30px;display:block;border:0;border-radius:0}</style></head><body>
<div>${logo ? `<img class="logo" src="${logo}">` : ''}<h1>${echap(releve.logoTexte || releve.site || hote)}</h1><p class="sous">Titre : ${echap(polices.titre.famille)} ${polices.titre.graisse} · texte : ${echap(polices.texte.famille)} · mono : ${echap(polices.mono.famille)}</p>
<div class="g">${['fond', 'surface', 'encre', 'doux', 'pale', 'accent', 'surAccent', 'accent2'].map((r) => pastille(r, da.couleurs[r])).join('')}</div>
<span class="btn">Le bouton, dans l'accent</span><div class="mono">Fonds vus sur la page : ${top}</div></div>
<div><img src="site.png"><div class="mono">${notesPolices.map(echap).join('<br>')}</div></div></body></html>`,
);
// La planche en image, avec le même navigateur.
const chrome2 = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1920,1080', '--virtual-time-budget=1500', `--screenshot=${join(SORTIE, 'planche.png')}`, pathToFileURL(join(SORTIE, 'planche.html')).href]);
await new Promise((r) => chrome2.on('exit', r));

console.log(`DA relevée sur ${URL_SITE} → ${SORTIE}`);
console.log(`  fond ${fond} · surface ${surface} · encre ${encre} · doux ${doux} · accent ${accent} (texte ${surAccent}) · accent2 ${accent2}`);
console.log(`  polices : titre ${polices.titre.famille} ${polices.titre.graisse}, texte ${polices.texte.famille}, mono ${polices.mono.famille}`);
for (const n of notesPolices) console.log(`  · ${n}`);
console.log(`  logo : ${logo ?? 'aucun trouvé (le nom en texte)'}`);
console.log(`  À regarder : ${join(SORTIE, 'planche.png')} ; à corriger au besoin : ${join(SORTIE, 'da.json')}`);

