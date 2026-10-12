// Rend les aperçus des styles (6 s chacun) pour que l'utilisateur choisisse le style de son film,
// puis les assemble : un MP4 par style, catalogue.mp4 (tous à la suite) et catalogue.html (la grille
// des aperçus qui tournent en boucle, avec ce que fait chaque style et pour quoi).
//
//   node apercus.mjs <atelier> [--da projet|style] [--styles keynote,demo,…] [--sortie <dossier>] [--rapide]
//
// --da projet (par défaut si da.json de l'atelier n'est pas une palette de style) : tous les styles
//   dans la DA du projet, celle de da.json. C'est le but : « ton projet dans six styles ».
// --da style : chaque style dans sa propre palette (ce sont les aperçus livrés avec le skill).
// Le contenu : <atelier>/apercus.json s'il existe ({nom, phrase, question, reponse, chiffre:
//   {valeur, libelle}, mots: [3], adresse}, que du vrai relevé sur le projet), sinon l'exemple livré.
// --styles : seulement ceux-là (par défaut tous ceux qui ont un aperçu et ne sont pas masqués).
// --rapide : sans flou de mouvement (rendu environ six fois plus court, pour un essai).
// Sortie : <atelier>/out/apercus/ par défaut. Rendu en 960 × 540, via le dossier temporaire
// (sous Windows, l'accès contrôlé aux dossiers bloque le ffmpeg de Remotion sous Documents).
import {execFileSync, execSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {binaire, environnement} from './binaires.mjs';

const atelier = process.argv[2] && resolve(process.argv[2]);
if (!atelier || !existsSync(join(atelier, 'package.json'))) throw new Error('Usage : node apercus.mjs <atelier> [--da projet|style] [--styles a,b] [--sortie <dossier>]');
const arg = (nom) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
const lire = (f) => JSON.parse(readFileSync(f, 'utf-8').replace(/^﻿/, ''));

const catalogue = lire(join(atelier, 'src', 'styles', 'catalogue.json'));
const daFilm = lire(join(atelier, 'da.json'));
const mode = arg('da') ?? (daFilm.source === 'style' ? 'style' : 'projet');
const voulus = arg('styles')?.split(',').map((s) => s.trim());
const styles = catalogue.filter((s) => s.apercu !== false && (voulus ? voulus.includes(s.id) : !s.masque));
const rapide = process.argv.includes('--rapide');
if (!styles.length) throw new Error(`Aucun style ne correspond. Styles : ${catalogue.map((s) => s.id).join(', ')}`);
const contenu = existsSync(join(atelier, 'apercus.json')) ? lire(join(atelier, 'apercus.json')) : null;
const sortie = resolve(arg('sortie') ?? join(atelier, 'out', 'apercus'));
mkdirSync(sortie, {recursive: true});
mkdirSync(join(atelier, 'out'), {recursive: true});

console.log(`Aperçus : ${styles.map((s) => s.id).join(', ')} · DA : ${mode === 'projet' ? daFilm.nom : 'celle de chaque style'} · contenu : ${contenu ? 'apercus.json' : "l'exemple livré"}`);

// Un seul bundle pour tous les rendus.
const bundle = join(atelier, 'out', 'bundle-apercus');
execSync(`npx remotion bundle --out-dir="${bundle}" --log=error`, {cwd: atelier, stdio: 'inherit'});

const debut = Date.now();
const faits = [];
for (const s of styles) {
	const props = {
		da: mode === 'projet' ? daFilm : s.da,
		...(contenu ? {contenu} : {}),
		legende: `${s.numero} · ${s.nom}`,
		...(rapide ? {rapide: true} : {}),
	};
	const fichierProps = join(atelier, 'out', `props-apercu-${s.id}.json`);
	writeFileSync(fichierProps, JSON.stringify(props));
	const temporaire = join(tmpdir(), `apercu-${s.id}-${Date.now()}.mp4`);
	const t0 = Date.now();
	execSync(`npx remotion render "${bundle}" Apercu-${s.id} "${temporaire}" --props="${fichierProps}" --scale=0.5 --codec=h264 --crf=26 --concurrency=4 --log=error`, {
		cwd: atelier,
		stdio: 'inherit',
	});
	copyFileSync(temporaire, join(sortie, `${s.id}.mp4`));
	rmSync(temporaire);
	// La vignette : une image de l'aperçu (à 42 %, ou à `vignette` du catalogue), montrée avant la lecture.
	const ffmpegV = binaire(atelier, 'ffmpeg');
	const tempJpg = join(tmpdir(), `apercu-${s.id}-${Date.now()}.jpg`);
	execFileSync(ffmpegV, ['-y', '-v', 'error', '-ss', String(((s.duree || 270) / 30) * (s.vignette ?? 0.42)), '-i', join(sortie, `${s.id}.mp4`), '-frames:v', '1', '-q:v', '4', tempJpg], {env: environnement(ffmpegV)});
	copyFileSync(tempJpg, join(sortie, `${s.id}.jpg`));
	rmSync(tempJpg);
	const mo = statSync(join(sortie, `${s.id}.mp4`)).size / 1e6;
	console.log(`  ${s.numero} · ${s.nom.padEnd(16)} ${Math.round((Date.now() - t0) / 1000)} s · ${mo.toFixed(1)} Mo`);
	faits.push(s);
}

// Tous à la suite : catalogue.mp4 (mêmes réglages partout, donc assemblage sans réencodage).
const ffmpeg = binaire(atelier, 'ffmpeg');
const liste = join(atelier, 'out', 'apercus-liste.txt');
writeFileSync(liste, faits.map((s) => `file '${join(sortie, `${s.id}.mp4`).replace(/\\/g, '/')}'`).join('\n'));
const tempCat = join(tmpdir(), `catalogue-${Date.now()}.mp4`);
execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', tempCat], {env: environnement(ffmpeg)});
copyFileSync(tempCat, join(sortie, 'catalogue.mp4'));
rmSync(tempCat);

// La page : la grille des aperçus.
const echap = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cartes = faits
	.map(
		(s) => `    <article>
      <video src="${s.id}.mp4" poster="${s.id}.jpg" autoplay muted loop playsinline></video>
      <h2><span>${s.numero}</span> ${echap(s.nom)}${s.option ? ' <em>en option · plus long à écrire</em>' : ''}</h2>
      <p>${echap(s.accroche)}</p>
      <dl><dt>Pour</dt><dd>${echap(s.pour)}</dd><dt>Rendu</dt><dd>${echap(s.dimension)}</dd><dt>Musique</dt><dd>${echap(s.tempo)}</dd></dl>
    </article>`,
	)
	.join('\n');
const options = catalogue
	.filter((s) => s.apercu === false)
	.map(
		(s) => `    <article class="option">
      <div class="vide">En option · pas d'aperçu</div>
      <h2><span>${s.numero}</span> ${echap(s.nom)}</h2>
      <p>${echap(s.accroche)}</p>
      <dl><dt>Pour</dt><dd>${echap(s.pour)}</dd><dt>Rendu</dt><dd>${echap(s.dimension)}</dd></dl>
    </article>`,
	)
	.join('\n');
const titre = contenu?.nom ? `${echap(contenu.nom)} : quel style ?` : 'Quel style pour le film ?';
writeFileSync(
	join(sortie, 'catalogue.html'),
	`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<style>
  :root { color-scheme: light dark; --fond: #f5f5f3; --carte: #ffffff; --encre: #141414; --doux: #62625f; --filet: rgba(0,0,0,0.09); }
  @media (prefers-color-scheme: dark) { :root { --fond: #121212; --carte: #1c1c1c; --encre: #f1f1ee; --doux: #a3a39f; --filet: rgba(255,255,255,0.1); } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fond); color: var(--encre); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 1400px; margin: 0 auto; padding: 40px 16px 64px; }
  h1 { font-size: 28px; margin: 0 0 6px; letter-spacing: -0.01em; }
  .sous { color: var(--doux); margin: 0 0 28px; }
  .grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr)); gap: 20px; }
  article { background: var(--carte); border: 1px solid var(--filet); border-radius: 14px; overflow: hidden; }
  video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; }
  h2 { font-size: 19px; margin: 14px 16px 4px; }
  h2 span { display: inline-block; min-width: 26px; color: var(--doux); font-variant-numeric: tabular-nums; }
  h2 em { font-style: normal; font-weight: 500; font-size: 13px; color: var(--doux); border: 1px solid var(--filet); border-radius: 999px; padding: 2px 9px; margin-left: 6px; vertical-align: 2px; white-space: nowrap; }
  p { margin: 0 16px 10px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 0 16px 16px; font-size: 14px; }
  dt { color: var(--doux); }
  dd { margin: 0; }
  .vide { aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; color: var(--doux); border-bottom: 1px dashed var(--filet); }
</style>
</head>
<body>
<main>
  <h1>${titre}</h1>
  <p class="sous">${mode === 'projet' ? `Le même contenu dans chaque style, aux couleurs de ${echap(daFilm.nom)}.` : 'Le même contenu dans chaque style, chacun dans sa palette.'} Réponds avec le numéro du style (ou deux numéros à mélanger).</p>
  <div class="grille">
${cartes}
${options}
  </div>
</main>
</body>
</html>
`,
);
console.log(`Rendu des aperçus : ${Math.round((Date.now() - debut) / 1000)} s`);
console.log(`Catalogue : ${join(sortie, 'catalogue.html')}`);
console.log(`À la suite : ${join(sortie, 'catalogue.mp4')}`);
