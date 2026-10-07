// Ce que renvoie `node etat.mjs <projet> --json` (skill recap-system-100s).
export type Piece = {
  id: string
  numero: number
  nom: string
  etat: 'ok' | 'retard' | 'deplacer' | 'manque' | 'plus-tard'
  // Fraîcheur de 0 à 100 ; null quand ce n'est pas encore le moment (vidéo avant la fin).
  score: number | null
  detail: string
  action: string
  lien: string
}

export type Etat = {
  projet: string
  nom: string
  racine: string
  actif: boolean
  phase: string
  commit: string
  date: string
  pieces: Piece[]
}

declare module 'claude-code' {
  interface PluginState {
    'recap-system-100s': { etat: Etat | null; racine: string | null }
  }
}
