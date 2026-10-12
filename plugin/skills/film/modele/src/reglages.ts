// Réglages propres à cette vidéo, écrits par outils/nouveau.mjs (à corriger à la main au besoin).
// La musique : son tempo et l'instant de son premier temps, mesurés par outils/tempo.mjs, et sa
// sonie (outils/sonie.mjs), qui sert à la ramener aux NIVEAUX. MUSIQUE vide : film muet.
export const MUSIQUE = 'son/musique.mp3';
export const BPM = 105;
export const PREMIER_TEMPS = 0.348; // en secondes
export const MUSIQUE_LUFS = -14; // sonie mesurée du morceau (ses deux premières minutes)
export const NB_TEMPS = 16; // durée du film, en temps de musique
// Les niveaux du mix, en LUFS (le film joué en stéréo) ; la voix off est vers −14 dans le film.
// musique : film sans voix off · entreVoix : film avec voix, quand on ne parle pas · sousVoix :
// sous les phrases (réglage musiqueSousVoix, 18 dB sous la voix par défaut) · bruitage : un Effet
// joué à volume 1.
export const NIVEAUX = {musique: -16, entreVoix: -20, sousVoix: -32, bruitage: -14};
// Les bruitages présents dans public/son/, avec leur crête de sonie en LUFS ; un Effet absent se
// tait. La palette par famille, avec les durées : public/son/sons.json.
export const SONS: Readonly<Record<string, number>> = {};
