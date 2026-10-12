// Le studio de doublage : l'utilisateur dit le pitch sur le film, sa voix enregistrée en même
// temps que le film défile. Une page locale montre la vidéo, le texte qui défile dessous (bande
// rythmo : chaque phrase passe sous la barre au moment de la dire) et la phrase en cours ; elle
// enregistre le micro calé sur l'image 0 du film. Rien ne sort de la machine.
//
//   node doublage.mjs <atelier> [--video <film sans voix .mp4>] [--port 3074] [--pas-ouvrir]
//
// Avant : PITCH.md validé, `voix.mjs prevoir` (le minutage prévu), le film fait sur p(i) et rendu
// sans voix (renders/film.mp4, copié une fois dans doublage/video.mp4 : il sert à toutes les prises).
// « Garder cette prise » range la prise dans doublage/prises/ et lance `voix.mjs importer --doublage`
// (public/voix/voix.wav + src/pitch.ts recalé sur la vraie voix). « Terminer » ferme le studio :
// l'outil s'arrête, et Claude refait planche et rendu.
import {execFile, execFileSync} from 'node:child_process';
import {copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {basename, join} from 'node:path';

const atelier = process.argv[2];
const arg = (nom, def) => {
	const i = process.argv.indexOf(`--${nom}`);
	return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def;
};
if (!atelier || !existsSync(atelier)) throw new Error('Usage : node doublage.mjs <atelier> [--video <film.mp4>] [--port 3074] [--pas-ouvrir]');

const dossier = join(atelier, 'doublage');
const prevu = join(dossier, 'prevu.json');
if (!existsSync(prevu)) throw new Error(`Pas de minutage prévu : lancer d'abord node voix.mjs prevoir ${atelier}`);
const video = join(dossier, 'video.mp4');
const source = arg('video', join(atelier, 'renders', 'film.mp4'));
if (arg('video') || !existsSync(video)) {
	if (!existsSync(source)) throw new Error(`Pas de film à doubler : ${source}. Rendre d'abord le film sans voix (rendre.mjs).`);
	copyFileSync(source, video);
}
const prises = join(dossier, 'prises');
mkdirSync(prises, {recursive: true});

const PORT = Number(arg('port', '3074'));
const projet = basename(atelier);
const page = readFileSync(join(import.meta.dirname, 'doublage', 'studio.html'), 'utf8').replaceAll('__PROJET__', projet);
const EXT = {'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3'};
let gardee = null;

const json = (res, code, objet) => {
	res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8'});
	res.end(JSON.stringify(objet));
};

const serveur = createServer((req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	if (req.method === 'GET' && url.pathname === '/') {
		res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
		return res.end(page);
	}
	if (req.method === 'GET' && url.pathname === '/prevu.json') {
		res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
		return res.end(readFileSync(prevu));
	}
	if (req.method === 'GET' && url.pathname === '/video.mp4') {
		// Avec les plages (Range) : sans elles, le navigateur ne sait pas revenir au début de la vidéo.
		const taille = statSync(video).size;
		const plage = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
		if (!plage) {
			res.writeHead(200, {'Content-Type': 'video/mp4', 'Content-Length': taille, 'Accept-Ranges': 'bytes'});
			return createReadStream(video).pipe(res);
		}
		const debut = plage[1] ? Number(plage[1]) : taille - Number(plage[2]);
		const fin = plage[1] && plage[2] ? Math.min(Number(plage[2]), taille - 1) : taille - 1;
		res.writeHead(206, {'Content-Type': 'video/mp4', 'Content-Length': fin - debut + 1, 'Content-Range': `bytes ${debut}-${fin}/${taille}`, 'Accept-Ranges': 'bytes'});
		return createReadStream(video, {start: debut, end: fin}).pipe(res);
	}
	if (req.method === 'POST' && url.pathname === '/prise') {
		const morceaux = [];
		req.on('data', (m) => morceaux.push(m));
		req.on('end', () => {
			const type = (req.headers['content-type'] || 'audio/webm').split(';')[0];
			const n = readdirSync(prises).filter((f) => f.startsWith('prise-') && !f.endsWith('.json')).length + 1;
			const fichier = join(prises, `prise-${n}.${EXT[type] || 'webm'}`);
			writeFileSync(fichier, Buffer.concat(morceaux));
			const decalage = Number(url.searchParams.get('decalage') || 0);
			writeFileSync(`${fichier}.json`, JSON.stringify({decalage, type, t: new Date().toISOString()}));
			console.log(`Prise ${n} reçue (${(Buffer.concat(morceaux).length / 1024).toFixed(0)} Ko, décalage ${decalage.toFixed(3)} s) : ${fichier}`);
			try {
				const sortie = execFileSync(
					process.execPath,
					[join(import.meta.dirname, 'voix.mjs'), 'importer', atelier, fichier, '--doublage', '--decalage', String(decalage)],
					{encoding: 'utf-8'},
				);
				gardee = n;
				console.log(sortie);
				json(res, 200, {ok: true, prise: n, sortie});
			} catch (e) {
				console.error(e.stderr || e.message);
				json(res, 500, {ok: false, erreur: String(e.stderr || e.message).slice(0, 2000)});
			}
		});
		return;
	}
	if (req.method === 'POST' && url.pathname === '/fin') {
		json(res, 200, {ok: true});
		console.log(gardee ? `Doublage terminé : la prise ${gardee} est la voix du film (public/voix/voix.wav, src/pitch.ts).` : 'Doublage fermé sans prise gardée.');
		setTimeout(() => process.exit(0), 300);
		return;
	}
	res.writeHead(404).end();
});

serveur.listen(PORT, '127.0.0.1', () => {
	const adresse = `http://localhost:${PORT}/`;
	console.log(`Studio de doublage : ${adresse}  (${projet}, film ${source})`);
	if (process.argv.includes('--pas-ouvrir')) return;
	if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', adresse]);
	else execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [adresse]);
});
