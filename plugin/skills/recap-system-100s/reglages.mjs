#!/usr/bin/env node
// Les réglages du système, propres à chaque utilisateur, hors de tout projet et de tout dépôt :
// ~/.claude/recap-system-100s/reglages.json. Aucun n'est obligatoire.
//
//   node reglages.mjs                    les montre
//   node reglages.mjs <clé> <valeur>     en change un ; une valeur vide ("") le retire
//
// Le même dossier garde aussi les présences des sessions (presence/), les réglages de l'overlay
// (overlay.json), le moteur des schémas (archify/) et le .env de la clé Gemini (copié de .env.example).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DOSSIER = path.join(os.homedir(), '.claude', 'recap-system-100s');
export const FICHIER = path.join(DOSSIER, 'reglages.json');
/** Le .env de la clé Gemini par défaut, copié du modèle .env.example livré à côté de ce script. */
export const ENV_GEMINI = path.join(DOSSIER, '.env');
const MODELE_ENV = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.example');

export const CLES = {
  fiches: "un dossier où recopier aussi la fiche et le lanceur de chaque projet, pour les lancer d'un double-clic (ex. ~/Desktop/Projets_Code-start)",
  banqueSon: 'ta banque de sons pour les vidéos : un dossier avec musique/ et, si tu veux, sound-effects/ et bruitages.json',
  musique: "une musique à suggérer (jamais imposée : le skill film varie la musique d'un film à l'autre, outils/musique.mjs)",
  ateliers: 'où créer les ateliers des vidéos (par défaut ~/recap-film)',
  envGemini: 'le fichier .env où coller ta clé Gemini, pour la voix off IA des vidéos (par défaut ~/.claude/recap-system-100s/.env, copié de .env.example ; le chemin, jamais la clé)',
  voix: 'la voix IA par défaut des vidéos, une voix Gemini (par défaut Achird ; ex. Charon, Sulafat, Kore)',
  musiqueSousVoix: 'de combien de dB la musique passe sous la voix off dans les vidéos (par défaut 18 ; plus grand = musique plus discrète)',
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

/** Le fichier .env de la clé Gemini : le réglage envGemini, sinon ~/.claude/recap-system-100s/.env. */
export const fichierEnvGemini = () => lireReglages().envGemini || ENV_GEMINI;

/** La clé Gemini écrite dans ce fichier (GEMINI_API_KEY=…), ou null. Jamais affichée. */
export function cleGemini() {
  const f = fichierEnvGemini();
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, 'utf8').match(/^[ \t]*(?:GEMINI_API_KEY|GOOGLE_API_KEY)[ \t]*=[ \t]*["']?([^"'\r\n#]*)/m);
  return m?.[1].trim() || null;
}

/** Crée le .env de la clé depuis le modèle s'il n'existe pas encore ; rend son chemin. */
export function preparerEnvGemini() {
  const f = fichierEnvGemini();
  if (!fs.existsSync(f) && fs.existsSync(MODELE_ENV)) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.copyFileSync(MODELE_ENV, f);
  }
  return f;
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
    const v = k === 'envGemini' ? fichierEnvGemini() : r[k];
    let etat = !v ? '(pas réglé)' : k === 'voix' || k === 'musiqueSousVoix' || fs.existsSync(v) || (k === 'musique' && r.banqueSon && fs.existsSync(path.join(r.banqueSon, v))) ? v : `${v}  ← introuvable`;
    if (k === 'envGemini') etat = !fs.existsSync(v) ? `${v}  ← pas encore créé : /recap-system-100s -installer` : cleGemini() ? `${v}  (clé présente)` : `${v}  ← colle ta clé après GEMINI_API_KEY=`;
    console.log(`- ${k.padEnd(9)} ${etat}\n  ${sens}`);
  }
}
