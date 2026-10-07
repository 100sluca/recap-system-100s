#!/usr/bin/env node
// carte : dessine la carte d'un projet avec le moteur Archify, à l'habillage du système.
//
//   node carte.mjs dessiner <type> <source.json> [--sortie <dossier>] [--repo-root <dépôt>] [--quality standard|showcase]
//   node carte.mjs habiller <entree.html> <sortie.html>
//   node carte.mjs installer | maj | doctor
//
// Le moteur (Archify, MIT) n'est jamais modifié : on lui donne un JSON préparé
// (preset editorial, langue fr), il valide, place, trace et vérifie dans un vrai
// navigateur ; on pose ensuite l'habillage de theme/ sur la page qu'il produit.
// Il n'est pas livré avec le skill : il est cloné au premier dessin (git) dans
// ~/.claude/recap-system-100s/archify/, un dossier que les mises à jour du skill
// ne touchent pas. Le navigateur : Chrome, Chromium, Edge ou Brave.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { trouverNavigateur } from '../recap-system-100s/navigateur.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const MOTEUR = path.join(os.homedir(), '.claude', 'recap-system-100s', 'archify');
const ARCHIFY = path.join(MOTEUR, 'archify', 'bin', 'archify.mjs');
const THEME = path.join(ICI, 'theme');
const DEPOT = 'https://github.com/tt-a1i/archify.git';
const TYPES = ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'];
const PRESET = 'editorial'; // la base que theme/100s.css habille
const POLICES = [
  ['Funnel Sans', 'funnel-sans.woff2', '300 800'],
  ['Funnel Display', 'funnel-display.woff2', '300 800'],
  ['Martian Mono', 'martian-mono.woff2', '100 800'],
  ['Geist Mono', 'geist-mono.woff2', '100 900'],
];

function arreter(message) {
  console.error(`carte : ${message}`);
  process.exit(1);
}

function options(args) {
  const opts = { libres: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) opts[args[i].slice(2)] = args[++i];
    else opts.libres.push(args[i]);
  }
  return opts;
}

function lireJson(fichier) {
  const texte = fs.readFileSync(fichier, 'utf8').replace(/^﻿/, '');
  try {
    return JSON.parse(texte);
  } catch (e) {
    arreter(`${fichier} n'est pas un JSON valide : ${e.message}`);
  }
}

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) arreter(`git ${args.join(' ')} a échoué :\n${r.stderr}`);
  return r.stdout.trim();
}

