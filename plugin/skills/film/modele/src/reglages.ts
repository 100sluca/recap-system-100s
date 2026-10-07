// Réglages propres à cette vidéo, écrits par outils/nouveau.mjs (à corriger à la main au besoin).
// La musique : son tempo et l'instant de son premier temps, mesurés par outils/tempo.mjs.
// MUSIQUE vide : film muet. SONS : les bruitages présents dans public/son/ ; un Effet absent se tait.
export const MUSIQUE = 'son/musique.mp3';
export const BPM = 105;
export const PREMIER_TEMPS = 0.348; // en secondes
export const NB_TEMPS = 16; // durée du film, en temps de musique
export const SONS: readonly string[] = [];
