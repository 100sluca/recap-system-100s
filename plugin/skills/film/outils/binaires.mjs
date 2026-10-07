// Les programmes dont les outils du film ont besoin, sans rien installer de plus : Remotion
// apporte son propre ffmpeg (dans @remotion/compositor-<système>) et son propre Chrome sans
// fenêtre (node_modules/.remotion), une fois `npm install` fait dans l'atelier. À défaut, ceux du
// système.
import {existsSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';

const exe = process.platform === 'win32' ? '.exe' : '';

function compositeur(atelier) {
	const dossier = atelier && join(atelier, 'node_modules', '@remotion');
	if (!dossier || !existsSync(dossier)) return null;
	const nom = readdirSync(dossier).find((n) => n.startsWith('compositor-'));
	return nom ? join(dossier, nom) : null;
}

/** Le chemin de ffmpeg (ou ffprobe) : celui de Remotion dans l'atelier, sinon celui du PATH. */
export function binaire(atelier, nom = 'ffmpeg') {
	const c = compositeur(atelier);
	const chemin = c && join(c, `${nom}${exe}`);
	return chemin && existsSync(chemin) ? chemin : nom;
}

/** L'environnement pour lancer un binaire de Remotion : ses bibliothèques sont à côté de lui. */
export function environnement(chemin) {
	if (!chemin.includes('compositor-')) return process.env;
	const d = dirname(chemin);
	return {...process.env, LD_LIBRARY_PATH: [d, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':'), DYLD_LIBRARY_PATH: [d, process.env.DYLD_LIBRARY_PATH].filter(Boolean).join(':')};
}

/** Le Chrome sans fenêtre téléchargé par Remotion, cherché depuis un dossier de l'atelier. */
export function chromeRemotion(depuis) {
	for (let d = depuis; d && dirname(d) !== d; d = dirname(d)) {
		const racine = join(d, 'node_modules', '.remotion', 'chrome-headless-shell');
		if (!existsSync(racine)) continue;
		const pile = [racine];
		while (pile.length) {
			const ici = pile.pop();
			for (const e of readdirSync(ici, {withFileTypes: true})) {
				if (e.isDirectory()) pile.push(join(ici, e.name));
				else if (e.name === `chrome-headless-shell${exe}`) return join(ici, e.name);
			}
		}
	}
	return null;
}
