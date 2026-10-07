#!/usr/bin/env node
// Les réglages du système, propres à chaque utilisateur, hors de tout projet et de tout dépôt :
// ~/.claude/recap-system-100s/reglages.json. Aucun n'est obligatoire.
//
//   node reglages.mjs                    les montre
//   node reglages.mjs <clé> <valeur>     en change un ; une valeur vide ("") le retire
//
// Le même dossier garde aussi les présences des sessions (presence/), les réglages de l'overlay
// (overlay.json) et le moteur des schémas (archify/).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DOSSIER = path.join(os.homedir(), '.claude', 'recap-system-100s');
export const FICHIER = path.join(DOSSIER, 'reglages.json');

export const CLES = {
  fiches: "un dossier où recopier aussi la fiche et le lanceur de chaque projet, pour les lancer d'un double-clic (ex. ~/Desktop/Projets_Code-start)",
  banqueSon: 'ta banque de sons pour les vidéos : un dossier avec musique/ et, si tu veux, sound-effects/ et bruitages.json',
  musique: 'la musique par défaut des vidéos, un fichier (absolu, ou relatif à banqueSon)',
  ateliers: 'où créer les ateliers des vidéos (par défaut ~/recap-film)',
};

const deplier = (v) => (typeof v === 'string' && /^~(?=$|[\\/])/.test(v) ? path.join(os.homedir(), v.slice(1)) : v);

export function lireReglages() {
  try {
    const brut = JSON.parse(fs.readFileSync(FICHIER, 'utf8').replace(/^﻿/, ''));
    return Object.fromEntries(Object.entries(brut).map(([k, v]) => [k, deplier(v)]));
  } catch {
    return {};
  }
}

function ecrire(cle, valeur) {
  let brut = {};
  try { brut = JSON.parse(fs.readFileSync(FICHIER, 'utf8').replace(/^﻿/, '')); } catch { /* premier réglage */ }
  if (valeur) brut[cle] = valeur;
  else delete brut[cle];
  fs.mkdirSync(DOSSIER, { recursive: true });
  fs.writeFileSync(FICHIER, `${JSON.stringify(brut, null, 2)}\n`, 'utf8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cle, valeur] = process.argv.slice(2);
  if (cle) {
    if (!(cle in CLES)) {
      console.error(`Clé inconnue « ${cle} ». Clés : ${Object.keys(CLES).join(', ')}.`);
      process.exit(1);
    }
    ecrire(cle, valeur ?? '');
  }
  const r = lireReglages();
  console.log(`Réglages : ${FICHIER}`);
  for (const [k, sens] of Object.entries(CLES)) {
    const v = r[k];
    const etat = !v ? '(pas réglé)' : fs.existsSync(v) || (k === 'musique' && r.banqueSon && fs.existsSync(path.join(r.banqueSon, v))) ? v : `${v}  ← introuvable`;
    console.log(`- ${k.padEnd(9)} ${etat}\n  ${sens}`);
  }
}