function versionMoteur() {
  try {
    return JSON.parse(fs.readFileSync(path.join(MOTEUR, 'archify', 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

function verifierMoteur() {
  if (!fs.existsSync(ARCHIFY)) arreter(`moteur absent (${ARCHIFY}). Lancer : node "${path.join(ICI, 'carte.mjs')}" installer`);
}

// ---------- habillage ----------

function habiller(html) {
  const preset = (html.match(/<html[^>]*\sdata-preset="([^"]*)"/) || [])[1];
  if (preset !== PRESET) {
    arreter(`cette page a été rendue avec le preset « ${preset} ». L'habillage 100s se pose sur « ${PRESET} » : redessiner depuis le JSON avec « dessiner ».`);
  }
  const polices = POLICES.map(([famille, fichier, poids]) => {
    const data = fs.readFileSync(path.join(THEME, 'fonts', fichier)).toString('base64');
    return `@font-face{font-family:'${famille}';font-weight:${poids};font-display:swap;src:url(data:font/woff2;base64,${data}) format('woff2');}`;
  }).join('');
  const css = fs.readFileSync(path.join(THEME, '100s.css'), 'utf8');
  const style = `<style id="carte-100s">${polices}\n${css}</style>`;
  const sansAncien = html.replace(/<style id="carte-100s">[\s\S]*?<\/style>/, '');
  if (!sansAncien.includes('</head>')) arreter('pas de </head> dans la page : ce n\'est pas une sortie Archify.');
  return sansAncien.replace('</head>', () => `${style}</head>`);
}

// ---------- commandes ----------

function dessiner(args) {
  const opts = options(args);
  const [type, source] = opts.libres;
  if (!TYPES.includes(type)) arreter(`type inconnu « ${type} ». Types : ${TYPES.join(', ')}.`);
  if (!source || !fs.existsSync(source)) arreter(`source introuvable : ${source}`);
  // Le moteur manque au premier dessin : on l'installe.
  if (!fs.existsSync(ARCHIFY)) installer();
  verifierMoteur();

  const candidat = lireJson(source);
  const meta = (candidat.meta ??= {});
  const nom = path.basename(source).replace(/\.json$/i, '');
  if (meta.visual_preset && meta.visual_preset !== PRESET) {
    console.log(`(meta.visual_preset « ${meta.visual_preset} » remplacé par « ${PRESET} », la base de l'habillage 100s)`);
  }
  meta.visual_preset = PRESET;
  meta.locale ??= 'fr';
  if (meta.locale.startsWith('fr') && !meta.translations) {
    // Libellés de l'interface (boutons, menus, aide) en français, fournis par Archify.
    meta.translations = lireJson(path.join(MOTEUR, 'archify', 'examples', 'locales', 'fr.json'));
  }
  const qualite = opts.quality || meta.quality_profile || 'showcase';
  meta.quality_profile = qualite;
  meta.output = `${nom}.html`;

  const travail = fs.mkdtempSync(path.join(os.tmpdir(), `carte-${nom}-`));
  fs.writeFileSync(path.join(travail, 'candidate.json'), JSON.stringify(candidat, null, 2));
  const finalize = [ARCHIFY, 'finalize', type, 'candidate.json', meta.output, '--quality', qualite, '--json'];
  if (opts['repo-root']) finalize.push('--repo-root', path.resolve(opts['repo-root']));
  // Archify cherche Chrome ou Chromium ; on lui donne aussi Edge ou Brave s'il n'a que ceux-là.
  const env = { ...process.env };
  if (!env.ARCHIFY_CHROME) {
    const navigateur = trouverNavigateur();
    if (navigateur) env.ARCHIFY_CHROME = navigateur;
  }
  const r = spawnSync(process.execPath, finalize, { cwd: travail, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });

  let recu = null;
  try {
    recu = JSON.parse(r.stdout.trim().split('\n').filter(Boolean).pop());
  } catch {
    // sortie non JSON : affichée telle quelle ci-dessous
  }
  if (r.status !== 0 || !recu?.ok) {
    console.error(`ÉCHEC de la vérification Archify (code ${r.status}). Corriger ${source} puis relancer.`);
    if (recu) {
      console.error(`Portes : ${JSON.stringify(recu.gates ?? {})}`);
      for (const d of recu.diagnostics ?? []) console.error(`- ${typeof d === 'string' ? d : JSON.stringify(d)}`);
      if (recu.evidence?.summaryReceipt) console.error(`Reçu détaillé : ${recu.evidence.summaryReceipt}`);
    } else {
      console.error((r.stdout || '') + (r.stderr || ''));
    }
    console.error(`Dossier de travail : ${travail}`);
    process.exit(1);
  }

  const sortie = path.resolve(opts.sortie || path.dirname(source));
  fs.mkdirSync(sortie, { recursive: true });
  const cible = path.join(sortie, `${nom}.html`);
  fs.writeFileSync(cible, habiller(fs.readFileSync(path.join(travail, meta.output), 'utf8')));

  console.log(`Carte prête : ${cible}`);
  console.log(`Type : ${type} · qualité ${qualite} · portes ${Object.entries(recu.gates).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`Moteur Archify ${versionMoteur()} · reçus dans ${travail}`);
  if (recu.update?.noticeRequired) {
    console.log(`Mise à jour du moteur disponible : ${recu.update.installedVersion} → ${recu.update.availableVersion}. La proposer à l'utilisateur (node carte.mjs maj), ne pas l'installer sans son accord.`);
  }
}

function habillerFichier(args) {
  const [entree, sortie] = options(args).libres;
  if (!entree || !sortie) arreter('usage : node carte.mjs habiller <entree.html> <sortie.html>');
  fs.writeFileSync(sortie, habiller(fs.readFileSync(entree, 'utf8')));
  console.log(`Page habillée : ${path.resolve(sortie)}`);
}

function installer() {
  if (fs.existsSync(path.join(MOTEUR, '.git'))) {
    console.log(`Moteur déjà installé (Archify ${versionMoteur()}). Pour le mettre à jour : node carte.mjs maj`);
    return;
  }
  fs.mkdirSync(path.dirname(MOTEUR), { recursive: true });
  console.log(`Installation du moteur Archify dans ${MOTEUR}…`);
  git(['clone', '--depth', '1', '--filter=blob:none', '--sparse', DEPOT, MOTEUR], path.dirname(MOTEUR));
  git(['sparse-checkout', 'set', 'archify'], MOTEUR);
  console.log(`Moteur installé : Archify ${versionMoteur()}`);
  doctor();
}

function maj() {
  verifierMoteur();
  const avant = versionMoteur();
  git(['fetch', '--depth', '1', 'origin', 'HEAD'], MOTEUR);
  git(['reset', '--hard', 'FETCH_HEAD'], MOTEUR);
  const apres = versionMoteur();
  console.log(avant === apres ? `Moteur déjà à jour (Archify ${apres}).` : `Moteur mis à jour : Archify ${avant} → ${apres}.`);
  console.log('Redessiner une carte connue pour vérifier que le thème tient toujours.');
}

function doctor() {
  verifierMoteur();
  const r = spawnSync(process.execPath, [ARCHIFY, 'doctor'], { encoding: 'utf8' });
  console.log(r.stdout.trim().split('\n').pop());
  const manquants = ['100s.css', ...POLICES.map(([, f]) => path.join('fonts', f))].filter((f) => !fs.existsSync(path.join(THEME, f)));
  console.log(manquants.length ? `Thème incomplet, manquent : ${manquants.join(', ')}` : 'Thème 100s complet.');
  if (r.status !== 0 || manquants.length) process.exit(1);
}

const [commande, ...reste] = process.argv.slice(2);
const commandes = { dessiner, habiller: habillerFichier, installer, maj, doctor };
if (!commandes[commande]) {
  console.log('usage : node carte.mjs dessiner <type> <source.json> [--sortie <dossier>] [--repo-root <dépôt>] [--quality standard|showcase]');
  console.log('        node carte.mjs habiller <entree.html> <sortie.html>');
  console.log('        node carte.mjs installer | maj | doctor');
  process.exit(commande ? 1 : 0);
}
commandes[commande](reste);
