#!/usr/bin/env node
// Cette copie d'un skill est-elle la version installée du plugin ?
//
//   node version.mjs <skill>          ex. node version.mjs film
//
// Une session de Claude Code garde la version du plugin chargée à son ouverture, même après une
// mise à jour : une session ouverte le 09/10/2026 a fait le 12/10 un film avec la version 1.0.0
// (ni choix du style, ni étape de la DA), alors que la 1.2.0 était installée. Chaque skill lance
// donc ce script en premier. S'il répond « PÉRIMÉE », Claude lit le SKILL.md qu'il indique et
// prend ses outils à la place des siens : pas besoin de rouvrir la session.
//
// La version de cette copie : le plugin.json deux dossiers au-dessus (copie du cache des plugins).
// Une copie sans plugin.json (~/.claude/skills/<skill>, recopiée à la main) est comparée à la
// version installée par le contenu de son SKILL.md. Plugin pas installé : rien à dire.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = process.argv[2] || 'recap-system-100s';
const ici = path.dirname(fileURLToPath(import.meta.url));
const maCopie = path.join(ici, '..', skill);
const config = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const lire = (f) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
};

const installe = lire(path.join(config, 'plugins', 'installed_plugins.json'))?.plugins?.['recap-system-100s@recap-system-100s']?.[0];
if (!installe?.installPath) {
  console.log('Version : plugin recap-system-100s pas installé, rien à comparer.');
  process.exit(0);
}
const laSienne = path.join(installe.installPath, 'skills', skill);
const maVersion = lire(path.join(ici, '..', '..', '.claude-plugin', 'plugin.json'))?.version ?? null;

const nombres = (v) => String(v).split('.').map((x) => Number(x) || 0);
const plusAncienne = (a, b) => {
  const [x, y] = [nombres(a), nombres(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0);
  return false;
};
const contenu = (d) => {
  try {
    return fs.readFileSync(path.join(d, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
};

const perimee = maVersion
  ? plusAncienne(maVersion, installe.version)
  : path.resolve(maCopie) !== path.resolve(laSienne) && contenu(laSienne) !== null && contenu(maCopie) !== contenu(laSienne);

if (perimee) {
  console.log(`PÉRIMÉE : cette session a chargé ${maVersion ? `la version ${maVersion}` : 'une copie différente'} du skill ${skill}, la version ${installe.version} est installée.`);
  console.log(`Lire et suivre ${path.join(laSienne, 'SKILL.md')} à la place de celui-ci ;`);
  console.log(`ses outils sont dans ${laSienne} (c'est lui que « \${CLAUDE_SKILL_DIR} » désigne désormais).`);
  console.log("Dire en une ligne à l'utilisateur que la session tournait sur une ancienne version, et qu'elle suit maintenant la bonne.");
} else {
  console.log(`Version : ${maVersion ?? installe.version}, à jour.`);
}
