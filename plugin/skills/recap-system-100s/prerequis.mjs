#!/usr/bin/env node
// Vérifie ce dont le système a besoin sur cette machine, et prépare ce qui peut l'être sans rien
// demander. Lancé par /recap-system-100s -installer.
//
//   node prerequis.mjs              le bilan, avec la commande d'installation de chaque manque
//   node prerequis.mjs --preparer   et prépare : dossier des réglages, moteur des schémas (Archify)
//
// Code de sortie 0 : tout l'indispensable est là. 1 : il manque quelque chose d'indispensable.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { trouverNavigateur } from './navigateur.mjs';
import { DOSSIER, FICHIER, lireReglages } from './reglages.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const preparer = process.argv.includes('--preparer');
const OS = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';

const lancer = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0 ? (r.stdout || r.stderr || '').trim() : null;
};
const installer = (commandes) => commandes[OS];

const lignes = [];
let indispensableManquant = false;
function noter(nom, ok, detail, pourQuoi, commandes, indispensable = false) {
  if (!ok && indispensable) indispensableManquant = true;
  lignes.push({ nom, ok, detail, pourQuoi, commande: ok ? '' : installer(commandes) || '', indispensable });
}

// Node 20.11 ou plus : tous les scripts (import.meta.dirname, fetch, WebSocket).
const [maj, min] = process.versions.node.split('.').map(Number);
noter('Node.js ≥ 20.11', maj > 20 || (maj === 20 && min >= 11), `v${process.versions.node}`, 'tous les scripts', {
  windows: 'winget install OpenJS.NodeJS.LTS', mac: 'brew install node', linux: 'https://nodejs.org (ou nvm install --lts)',
}, true);

// git : la fraîcheur des pièces se mesure sur l'historique, et le moteur des schémas se clone.
const git = lancer('git', ['--version']);
noter('git', Boolean(git), git || 'introuvable', 'la fraîcheur des pièces, le moteur des schémas', {
  windows: 'winget install Git.Git', mac: 'xcode-select --install', linux: 'sudo apt install git',
}, true);

// Un navigateur Chromium : Archify vérifie chaque schéma dedans ; les captures d'un site aussi.
const navigateur = trouverNavigateur();
noter('Chrome, Chromium, Edge ou Brave', Boolean(navigateur), navigateur || 'introuvable', 'vérifier les schémas (4), capturer un site (5)', {
  windows: 'winget install Google.Chrome', mac: 'brew install --cask google-chrome', linux: 'sudo apt install chromium',
});

// npm : la vidéo installe Remotion dans son atelier (il apporte son propre Chrome et son ffmpeg).
const npm = lancer('npm', ['--version']);
noter('npm', Boolean(npm), npm ? `v${npm}` : 'introuvable', 'la vidéo (5) : Remotion, son Chrome et son ffmpeg', {
  windows: 'livré avec Node.js', mac: 'livré avec Node.js', linux: 'livré avec Node.js',
});

// L'overlay de l'écran : rien sous Windows (PowerShell et WPF), Python 3 avec tkinter ailleurs.
if (OS === 'windows') {
  noter("Overlay de l'écran", true, 'PowerShell et WPF, déjà dans Windows', 'option -overlay', {});
} else {
  const tk = lancer('python3', ['-c', 'import tkinter; print(tkinter.TkVersion)']);
  noter("Python 3 + tkinter (overlay)", Boolean(tk), tk ? `Tk ${tk}` : 'introuvable', 'option -overlay seulement', {
    mac: 'brew install python-tk', linux: 'sudo apt install python3-tk',
  });
}

// Le moteur des schémas, et les réglages.
const archify = path.join(DOSSIER, 'archify', 'archify', 'bin', 'archify.mjs');
if (preparer) {
  fs.mkdirSync(path.join(DOSSIER, 'presence'), { recursive: true });
  if (!fs.existsSync(FICHIER)) fs.writeFileSync(FICHIER, '{}\n', 'utf8');
  if (!fs.existsSync(archify) && git) {
    const r = spawnSync(process.execPath, [path.join(ICI, '..', 'carte', 'carte.mjs'), 'installer'], { encoding: 'utf8' });
    if (r.status !== 0) console.error((r.stdout || '') + (r.stderr || ''));
  }
}
noter('Moteur des schémas (Archify)', fs.existsSync(archify), fs.existsSync(archify) ? path.dirname(path.dirname(path.dirname(archify))) : 'pas encore installé',
  'les schémas (4)', { windows: '/recap-system-100s -installer', mac: '/recap-system-100s -installer', linux: '/recap-system-100s -installer' });

const reg = lireReglages();
noter('Banque de sons (réglage banqueSon)', Boolean(reg.banqueSon && fs.existsSync(reg.banqueSon)), reg.banqueSon || 'pas réglée : chaque vidéo demandera sa musique',
  'la musique et les bruitages des vidéos (facultatif)', {});

console.log(`recap-system-100s · prérequis sur ${OS}\n`);
for (const l of lignes) {
  console.log(`${l.ok ? '✓' : l.indispensable ? '✗' : '·'}  ${l.nom.padEnd(36)} ${l.detail}`);
  if (!l.ok) console.log(`   pour : ${l.pourQuoi}${l.commande ? `\n   installer : ${l.commande}` : ''}`);
}
console.log(`\n✓ présent · ✗ indispensable et absent · · facultatif ou pas encore là\nRéglages : ${FICHIER}`);
process.exit(indispensableManquant ? 1 : 0);
