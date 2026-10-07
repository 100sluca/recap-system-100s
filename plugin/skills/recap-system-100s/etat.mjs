#!/usr/bin/env node
// Tableau de bord du mode recap-system-100s pour un projet : ses 5 pièces, leur fraîcheur de 0 à 100,
// et la prochaine action. La fraîcheur baisse quand le code que la pièce décrit change après elle :
// chaque commit compte, chaque fichier modifié pas encore commité aussi.
//
//   node etat.mjs [racine du projet]                  le tableau, sans rien modifier
//   node etat.mjs [racine du projet] --ecrire         allume le mode s'il ne l'est pas (dossier __recap-system-100s/,
//                                                     ses 5 sous-dossiers, bloc du CLAUDE.md) et réécrit sa page d'entrée
//   node etat.mjs [racine du projet] --ecrire --nom "<nom>"   et donne au projet son nom d'usage
//   node etat.mjs [racine du projet] --json           le même état en JSON (pour le bandeau et l'overlay)
//
// La racine : le dépôt git du dossier donné ; hors git, le premier dossier parent qui a un
// __recap-system-100s/ ; sinon le dossier lui-même.
//
// Code de sortie 0 : tout est à jour pour la phase en cours. 1 : au moins une pièce en retard ou manquante.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { lireReglages } from './reglages.mjs';

const RECAP = '__recap-system-100s';
const ANCIEN_RECAP = 'recap-system-100s';
const ICI = path.dirname(fileURLToPath(import.meta.url));
// Le vérificateur de la fiche fabrication : le skill voisin, installé avec celui-ci.
const VERIFIER = path.join(ICI, '..', 'fabrication', 'verifier.mjs');
// Le dossier où l'utilisateur garde aussi les fiches pour le double-clic, s'il en a un (réglage « fiches »).
const FICHES = lireReglages().fiches || '';
const SECRETS = /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY/;

// Les fichiers que chaque pièce décrit : leur changement fait baisser sa barre.
const SURVEILLES = {
  demarrer: [':(glob)**/package.json', ':(glob)**/pyproject.toml', ':(glob)**/requirements*.txt', ':(glob)**/*.bat',
    ':(glob)**/docker-compose*.yml', ':(glob)**/compose*.yml', ':(glob)**/Makefile', ':(glob)**/vite.config.*',
    ':(glob)**/next.config.*', ':(glob)**/wrangler.*', '.claude/launch.json', '.env.example', `:(exclude)${RECAP}`],
  ressources: ['.env.example', ':(glob)**/.dev.vars.example', ':(glob).github/workflows/**', ':(glob)**/wrangler.*',
    ':(glob)**/vercel.json', ':(glob)**/netlify.toml', ':(glob)**/docker-compose*.yml', ':(glob)supabase/**', 'firebase.json', `:(exclude)${RECAP}`],
  fabrication: [':(glob)**/package.json', ':(glob)**/requirements*.txt', ':(glob)**/pyproject.toml', ':(glob)**/components.json',
    ':(glob)**/.node-version', ':(glob)**/go.mod', ':(glob)**/Cargo.toml', `:(exclude)${RECAP}`],
  // Les schémas et la vidéo décrivent tout le code.
  tout: ['.', `:(exclude)${RECAP}`, `:(exclude)${ANCIEN_RECAP}`, ':(exclude)docs', ':(glob,exclude)**/*.md'],
};
const PIECES = [
  { id: 'demarrer', numero: 1, nom: 'Démarrer', dossier: '1-demarrer', commande: '-sc' },
  { id: 'ressources', numero: 2, nom: 'Ressources', dossier: '2-ressources', commande: '-r' },
  { id: 'fabrication', numero: 3, nom: 'Fabrication', dossier: '3-fabrication', commande: '-f' },
  { id: 'archi', numero: 4, nom: 'Archi', dossier: '4-archi', commande: '-a' },
  { id: 'video', numero: 5, nom: 'Vidéo', dossier: '5-video', commande: '-v' },
];

