import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Etat, Piece } from '../types'

// Le bandeau du mode recap-system-100s : au-dessus de la saisie, le nom du projet suivi et la
// fraîcheur de ses 5 pièces. Il ne s'affiche que dans un projet où le mode est allumé (un dossier
// __recap-system-100s/ à sa racine).
// Le projet suivi est celui du dossier de la session, puis celui du dernier fichier modifié :
// une session ouverte au-dessus de plusieurs projets suit celui où l'on travaille. Un mode allumé
// en cours de session (la commande passe par un script, pas par Edit ou Write) est repéré à la fin
// de la réponse de Claude.
// Chaque session dépose aussi sa « présence » (projet, barres, prochaine commande) dans
// ~/.claude/recap-system-100s/presence/<session>.json : l'overlay de l'écran la lit.
// Pas dans %LOCALAPPDATA% : l'application Claude de Windows (paquet MSIX) le redirige vers son
// dossier privé, qu'un overlay lancé hors de Claude (au démarrage de Windows) ne voit pas.

const ETAT = atom({ plugin: 'recap-system-100s', key: 'etat' } as const, null)
const RACINE = atom({ plugin: 'recap-system-100s', key: 'racine' } as const, null)

const RECAP = '__recap-system-100s'
const ORANGE = '#ff5f00'
const VERT = '#22c55e'
const JAUNE = '#eab308'
const ROUGE = '#ef4444'
const RAFRAICHIR_MS = 120_000

let dossierSession: string | null = null
let debut = 0
let occupe = false
let presence: string | null = null
let publie = false

const barre = (score: number | null) =>
  score === null ? '·····' : '▰'.repeat(Math.round(score / 20)) + '▱'.repeat(5 - Math.round(score / 20))
const couleur = (p: Piece) =>
  p.score === null ? undefined : p.score >= 100 ? VERT : p.score >= 60 ? JAUNE : ROUGE
const barres = (chemin: string) => chemin.replace(/\\/g, '/').replace(/\/+$/, '')
const normalise = (chemin: string) => barres(chemin).toLowerCase()
const parent = (chemin: string) => barres(chemin).replace(/\/[^/]*$/, '')
// La pièce à reprendre en premier : une manquante, sinon une en retard.
const prochaine = (etat: Etat) => etat.pieces.find(p => p.etat === 'manque')
  ?? etat.pieces.find(p => p.etat === 'retard' || p.etat === 'deplacer')

// etat.mjs est livré avec ce plugin, dans le skill recap-system-100s.
const script = ($: EngineInterface) => `${barres($.plugin.root)}/skills/recap-system-100s/etat.mjs`

// Le projet en mode récap qui contient ce dossier : le plus proche parent qui a un __recap-system-100s/.
async function projetDe($: EngineInterface, dossier: string) {
  let d = barres(dossier)
  for (let i = 0; i < 40 && d; i++) {
    if (await $.fs.exists(`${d}/${RECAP}`).catch(() => false)) return d
    const p = parent(d)
    if (p === d) break
    d = p
  }
  return null
}

// L'état d'un projet, ou null si le mode n'y est pas allumé. etat.mjs sort en code 1 quand une
// pièce est à reprendre : c'est sa sortie qui compte, pas son code.
async function lireEtat($: EngineInterface, racine: string) {
  const r = await $.process.run(['node', script($), racine, '--json'], { timeoutMs: 30000 })
  try {
    const etat = JSON.parse(r.stdout) as Etat
    return etat.actif ? etat : null
  } catch {
    return null
  }
}

async function fichierPresence($: EngineInterface) {
  if (presence) return presence
  const base = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  if (!base) return null
  presence = `${barres(base)}/.claude/recap-system-100s/presence/${await $.session.id()}.json`
  return presence
}

// La présence de la session pour l'overlay de l'écran ; null marque la session comme finie.
async function publier($: EngineInterface, etat: Etat | null) {
  if (!etat && !publie) return
  const fichier = await fichierPresence($)
  if (!fichier) return
  const maj = await $.clock.now()
  const suite = etat ? prochaine(etat) : undefined
  const contenu = etat
    ? {
        maj, debut: debut || maj, fin: false, nom: etat.nom, racine: etat.racine, phase: etat.phase,
        pieces: etat.pieces.map(p => ({ numero: p.numero, nom: p.nom, etat: p.etat, score: p.score, detail: p.detail })),
        suite: suite ? { numero: suite.numero, nom: suite.nom, action: suite.action } : null,
      }
    : { maj, debut: debut || maj, fin: true }
  try {
    await $.fs.write(fichier, JSON.stringify(contenu))
    publie = true
  } catch {
    // L'overlay n'est qu'un plus : le bandeau continue sans lui.
  }
}

async function rafraichir($: EngineInterface) {
  const racine = await read($, RACINE)
  if (!racine || occupe) return
  occupe = true
  try {
    const etat = await lireEtat($, racine)
    await update($, ETAT, () => etat)
    await publier($, etat)
  } finally {
    occupe = false
  }
}

// Suit le projet d'un dossier s'il est en mode récap ; un dossier hors mode ne change rien.
async function suivre($: EngineInterface, dossier: string) {
  const racine = await projetDe($, dossier)
  if (!racine) return
  if (normalise(racine) === normalise((await read($, RACINE)) ?? '')) return rafraichir($)
  const etat = await lireEtat($, racine)
  if (!etat) return
  await update($, RACINE, () => racine)
  await update($, ETAT, () => etat)
  await publier($, etat)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    dossierSession = e.cwd
    debut = await $.clock.now()
    await suivre($, e.cwd)
    $.clock.every(RAFRAICHIR_MS, () => rafraichir($))
    return result
  })

  // La session se ferme : l'overlay retire sa ligne tout de suite.
  on('session.end', async ($, e, next) => {
    await publier($, null)
    return next(e)
  })

  // Un fichier modifié hors du projet suivi : peut-être un autre projet en mode récap.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (e.tool !== 'Edit' && e.tool !== 'Write') return result
    const racine = await read($, RACINE)
    if (!racine || !normalise(e.file_path).startsWith(`${normalise(racine)}/`)) {
      await suivre($, parent(e.file_path))
    }
    return result
  })

  // Après chaque réponse de Claude, les barres suivent ce qui vient de changer. Sans projet suivi,
  // on regarde à nouveau le dossier de la session : le mode a pu y être allumé pendant la réponse.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result
    if (await read($, RACINE)) await rafraichir($)
    else if (dossierSession) await suivre($, dossierSession)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const etat = await read($, ETAT)
    if (e.props.hasSurvey || !etat) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const suite = prochaine(etat)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
          <Text key="projet" bold color={ORANGE}>{etat.nom}</Text>
          <Text key="mode" dimColor>{`recap · ${etat.phase || 'en cours'}`}</Text>
          {etat.pieces.map(p => (
            <Text key={p.id} color={couleur(p)} dimColor={p.score === null}>
              {`${p.numero} ${p.nom} ${barre(p.score)}`}
            </Text>
          ))}
        </Box>
        {suite ? (
          <Text key="suite" dimColor wrap="truncate-end">
            {`→ ${suite.action}  (${suite.numero} ${suite.nom} : ${suite.detail})`}
          </Text>
        ) : null}
      </Box>
    )
  })
}
