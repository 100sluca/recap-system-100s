#!/usr/bin/env node
// Allume ou éteint l'overlay du mode recap-system-100s sur l'écran, sur Windows, macOS ou Linux.
//
//   node activer.mjs          lance l'overlay et le relance à chaque ouverture de session
//   node activer.mjs --off    l'arrête et le retire du démarrage
//
// Windows : overlay.ps1 (PowerShell 5.1 et WPF, déjà dans Windows), par activer.ps1.
// macOS et Linux : overlay.py (Python 3 avec tkinter). Il est recopié dans
// ~/.claude/recap-system-100s/overlay/, un chemin qui ne change pas quand le plugin est mis à jour,
// puis relancé à l'ouverture de session : un LaunchAgent sur macOS, ~/.config/autostart sur Linux.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const off = process.argv.includes('--off');
const DEST = path.join(os.homedir(), '.claude', 'recap-system-100s', 'overlay');

if (process.platform === 'win32') {
  const ps = path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const r = spawnSync(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ICI, 'activer.ps1'), ...(off ? ['-Off'] : [])], { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 1);
}

const script = path.join(DEST, 'overlay.py');
const mac = process.platform === 'darwin';
const agent = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.recap-system-100s.overlay.plist');
const autostart = path.join(os.homedir(), '.config', 'autostart', 'recap-system-100s-overlay.desktop');

// L'overlay déjà lancé, s'il y en a un.
spawnSync('pkill', ['-f', 'recap-system-100s/overlay/overlay.py']);

if (off) {
  if (mac && fs.existsSync(agent)) {
    spawnSync('launchctl', ['unload', agent]);
    fs.rmSync(agent);
  }
  if (!mac && fs.existsSync(autostart)) fs.rmSync(autostart);
  console.log("Overlay arrêté, et retiré de l'ouverture de session.");
  process.exit(0);
}

const python = spawnSync('sh', ['-c', 'command -v python3'], { encoding: 'utf8' }).stdout.trim();
const tk = python && spawnSync(python, ['-c', 'import tkinter'], { encoding: 'utf8' });
if (!python || tk.status !== 0) {
  console.error(!python
    ? "Python 3 est introuvable : l'overlay de macOS et Linux en a besoin."
    : "Python 3 n'a pas tkinter : l'overlay de macOS et Linux en a besoin.");
  console.error(mac
    ? 'Installer : brew install python-tk (ou Python depuis python.org, qui l\'inclut).'
    : 'Installer : sudo apt install python3-tk (Debian, Ubuntu) ou sudo dnf install python3-tkinter (Fedora).');
  process.exit(1);
}

fs.mkdirSync(DEST, { recursive: true });
fs.copyFileSync(path.join(ICI, 'overlay.py'), script);

if (mac) {
  fs.mkdirSync(path.dirname(agent), { recursive: true });
  fs.writeFileSync(agent, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.recap-system-100s.overlay</string>
  <key>ProgramArguments</key><array><string>${python}</string><string>${script}</string></array>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
`);
  spawnSync('launchctl', ['unload', agent]);
  const r = spawnSync('launchctl', ['load', agent], { encoding: 'utf8' });
  if (r.status !== 0) spawn(python, [script], { detached: true, stdio: 'ignore' }).unref();
  console.log(`Overlay lancé. Il revient à chaque ouverture de session (LaunchAgent : ${agent}).`);
} else {
  fs.mkdirSync(path.dirname(autostart), { recursive: true });
  fs.writeFileSync(autostart, `[Desktop Entry]
Type=Application
Name=recap-system-100s overlay
Comment=Overlay du mode recap-system-100s
Exec=${python} "${script}"
X-GNOME-Autostart-enabled=true
NoDisplay=true
`);
  spawn(python, [script], { detached: true, stdio: 'ignore' }).unref();
  console.log(`Overlay lancé. Il revient à chaque ouverture de session (${autostart}).`);
}
