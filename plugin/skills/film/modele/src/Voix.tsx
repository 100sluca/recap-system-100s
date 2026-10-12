import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {FPS, clamp} from './charte';
import {DEBUT_VOIX, DUREE_VOIX, PHRASES, VOIX} from './pitch';

// La voix off (public/voix/voix.wav, minutée par outils/voix.mjs) et ce qui s'y cale :
// - p(i) : l'image où commence la phrase i ; les plans d'un film parlé se coupent là, pas sur la
//   mesure (la musique reste dessous, ses temps servent aux petits mouvements) ;
// - sousVoix(f) : le facteur de volume de la musique, baissé tant qu'on parle ;
// - phraseA(f) : la phrase dite à l'image f (pour des sous-titres), ou -1.
// Sans voix (pitch.ts par défaut), Voix ne joue rien et sousVoix vaut 1.

/** L'image du film où commence la phrase i (décalée de `decalage` images). */
export const p = (i: number, decalage = 0) =>
	PHRASES[i] ? Math.round((DEBUT_VOIX + PHRASES[i].debut) * FPS) + decalage : 0;

/** L'image du film où finit la phrase i. */
export const pFin = (i: number, decalage = 0) =>
	PHRASES[i] ? Math.round((DEBUT_VOIX + PHRASES[i].fin) * FPS) + decalage : 0;

/** L'image où la voix se tait pour de bon. */
export const FIN_VOIX = Math.round((DEBUT_VOIX + DUREE_VOIX) * FPS);

/** La phrase dite à l'image f, ou -1 entre deux phrases. */
export const phraseA = (f: number) => PHRASES.findIndex((_, i) => f >= p(i) && f < pFin(i));

// Les plages de parole : les phrases séparées de moins de 1,5 s sont fondues en une, pour que la
// musique ne remonte pas à chaque respiration.
const PLAGES = PHRASES.reduce<[number, number][]>((plages, _, i) => {
	const [a, b] = [p(i), pFin(i)];
	const derniere = plages[plages.length - 1];
	if (derniere && a - derniere[1] < 1.5 * FPS) derniere[1] = b;
	else plages.push([a, b]);
	return plages;
}, []);

/** Le facteur de volume de la musique à l'image f : `niveau` sous la voix, 1 ailleurs, avec des
 *  rampes de 0,4 s (la baisse commence avant la phrase). */
export const sousVoix = (f: number, niveau = 0.3) => {
	if (!VOIX) return 1;
	const rampe = Math.round(0.4 * FPS);
	const parle = Math.max(
		0,
		...PLAGES.map(([a, b]) => interpolate(f, [a - rampe, a, b, b + rampe], [0, 1, 1, 0], clamp)),
	);
	return 1 - (1 - niveau) * parle;
};

/** La piste de la voix, posée à DEBUT_VOIX. */
export const Voix: React.FC<{readonly volume?: number}> = ({volume = 1}) => {
	const {fps} = useVideoConfig();
	if (!VOIX) return null;
	return (
		<Sequence from={Math.round(DEBUT_VOIX * FPS)} premountFor={fps} name="son · voix">
			<Audio src={staticFile(VOIX)} volume={volume} />
		</Sequence>
	);
};
