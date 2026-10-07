#!/usr/bin/env node
// Vérifie que FABRICATION.md suit le code : chaque dépendance déclarée dans le dépôt
// (package.json, requirements*.txt, pyproject.toml) doit y être citée, et la fiche ne doit
// pas être plus ancienne que le dernier changement d'un fichier de dépendances.
//
//   node verifier.mjs <racine du dépôt>
//
// Code de sortie 0 : la fiche est à jour. 1 : il y a des trous, listés à l'écran.
// Une correspondance de nom ne prouve pas que la ligne est juste : c'est une liste de
// contrôle, la relecture reste à faire.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const IGNORES = new Set(['node_modules', '.git', '.next', 'out', 'dist', 'build', '.venv', 'venv',
  '__pycache__', '.wrangler', '.turbo', 'coverage', '.cache', 'recap-system-100s', '__recap-system-100s']);

const racine = path.resolve(process.argv[2] || '.');
// La fiche vit dans le dossier du récap ; un projet qui ne suit pas encore le système la garde à sa racine.
const fiche = [path.join(racine, '__recap-system-100s', '3-fabrication', 'FABRICATION.md'), path.join(racine, 'recap-system-100s', 'FABRICATION.md'), path.join(racine, 'FABRICATION.md')]
  .find((f) => fs.existsSync(f));
if (!fiche) {
  console.log(`Pas de FABRICATION.md dans ${racine} (ni dans __recap-system-100s/3-fabrication/).`);
  process.exit(1);
}
const texte = fs.readFileSync(fiche, 'utf8').toLowerCase();

function manifestes(dossier, profondeur = 0, trouves = []) {
  if (profondeur > 4) return trouves;
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (IGNORES.has(entree.name)) continue;
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) manifestes(chemin, profondeur + 1, trouves);
    else if (entree.name === 'package.json' || /^requirements.*\.txt$/.test(entree.name)
      || entree.name === 'pyproject.toml') trouves.push(chemin);
  }
  return trouves;
}

function dependances(fichier) {
  const nom = path.basename(fichier);
  const contenu = fs.readFileSync(fichier, 'utf8');
  if (nom === 'package.json') {
    const pkg = JSON.parse(contenu);
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      .filter((d) => !d.startsWith('@types/'));
  }
  if (nom.endsWith('.txt')) {
    return contenu.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim())
      .filter((l) => l && !l.startsWith('-'))
      .map((l) => l.split(/[<>=!~;\[ ]/)[0]);
  }
  // pyproject.toml : la liste « dependencies = [ … ] » de [project], lue simplement.
  const bloc = contenu.match(/^dependencies\s*=\s*\[([\s\S]*?)\]/m);
  return bloc ? [...bloc[1].matchAll(/["']([A-Za-z0-9_.-]+)/g)].map((m) => m[1]) : [];
}

const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Un nom cité comme mot entier (« cn » ne doit pas trouver « scénario »), avec ou sans espace
// entre ses morceaux (« tailwindcss » trouve « Tailwind CSS »).
const mot = (c) => new RegExp(`(^|[^a-z0-9])${echappe(c).replace(/[-_ ]/g, '[-_ ]?')}($|[^a-z0-9])`).test(texte)
  || (c.length >= 6 && texte.replace(/[\s_-]/g, '').includes(c.replace(/[\s_-]/g, '')));

function citee(dep) {
  const nom = dep.toLowerCase();
  const sansPortee = nom.replace(/^@[^/]+\//, '');
  const portee = nom.startsWith('@') ? nom.slice(1).split('/')[0] : '';
  const candidats = [nom, sansPortee, portee];
  const premier = (portee || sansPortee).split(/[-_.]/)[0];
  if (premier.length >= 6) candidats.push(premier);
  return candidats.filter(Boolean).some(mot);
}

function dateGit(fichier) {
  try {
    return execFileSync('git', ['-C', racine, 'log', '-1', '--format=%cs', '--', path.relative(racine, fichier)],
      { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const trous = [];
const lus = manifestes(racine);
let total = 0;
for (const fichier of lus) {
  const deps = dependances(fichier);
  total += deps.length;
  const absentes = deps.filter((d) => !citee(d));
  if (absentes.length) trous.push(`${path.relative(racine, fichier)} : ${absentes.join(', ')}`);
}

// La date de la fiche (« Mis à jour le JJ/MM/AAAA ») contre le dernier commit d'un manifeste.
const date = fs.readFileSync(fiche, 'utf8').match(/Mis à jour le (\d{2})\/(\d{2})\/(\d{4})/);
const dateFiche = date ? `${date[3]}-${date[2]}-${date[1]}` : '';
const plusRecent = lus.map(dateGit).filter(Boolean).sort().pop() || '';
if (!dateFiche) trous.push('date de mise à jour introuvable (« Mis à jour le JJ/MM/AAAA » en tête de fiche)');
else if (plusRecent && plusRecent > dateFiche) {
  trous.push(`un fichier de dépendances a changé le ${plusRecent}, après la fiche (${dateFiche}) : relire la stack`);
}

console.log(`${lus.length} fichier(s) de dépendances lu(s), ${total} dépendance(s).`);
if (!trous.length) {
  console.log('FABRICATION.md cite chaque dépendance et date d\'après le dernier changement de stack.');
  process.exit(0);
}
console.log('À compléter dans FABRICATION.md :');
for (const t of trous) console.log(`- ${t}`);
process.exit(1);
