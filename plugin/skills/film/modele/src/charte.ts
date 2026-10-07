import {loadFont} from '@remotion/fonts';
import {Easing, staticFile} from 'remotion';
import {BPM} from './reglages';

// La charte par défaut, celle de 100s (luca100s.fr) : papier, encre, un seul orange.
// Pour un projet qui a sa DA : ses couleurs ici, ses polices dans POLICE et public/fonts/.
export const C = {
	papier: '#f2f1ed',
	encre: '#16110c',
	orange: '#ff5f00',
	gris: '#5b544d',
	grisClair: '#9a918a',
	blanc: '#ffffff',
	filet: 'rgba(22,17,12,0.10)',
} as const;

// Les polices du site (variables, sous-ensemble latin).
export const POLICE = {
	titre: 'Funnel Display',
	texte: 'Funnel Sans',
	mono: 'Martian Mono',
	points: 'Doto',
} as const;

loadFont({family: POLICE.titre, url: staticFile('fonts/funnel-display.woff2'), weight: '300 800'});
loadFont({family: POLICE.texte, url: staticFile('fonts/funnel-sans.woff2'), weight: '300 800'});
loadFont({family: POLICE.mono, url: staticFile('fonts/martian-mono.woff2'), weight: '100 800'});
loadFont({family: POLICE.points, url: staticFile('fonts/doto.woff2'), weight: '100 900'});

// Le film est calé sur la musique (réglages.ts) : 30 images par seconde, BPM temps par minute.
export const FPS = 30;
export {BPM, MUSIQUE, NB_TEMPS, PREMIER_TEMPS} from './reglages';
export const TEMPS = (FPS * 60) / BPM; // images par temps
/** Le temps n (compté depuis le début de la scène) en images. */
export const t = (n: number) => Math.round(n * TEMPS);

// Arrivée en longue traîne, jamais de rebond.
export const TRAINE = Easing.bezier(0.16, 1, 0.3, 1);
export const DOUX = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Le S en pixels, variante « la traînée » (src/components/v4/brand.tsx du site).
export const PIXEL_ORDRE = [
	[3, 0],
	[2, 0],
	[1, 0],
	[0, 1],
	[1, 2],
	[2, 2],
	[3, 3],
	[2, 4],
	[1, 4],
	[0, 4],
] as const;
export const TRAINEE_CLAIR = ['#ff5f00', '#d4500a', '#9c3d0f', '#5e2a12'];
export const TRAINEE_SOMBRE = ['#ff5f00', '#ff8b45', '#ffb88a', '#fbdcc4'];
