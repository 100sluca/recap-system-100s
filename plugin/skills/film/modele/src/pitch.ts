// La voix off, écrite par outils/voix.mjs (à partir de PITCH.md). Par défaut : pas de voix, le
// film suit seulement la musique. Ne pas modifier à la main : corriger PITCH.md et relancer voix.mjs.
export const VOIX = '';
export const DEBUT_VOIX = 0; // secondes de film avant la première phrase
export const DUREE_VOIX = 0; // secondes
export const PHRASES: readonly {debut: number; fin: number; partie: string; texte: string}[] = [];
