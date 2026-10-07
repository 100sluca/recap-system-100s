// Trouve un navigateur Chromium installé (Chrome, Chromium, Edge, Brave) sur Windows, macOS ou Linux.
// Les schémas (Archify) le prennent pour vérifier une page ; les captures d'un site aussi.
//
//   node navigateur.mjs        écrit son chemin, ou sort en code 1 s'il n'y en a aucun
//
// La variable ARCHIFY_CHROME, si elle est posée, passe avant tout.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function trouverNavigateur(env = process.env) {
  if (env.ARCHIFY_CHROME && fs.existsSync(env.ARCHIFY_CHROME)) return env.ARCHIFY_CHROME;
  const fixes = [];
  const commandes = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'brave-browser'];
  if (process.platform === 'win32') {
    for (const racine of [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean)) {
      fixes.push(
        path.join(racine, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(racine, 'Chromium', 'Application', 'chrome.exe'),
        path.join(racine, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(racine, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      );
    }
  } else if (process.platform === 'darwin') {
    fixes.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    );
  }
  for (const f of fixes) if (fs.existsSync(f)) return f;
  if (process.platform !== 'win32') {
    for (const c of commandes) {
      const r = spawnSync('sh', ['-c', `command -v ${c}`], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
    }
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const n = trouverNavigateur();
  if (n) console.log(n);
  else {
    console.error('Aucun navigateur Chromium trouvé (Chrome, Chromium, Edge ou Brave).');
    process.exit(1);
  }
}