const args = process.argv.slice(2);
const ecrire = args.includes('--ecrire');
const enJson = args.includes('--json');
const iNom = args.indexOf('--nom');
const nouveauNom = iNom >= 0 ? (args[iNom + 1] || '').trim() : '';
const libres = args.filter((a, i) => !a.startsWith('--') && !(iNom >= 0 && i === iNom + 1));

function git(gitArgs, cwd = racine) {
  try {
    return execFileSync('git', ['-C', cwd, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const depart = path.resolve(libres[0] || '.');
const haut = git(['rev-parse', '--show-toplevel'], depart);
function parentEnMode(dossier) {
  for (let d = dossier; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, RECAP))) return d;
    if (path.dirname(d) === d) return null;
  }
}
const racine = haut ? path.resolve(haut) : parentEnMode(depart) || depart;
const recap = path.join(racine, RECAP);
const enGit = Boolean(haut);
const tete = enGit ? git(['log', '-1', '--format=%h %cs']) : '';
const lire = (f) => (f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
const fr = (iso) => (iso ? iso.split('-').reverse().join('/') : '?');
const rel = (f) => path.relative(recap, f).replace(/\\/g, '/');
const existe = (...morceaux) => fs.existsSync(path.join(...morceaux));

// Combien le code surveillé a bougé depuis une pièce : commits depuis son commit (ou sa date),
// plus les fichiers modifiés pas encore commités.
function changements(chemins, depuis) {
  if (!enGit || !depuis) return { commits: 0, encours: 0 };
  const plage = depuis.commit ? [`${depuis.commit}..HEAD`] : [`--since=${depuis.date}T23:59:59`, 'HEAD'];
  const commits = Number(git(['rev-list', '--count', ...plage, '--', ...chemins]) || 0);
  const encours = git(['status', '--porcelain', '--', ...chemins]).split(/\r?\n/).filter(Boolean).length;
  return { commits, encours };
}
const score = ({ commits, encours }) => Math.max(10, 100 - 12 * commits - 4 * encours);
const resume = ({ commits, encours }) => [commits && `${commits} commit(s)`, encours && `${encours} fichier(s) en cours`]
  .filter(Boolean).join(' + ');

// Ce qu'une pièce dit d'elle-même : « code au commit `abc1234` » ou « Mis à jour le JJ/MM/AAAA ».
function reperes(texte) {
  const commit = texte?.match(/commit `([0-9a-f]{7,40})`/)?.[1] || '';
  const d = texte?.match(/Mis à jour le (\d{2})\/(\d{2})\/(\d{4})/);
  return { commit: commit && git(['rev-parse', '--verify', '--quiet', `${commit}^{commit}`]) ? commit : '', date: d ? `${d[3]}-${d[2]}-${d[1]}` : '' };
}

// Une pièce se cherche à sa place, puis à ses anciennes places (signalées « à déplacer »).
function trouve(...candidats) {
  for (const [i, c] of candidats.entries()) if (fs.existsSync(c)) return { chemin: c, ancien: i > 0 };
  return null;
}

// Le bloc du CLAUDE.md : c'est lui qui allume le mode et fait tenir le récap à jour entre deux commandes.
const fichierClaude = path.join(racine, 'CLAUDE.md');
let claudeFichier = [fichierClaude, path.join(racine, '.claude', 'CLAUDE.md')].find((f) => lire(f)?.includes('recap-system-100s:debut'));
let claude = claudeFichier ? lire(claudeFichier) : null;
const actif = Boolean(claude) || existe(racine, RECAP);
const phase = claude?.match(/^Phase : (.+)$/m)?.[1].trim() || '';
const termine = /termin/i.test(phase);

// Le nom d'usage du projet par défaut : le name de son package.json, sinon son dossier.
function nomParDefaut() {
  try {
    const n = JSON.parse(lire(path.join(racine, 'package.json')) || '{}').name;
    if (n && typeof n === 'string') return n.replace(/^@[^/]+\//, '');
  } catch { /* pas de package.json lisible */ }
  return path.basename(racine);
}

if (ecrire) {
  for (const p of PIECES) fs.mkdirSync(path.join(recap, p.dossier), { recursive: true });
  if (!claude) {
    const bloc = lire(path.join(ICI, 'bloc-CLAUDE.md'))?.replace('{{NOM}}', () => nouveauNom || nomParDefaut());
    const avant = lire(fichierClaude);
    if (bloc) {
      claude = avant ? `${avant.replace(/\s*$/, '')}\n\n${bloc}` : bloc;
      fs.writeFileSync(fichierClaude, claude, 'utf8');
      claudeFichier = fichierClaude;
    }
  } else if (nouveauNom) {
    claude = /^Nom : .*$/m.test(claude)
      ? claude.replace(/^Nom : .*$/m, () => `Nom : ${nouveauNom}`)
      : claude.replace(/^(Phase : .*)$/m, (l) => `Nom : ${nouveauNom}\n${l}`);
    fs.writeFileSync(claudeFichier, claude, 'utf8');
  }
}

const etats = [];
// Le nom d'usage du projet, dans l'ordre : la ligne « Nom : » du bloc du CLAUDE.md (réglée avec
// --nom), le début de la première ligne de sa fiche (« Mon projet : … »), son package.json, son dossier.
let nomProjet = claude?.match(/^Nom : (.+)$/m)?.[1].trim() || '';
const ajoute = (piece, etat, scoreValeur, detail, action = '', lien = '') =>
  etats.push({ ...piece, etat, score: scoreValeur, detail, action, lien });

// 1. Démarrer : la fiche et le lanceur dans 1-demarrer/, et leur copie dans le dossier des fiches
// de l'utilisateur s'il en a un (réglage « fiches »).
{
  const p = PIECES[0];
  const normalise = (s) => s.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  const LANCEUR = /demarrer\.(bat|cmd|command|sh)$/i;
  const dossierProjet = [path.join(recap, p.dossier), path.join(racine, ANCIEN_RECAP, 'demarrer')].find((d) => fs.existsSync(d));
  const ficheProjet = dossierProjet && fs.readdirSync(dossierProjet).find((n) => n.endsWith('readme.txt'));
  const texteProjet = ficheProjet ? lire(path.join(dossierProjet, ficheProjet)) : null;
  // La copie pour le double-clic : un dossier des fiches dont la fiche cite le chemin du projet en entier
  // (celui d'un dossier parent ne doit pas trouver la fiche d'un sous-projet).
  let copie = null;
  if (FICHES && fs.existsSync(FICHES)) {
    const cible = new RegExp(`${normalise(racine).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![/\\w.-])`);
    for (const d of fs.readdirSync(FICHES, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith('__')) continue;
      const ici = path.join(FICHES, d.name);
      for (const f of fs.readdirSync(ici).filter((n) => n.endsWith('readme.txt'))) {
        const texte = fs.readFileSync(path.join(ici, f), 'utf8');
        if (cible.test(normalise(texte))) copie = { dossier: ici, texte, nom: d.name };
      }
    }
  }
  const texte = texteProjet ?? copie?.texte;
  if (!nomProjet && texte) nomProjet = texte.split(/\r?\n/)[0].split(/ : | \(| — /)[0].trim();
  const lien = ficheProjet ? rel(path.join(dossierProjet, ficheProjet)) : '';
  if (!texte) {
    ajoute(p, 'manque', 0, 'aucune fiche ni lanceur pour ce projet', '/recap-system-100s -sc', lien);
  } else {
    const m = texte.match(/Last update date : (\d{4})_(\d{2})_(\d{2})/);
    const ch = changements(SURVEILLES.demarrer, m && { date: `${m[1]}-${m[2]}-${m[3]}` });
    const lanceur = fs.readdirSync(dossierProjet || copie.dossier).some((n) => LANCEUR.test(n));
    if (!texteProjet) ajoute(p, 'retard', 60, `fiche dans ${copie.nom}, pas dans ${p.dossier}/`, '/recap-system-100s -sc', lien);
    else if (!dossierProjet.startsWith(recap)) ajoute(p, 'deplacer', 60, `fiche dans l'ancien dossier ${ANCIEN_RECAP}/demarrer/`, `déplacer dans ${RECAP}/${p.dossier}/`, lien);
    else if (!lanceur) ajoute(p, 'retard', 40, `pas de lanceur dans ${p.dossier}/`, '/recap-system-100s -sc', lien);
    else if (copie && copie.texte.replace(/\r/g, '') !== texteProjet.replace(/\r/g, '')) ajoute(p, 'retard', 70, `la copie de ${copie.nom} diffère de la fiche du projet`, '/recap-system-100s -sc', lien);
    else if (FICHES && !copie) ajoute(p, 'retard', 80, `pas de copie dans le dossier des fiches (${path.basename(FICHES)})`, '/recap-system-100s -sc', lien);
    else {
      const s = score(ch);
      ajoute(p, s === 100 ? 'ok' : 'retard', s, s === 100 ? `à jour (${fr(m && `${m[1]}-${m[2]}-${m[3]}`)})` : `${resume(ch)} sur les scripts ou ports depuis la fiche`,
        s === 100 ? '' : '/recap-system-100s -sc', lien);
    }
  }
}
if (!nomProjet) nomProjet = nomParDefaut();

// 2. Ressources.
{
  const p = PIECES[1];
  const f = trouve(path.join(recap, p.dossier, 'RESSOURCES.md'), path.join(racine, ANCIEN_RECAP, 'RESSOURCES.md'), path.join(racine, 'RESSOURCES.md'));
  if (!f) {
    ajoute(p, 'manque', 0, 'pas de RESSOURCES.md', '/recap-system-100s -r');
  } else {
    const texte = lire(f.chemin);
    const secret = texte.match(SECRETS);
    const ch = changements(SURVEILLES.ressources, reperes(texte));
    const s = score(ch);
    if (secret) ajoute(p, 'retard', 10, `motif de secret trouvé : ${secret[0].slice(0, 6)}…`, 'retirer la valeur, garder le nom', rel(f.chemin));
    else if (f.ancien) ajoute(p, 'deplacer', s, `à déplacer dans ${RECAP}/${p.dossier}/ (aujourd'hui : ${path.relative(racine, f.chemin).replace(/\\/g, '/')})`, 'déplacer', rel(f.chemin));
    else ajoute(p, s === 100 ? 'ok' : 'retard', s, s === 100 ? `à jour (${fr(reperes(texte).date)})` : `${resume(ch)} sur la configuration depuis la fiche`,
      s === 100 ? '' : '/recap-system-100s -r', rel(f.chemin));
  }
}

// 3. Fabrication, avec son vérificateur.
{
  const p = PIECES[2];
  const f = trouve(path.join(recap, p.dossier, 'FABRICATION.md'), path.join(racine, ANCIEN_RECAP, 'FABRICATION.md'), path.join(racine, 'FABRICATION.md'));
  if (!f) {
    ajoute(p, 'manque', 0, 'pas de FABRICATION.md', '/recap-system-100s -f');
  } else {
    const texte = lire(f.chemin);
    const ch = changements(SURVEILLES.fabrication, reperes(texte));
    let s = score(ch);
    let trous = [];
    if (fs.existsSync(VERIFIER)) {
      try {
        execFileSync(process.execPath, [VERIFIER, racine], { encoding: 'utf8' });
      } catch (e) {
        trous = (e.stdout || '').split(/\r?\n/).filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
        s = Math.min(s, 50);
      }
    }
    if (f.ancien) ajoute(p, 'deplacer', s, `à déplacer dans ${RECAP}/${p.dossier}/ (aujourd'hui : ${path.relative(racine, f.chemin).replace(/\\/g, '/')})`, 'déplacer', rel(f.chemin));
    else if (trous.length) ajoute(p, 'retard', s, trous.join(' ; ').slice(0, 160), '/recap-system-100s -f', rel(f.chemin));
    else ajoute(p, s === 100 ? 'ok' : 'retard', s, s === 100 ? `à jour (${fr(reperes(texte).date)})` : `${resume(ch)} sur les dépendances depuis la fiche`,
      s === 100 ? '' : '/recap-system-100s -f', rel(f.chemin));
  }
}

// 4. Archi : chaque schéma et le code qui a bougé depuis le commit qu'il reflète ; la barre suit le plus en retard.
{
  const p = PIECES[3];
  const dossier = [path.join(recap, p.dossier), path.join(racine, ANCIEN_RECAP, 'carte'), path.join(racine, 'docs', 'carte')].find((d) => fs.existsSync(d) && fs.readdirSync(d).some((n) => n.endsWith('.json')));
  const cartes = dossier ? fs.readdirSync(dossier).filter((n) => n.endsWith('.json')) : [];
  if (!cartes.length) {
    ajoute(p, termine ? 'manque' : 'plus-tard', termine ? 0 : null, 'aucun schéma', termine ? '/recap-system-100s -final' : 'au premier jalon : /recap-system-100s -a');
  } else {
    const details = cartes.map((nom) => {
      let revision = '';
      try { revision = JSON.parse(lire(path.join(dossier, nom)).replace(/^﻿/, '')).meta?.repository?.revision || ''; } catch { /* sans commit */ }
      const ch = revision ? changements(SURVEILLES.tout, { commit: revision }) : { commits: 0, encours: 0 };
      return { nom: nom.replace(/\.json$/, ''), s: fs.existsSync(path.join(dossier, nom.replace(/\.json$/, '.html'))) ? score(ch) : 30, ch };
    });
    const pire = details.reduce((a, b) => (b.s < a.s ? b : a));
    const lien = rel(path.join(dossier, `${pire.nom}.html`));
    if (!dossier.startsWith(recap)) ajoute(p, 'deplacer', pire.s, `${cartes.length} schéma(s) dans ${path.relative(racine, dossier).replace(/\\/g, '/')}/`, `déplacer dans ${RECAP}/${p.dossier}/`, lien);
    else ajoute(p, pire.s === 100 ? 'ok' : 'retard', pire.s,
      pire.s === 100 ? `${cartes.length} schéma(s) à jour` : `${cartes.length} schéma(s) ; le plus en retard : ${pire.nom} (${resume(pire.ch)})`,
      pire.s === 100 ? '' : (termine ? '/recap-system-100s -final' : 'au prochain jalon : /recap-system-100s -a'), lien);
  }
}

// 5. Vidéo : la plus récente (<projet>-vN.mp4) et le code qui a bougé depuis.
{
  const p = PIECES[4];
  const dossier = [path.join(recap, p.dossier), path.join(racine, ANCIEN_RECAP, 'film')].find((d) => fs.existsSync(d));
  const videos = dossier ? fs.readdirSync(dossier).filter((n) => n.endsWith('.mp4')) : [];
  const version = (n) => Number(n.match(/-v(\d+)\.mp4$/)?.[1] || 0);
  if (!videos.length) {
    ajoute(p, termine ? 'manque' : 'plus-tard', termine ? 0 : null, 'pas encore de vidéo', termine ? '/recap-system-100s -v' : 'à la fin : /recap-system-100s -v');
  } else {
    const derniere = videos.sort((a, b) => version(a) - version(b)).pop();
    const date = fs.statSync(path.join(dossier, derniere)).mtime.toISOString().slice(0, 10);
    const ch = changements(SURVEILLES.tout, { date });
    const s = score(ch);
    ajoute(p, s === 100 ? 'ok' : 'retard', s, s === 100 ? `${derniere} à jour` : `${derniere} ; depuis : ${resume(ch)}`,
      s === 100 ? '' : 'une nouvelle version au /recap-system-100s -final', rel(path.join(dossier, derniere)));
  }
}

const SYMBOLE = { ok: '✓', retard: '⚠', deplacer: '⚠', manque: '✗', 'plus-tard': '·' };
const barre = (s) => (s === null ? '·····' : '▰'.repeat(Math.round(s / 20)) + '▱'.repeat(5 - Math.round(s / 20)));
const resultat = {
  projet: path.basename(racine), nom: nomProjet, racine, actif: actif || ecrire, phase: phase || (ecrire ? 'en cours' : ''),
  commit: tete.split(' ')[0] || '', date: tete.split(' ')[1] || '',
  pieces: etats.map(({ id, numero, nom, etat, score: s, detail, action, lien }) => ({ id, numero, nom, etat, score: s, detail, action, lien })),
};

if (enJson) {
  console.log(JSON.stringify(resultat));
} else {
  console.log(`recap-system-100s · ${resultat.nom}${tete ? ` · commit ${resultat.commit} du ${fr(resultat.date)}` : ' · pas de dépôt git'} · mode ${resultat.actif ? `allumé${resultat.phase ? `, phase ${resultat.phase}` : ''}` : 'éteint'}`);
  console.log('');
  for (const e of etats) {
    console.log(`${SYMBOLE[e.etat]}  ${e.numero} ${e.nom.padEnd(11)} ${barre(e.score)} ${e.score === null ? '   ' : String(e.score).padStart(3)}  ${e.detail}${e.action ? `  →  ${e.action}` : ''}`);
  }
  console.log('');
  console.log('✓ à jour · ⚠ à reprendre · ✗ manquant · · pas encore le moment');
}

if (ecrire) {
  const aujourdhui = new Date().toLocaleDateString('fr-FR');
  const md = [
    `# Récap du projet ${resultat.nom}`,
    '',
    `> Page écrite par \`/recap-system-100s\` le ${aujourdhui}${resultat.commit ? `, au commit \`${resultat.commit}\`` : ''}. Ne pas la modifier à la main : relancer \`/recap-system-100s\`.`,
    '',
    '| | Pièce | Fraîcheur | État | Prochaine action |',
    '|:-:|---|---|---|---|',
    ...etats.map((e) => `| ${SYMBOLE[e.etat]} | ${e.lien ? `[${e.numero} · ${e.nom}](${encodeURI(e.lien)})` : `${e.numero} · ${e.nom}`} | ${barre(e.score)} ${e.score === null ? '' : e.score} | ${e.detail.replace(/\|/g, '/')} | ${e.action ? `\`${e.action}\``.replace(/^`([^/].*)`$/, '$1') : '–'} |`),
    '',
    '✓ à jour · ⚠ à reprendre · ✗ manquant · · pas encore le moment. La fraîcheur baisse quand le code que la pièce décrit change après elle.',
    '',
    '## Les dossiers',
    '',
    '- `1-demarrer/` : la fiche mémo et le lanceur à double-cliquer.',
    '- `2-ressources/` : `RESSOURCES.md`, ce que le projet utilise (comptes, services, variables, clés), sans aucun secret.',
    '- `3-fabrication/` : `FABRICATION.md`, de quoi il est fait et pourquoi (stack, décisions, inspirations et licences).',
    "- `4-archi/` : les schémas interactifs, à ouvrir dans le navigateur : le fonctionnement, l'architecture, le détail.",
    '- `5-video/` : les vidéos de présentation, `v1`, `v2`… (une version n\'efface jamais la précédente).',
    '',
    '## Les commandes',
    '',
    '`/recap-system-100s` (état) · `-sc` démarrer · `-r` ressources · `-f` fabrication · `-a` archi · `-v` vidéo · `-maj` (1 + 2 + 3) · `-final` · `-nom "<nom>"` · `-overlay`',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(recap, 'README.md'), md, 'utf8');
  if (!enJson) console.log(`\nMode allumé, page d'entrée écrite : ${path.join(recap, 'README.md')}`);
}

process.exit(etats.some((e) => e.etat !== 'ok' && e.etat !== 'plus-tard') ? 1 : 0);
