# recap-system-100s

Un plugin [Claude Code](https://claude.com/claude-code) qui tient, pour chaque projet de code, un
**récap en 5 pièces** : de quoi relancer, comprendre et montrer le projet des mois plus tard, sans
rien avoir à se rappeler. Claude le remplit et le tient à jour pendant que tu codes.

| | Pièce | Ce que c'est |
|:-:|---|---|
| 1 | Démarrer | une fiche mémo + un lanceur à double-cliquer (`.bat`, `.command` ou `.sh`) |
| 2 | Ressources | `RESSOURCES.md` : comptes, services, variables, clés (les noms, jamais les valeurs) |
| 3 | Fabrication | `FABRICATION.md` : la stack, les décisions et leurs raisons, les inspirations et leurs licences |
| 4 | Archi | des schémas interactifs (fonctionnement, architecture, détail), dessinés avec [Archify](https://github.com/tt-a1i/archify) |
| 5 | Vidéo | une vidéo de présentation en motion design 2D/3D, faite avec [Remotion](https://www.remotion.dev) |

Chaque pièce a une **fraîcheur de 0 à 100**, qui baisse quand le code qu'elle décrit change après
elle. Un **bandeau** au-dessus de la saisie de Claude Code la montre, et un **overlay** facultatif
l'affiche sur l'écran, un projet par ligne.

## Installer

Il faut [Claude Code](https://claude.com/claude-code) à jour, [Node.js](https://nodejs.org) 20 ou
plus et git. Chrome, Edge ou Chromium servent aux schémas.

Dans Claude Code :

```
/plugin marketplace add 100sluca/recap-system-100s
/plugin install recap-system-100s@recap-system-100s
```

Ou dans un terminal :

```bash
claude plugin marketplace add 100sluca/recap-system-100s
claude plugin install recap-system-100s@recap-system-100s
```

Redémarre Claude Code (ou tape `/reload-plugins`), puis, dans n'importe quel projet :

```
/recap-system-100s -installer
```

Il vérifie la machine, dit quoi installer s'il manque quelque chose, et télécharge le moteur des
schémas.

## Les commandes

Dans une session Claude Code ouverte sur ton projet. La première commande **allume le mode** :
elle crée `__recap-system-100s/` et ajoute un bloc au `CLAUDE.md` du projet.

| Tu tapes | Ce que ça fait |
|---|---|
| `/recap-system-100s` | l'état des 5 pièces et la prochaine action |
| `/recap-system-100s -sc` | 1 · la fiche et le lanceur, testés |
| `/recap-system-100s -r` | 2 · les ressources |
| `/recap-system-100s -f` | 3 · la fabrication |
| `/recap-system-100s -a` | 4 · les schémas |
| `/recap-system-100s -v` | 5 · une vidéo (v1, v2… jamais écrasées), avec son bilan de coût |
| `/recap-system-100s -maj` | 1, 2 et 3 d'une traite |
| `/recap-system-100s -final` | tout remettre à jour à la fin du projet |
| `/recap-system-100s -nom "Mon projet"` | le nom affiché par le bandeau et l'overlay |
| `/recap-system-100s -overlay` | l'overlay sur l'écran, relancé à chaque démarrage (`-overlay off` pour l'éteindre) |
| `/recap-system-100s -installer` | vérifier et préparer la machine |
| `/recap-system-100s -reglages` | voir ou changer tes réglages |

Pas besoin de tout taper à chaque fois : le bloc du `CLAUDE.md` rappelle à Claude, à chaque
session, de mettre à jour la bonne pièce quand un port, une clé ou une dépendance change.

## Comment ça marche

```
mon-projet/
  CLAUDE.md                 + le bloc « recap-system-100s » (nom, phase, consignes)
  __recap-system-100s/
    README.md               la page d'entrée : chaque pièce, sa fraîcheur, la prochaine action
    1-demarrer/             la fiche et le lanceur
    2-ressources/           RESSOURCES.md
    3-fabrication/          FABRICATION.md
    4-archi/                les schémas (.json source + .html à ouvrir)
    5-video/                mon-projet-v1.mp4, son storyboard, sa source, son bilan
```

- **La fraîcheur** : chaque commit qui touche ce que décrit une pièce lui coûte 12 points, chaque
  fichier modifié pas encore commité 4. Démarrer suit les scripts et les ports, Ressources la
  configuration, Fabrication les dépendances, Archi et Vidéo tout le code.
- **Le bandeau** : le nom du projet en orange, ses 5 barres (vert à 100, jaune dès 60, rouge en
  dessous, gris « pas encore le moment ») et la prochaine commande. Il ne s'affiche que dans un
  projet en mode récap, et suit le projet où tu travailles.
- **L'overlay** : une petite fenêtre toujours au premier plan, une ligne par projet ouvert dans
  une session. On la glisse où l'on veut. La croix d'une ligne masque ce projet jusqu'à sa
  prochaine session, celle du titre ferme l'overlay. Clic droit : mode compact, opacité,
  réafficher. Rien à installer sous Windows ; Python 3 avec tkinter sous macOS et Linux.

## Tes réglages (tous facultatifs)

`/recap-system-100s -reglages`, rangés dans `~/.claude/recap-system-100s/reglages.json` :

| Réglage | Sert à |
|---|---|
| `fiches` | un dossier où recopier aussi chaque fiche et son lanceur, pour les lancer d'un double-clic (ex. `~/Desktop/Projets`) |
| `banqueSon` | ta banque de sons pour les vidéos : un dossier avec `musique/` et, pour les bruitages, un `bruitages.json` |
| `musique` | la musique par défaut des vidéos |
| `ateliers` | où créer les ateliers des vidéos (par défaut `~/recap-film`) |

**Aucune musique n'est livrée** : chacun utilise la sienne. Sans banque-son, Claude te demande un
fichier audio pour chaque vidéo, ou la fait muette.

## Mettre à jour, retirer

```
/plugin marketplace update recap-system-100s
/plugin update recap-system-100s@recap-system-100s
/plugin uninstall recap-system-100s@recap-system-100s
```

## Bon à savoir

- Les skills et les documents produits sont en français.
- Aucun secret n'entre jamais dans le récap : les noms des variables, pas leurs valeurs.
- La vidéo installe Remotion dans un atelier hors du projet (environ 300 Mo). Remotion est gratuit
  pour une personne ou une entreprise de 3 salariés au plus, payant au-delà :
  [sa licence](https://www.remotion.dev/license).
- Testé sous Windows 11 avec Claude Code 2.1.289. macOS et Linux sont prévus (lanceurs, overlay)
  mais pas encore testés.

## Licence

MIT, voir [LICENSE](LICENSE). Polices sous licence OFL, moteur Archify sous licence MIT (téléchargé
à part).
