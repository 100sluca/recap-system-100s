import {Easing} from 'remotion';
import {BPM} from './reglages';
import './polices';

// La charte du film = sa DA (da.json, lue par da.tsx) + la grille de temps de la musique.
// Les couleurs sont nommées par rôle (fond, surface, encre, accent…), jamais par teinte : le même
// code sert à toutes les DA. Chaque style (styles/<id>.md) dit comment il s'en sert.
export {AvecDA, C, DA_FILM, POLICE, useDA, type Couleurs, type DA} from './da';

// Le film est calé sur la musique (réglages.ts) : 30 images par seconde, BPM temps par minute.
export const FPS = 30;
export {BPM, MUSIQUE, NB_TEMPS, PREMIER_TEMPS} from './reglages';
export const TEMPS = (FPS * 60) / BPM; // images par temps
/** Le temps n (compté depuis le début de la scène) en images. */
export const t = (n: number) => Math.round(n * TEMPS);

// Les courbes. Chaque style dit lesquelles il prend.
export const TRAINE = Easing.bezier(0.16, 1, 0.3, 1); // longue traîne : arrive vite, se pose longtemps
export const DOUX = Easing.bezier(0.65, 0, 0.35, 1); // ease-in-out, pour les trajets et la caméra
export const SEC = Easing.bezier(0.23, 1, 0.32, 1); // « power4.out » : claque puis s'arrête net
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
