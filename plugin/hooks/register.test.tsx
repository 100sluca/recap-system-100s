import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Etat } from '../types'

const piece = (id: string, numero: number, nom: string, score: number | null, etat: Etat['pieces'][number]['etat'], action = '') =>
  ({ id, numero, nom, etat, score, detail: score === null ? 'pas encore' : `fraîcheur ${score}`, action, lien: '' })

const ETAT: Etat = {
  projet: 'site', nom: 'Mon site', racine: 'C:/code/site', actif: true, phase: 'en cours', commit: 'abc1234', date: '2026-10-07',
  pieces: [
    piece('demarrer', 1, 'Démarrer', 100, 'ok'),
    piece('ressources', 2, 'Ressources', 76, 'retard', '/recap-system-100s -r'),
    piece('fabrication', 3, 'Fabrication', 100, 'ok'),
    piece('archi', 4, 'Archi', 10, 'retard', 'au prochain jalon : /recap-system-100s -a'),
    piece('video', 5, 'Vidéo', null, 'plus-tard', 'à la fin : /recap-system-100s -v'),
  ],
}

const BANDEAU = { component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 } } as const

// Ce qui se tient sous le plugin dans une vraie session : l'horloge, le dessin par défaut, node,
// l'environnement et le disque. `enMode` dit quels dossiers ont un __recap-system-100s/ ; le
// tableau peut changer en cours de test (un mode allumé pendant une réponse). Renvoie les
// fichiers écrits et les scripts lancés.
function machine(on: On, enMode: string[], etat: Etat) {
  const ecrits: { path: string; text: string }[] = []
  const lances: string[][] = []
  mock.clock(on)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.end', async () => ({ sessionId: 'session-1' }) as never)
  on('ui.render', async ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  // Le moteur passe les chemins à la façon du système (des \ sous Windows).
  on('fs.exists', async (_$, e) => ({ value: enMode.some(d => e.path.replace(/\\/g, '/') === `${d}/__recap-system-100s`) }))
  on('process.run', async (_$, e) => {
    lances.push([...e.argv])
    return { value: { exitCode: 1, stdout: JSON.stringify(etat), stderr: '' } }
  })
  on('env.get', async (_$, e) => ({ value: e.name === 'USERPROFILE' ? 'C:\\u' : undefined }))
  on('session.id', async () => ({ value: 'session-1' }))
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  on('fs.write', async (_$, e) => {
    ecrits.push({ path: e.path, text: e.text })
    return { value: undefined }
  })
  return { ecrits, lances }
}

test('en mode récap, le bandeau nomme le projet, montre les 5 pièces et la prochaine commande', async ($, on) => {
  const { lances } = machine(on, ['C:/code/site'], ETAT)
  await $.session.start({ cwd: 'C:\\code\\site\\src', surface: 'terminal', isInteractive: true } as never)

  // Le projet est trouvé depuis un sous-dossier, et etat.mjs est celui livré avec le plugin.
  expect(lances[0]?.[0]).toBe('node')
  expect(lances[0]?.[1]).toMatch(/\/skills\/recap-system-100s\/etat\.mjs$/)
  expect(lances[0]?.[2]).toBe('C:/code/site')

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'recap-system-100s', surface, ...BANDEAU } as never)
    expect(await ui.find({ type: 'Text', text: 'Mon site' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '2 Ressources ▰▰▰▰▱' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '5 Vidéo ·····' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^→ \/recap-system-100s -r / })).toBeDefined()
    await ui.unmount()
  }
})

test("la session dépose sa présence pour l'overlay, puis la marque finie en se fermant", async ($, on) => {
  const { ecrits } = machine(on, ['C:/code/site'], ETAT)
  await $.session.start({ cwd: 'C:/code/site', surface: 'terminal', isInteractive: true } as never)

  const premiere = ecrits.at(-1)
  expect(premiere?.path.replace(/\\/g, '/')).toBe('C:/u/.claude/recap-system-100s/presence/session-1.json')
  const presence = JSON.parse(premiere?.text ?? '{}')
  expect(presence.nom).toBe('Mon site')
  expect(presence.fin).toBe(false)
  expect(typeof presence.debut).toBe('number')
  expect(presence.pieces.length).toBe(5)
  expect(presence.suite.action).toBe('/recap-system-100s -r')

  await $.session.end({ reason: 'other' } as never)
  expect(JSON.parse(ecrits.at(-1)?.text ?? '{}').fin).toBe(true)
})

test('hors mode récap, le bandeau ne montre rien, ne lance rien et ne dépose aucune présence', async ($, on) => {
  const { ecrits, lances } = machine(on, [], ETAT)
  await $.session.start({ cwd: 'C:/code/autre', surface: 'terminal', isInteractive: true } as never)

  const ui = await $.ui.mount({ plugin: 'recap-system-100s', surface: 'terminal', ...BANDEAU } as never)
  expect(await ui.find({ type: 'Text', text: 'Mon site' })).toBeUndefined()
  await ui.unmount()
  expect(lances.length).toBe(0)
  expect(ecrits.length).toBe(0)
})

test('un mode allumé pendant une réponse apparaît à la fin de celle-ci', async ($, on) => {
  const enMode: string[] = []
  const { ecrits } = machine(on, enMode, ETAT)
  await $.session.start({ cwd: 'C:/code/site', surface: 'terminal', isInteractive: true } as never)
  expect(ecrits.length).toBe(0)

  // /recap-system-100s crée le dossier par un script (Bash), sans Edit ni Write.
  enMode.push('C:/code/site')
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as never)

  const ui = await $.ui.mount({ plugin: 'recap-system-100s', surface: 'terminal', ...BANDEAU } as never)
  expect(await ui.find({ type: 'Text', text: 'Mon site' })).toBeDefined()
  await ui.unmount()
  expect(JSON.parse(ecrits.at(-1)?.text ?? '{}').nom).toBe('Mon site')
})
