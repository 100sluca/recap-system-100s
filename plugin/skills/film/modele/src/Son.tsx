import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {FPS, MUSIQUE, PREMIER_TEMPS, clamp} from './charte';
import {PHRASES} from './pitch';
import {MUSIQUE_LUFS, NIVEAUX, SONS} from './reglages';
import {Voix, sousVoix} from './Voix';

// La musique (son premier temps tombe sur l'image 0) et les bruitages posés sur la grille t(n).
// Les sons sont dans public/son/ (copiés de la banque-son de l'utilisateur par outils/nouveau.mjs).
// Sans musique (film muet) ou sans un bruitage, le composant ne joue rien.
// S'il y a une voix off (src/pitch.ts, écrit par outils/voix.mjs), Musique la joue aussi et se
// baisse dessous : rien d'autre à ajouter au film.
//
// Les niveaux ne se règlent pas à l'oreille, film par film : chaque morceau et chaque bruitage a été
// mesuré (outils/sonie.mjs, en LUFS) et est ramené aux cibles de NIVEAUX (reglages.ts). Les morceaux
// de la banque-son vont de −10 à −20 LUFS, ses bruitages de −28 à −5 : un volume fixe les rendait
// 10 dB trop forts ou trop faibles d'un film à l'autre (Gamaths v3, 12/10/2026 : la musique, à
// 10 dB seulement sous la voix, la couvrait).

const dB = (x: number) => 10 ** (x / 20);

/** La musique, ramenée à sa cible : NIVEAUX.musique dans un film sans voix off ; avec une voix
 *  (ou son minutage prévu, pour le doublage), NIVEAUX.entreVoix quand on ne parle pas et
 *  NIVEAUX.sousVoix pendant les phrases. `volume` corrige la cible pour ce film (0,7 ≈ −3 dB) :
 *  à laisser à 1, sauf si outils/sonie.mjs le conseille après le rendu. */
export const Musique: React.FC<{readonly volume?: number}> = ({volume = 1}) => {
	const {durationInFrames: fin, fps} = useVideoConfig();
	if (!MUSIQUE) return <Voix />;
	const cible = PHRASES.length ? NIVEAUX.entreVoix : NIVEAUX.musique;
	const niveau = volume * Math.min(dB(cible - MUSIQUE_LUFS), 4);
	const baisse = dB(NIVEAUX.sousVoix - NIVEAUX.entreVoix);
	return (
		<>
			<Sequence durationInFrames={fin} premountFor={fps} name="son · musique">
				<Audio
					src={staticFile(MUSIQUE)}
					trimBefore={Math.round(PREMIER_TEMPS * FPS)}
					volume={(f) => interpolate(f, [0, 6, fin - 55, fin - 2], [0, niveau, niveau, 0], clamp) * sousVoix(f, baisse)}
				/>
			</Sequence>
			<Voix />
		</>
	);
};

/** Un bruitage à l'image `a` (en général t(n)), coupé en fondu après `duree` images.
 *  `volume` est relatif à la voix, quel que soit le fichier (tous sont nivelés sur leur crête de
 *  sonie) : 1 = aussi fort que la voix ; 0,35 un accent net quand personne ne parle ; 0,2 sous la
 *  voix ; 0,12 un détail (touche, petite coche). `ton` : en demi-tons, de −12 à +12 (+12 = une
 *  octave plus haut), la durée ne change pas ; pour une suite d'étapes, voir <Suite />. */
export const Effet: React.FC<{readonly src: string; readonly a: number; readonly volume: number; readonly duree?: number; readonly ton?: number}> = ({
	src,
	a,
	volume,
	duree = 45,
	ton = 0,
}) => {
	const {fps} = useVideoConfig();
	if (!(src in SONS)) return null;
	const gain = volume * Math.min(dB(NIVEAUX.bruitage - SONS[src]), 8);
	const hauteur = Math.min(2, Math.max(0.5, 2 ** (ton / 12)));
	return (
		<Sequence from={Math.max(0, Math.round(a))} durationInFrames={duree} premountFor={fps} name={`son · ${src}${ton ? ` ${ton > 0 ? '+' : ''}${ton}` : ''}`}>
			<Audio
				src={staticFile(`son/${src}`)}
				volume={(f) => gain * interpolate(f, [duree - 10, duree], [1, 0], clamp)}
				{...(hauteur === 1 ? {} : {toneFrequency: hauteur})}
			/>
		</Sequence>
	);
};

/** Les crans d'une suite de `n` étapes, en demi-tons, toujours en montant : jusqu'à 4 étapes
 *  l'arpège majeur (do mi sol do), au-delà la gamme majeure (do ré mi fa sol la si do). */
export const crans = (n: number) => {
	const echelle = n <= 4 ? [0, 4, 7, 12] : [0, 2, 4, 5, 7, 9, 11, 12];
	return Array.from({length: n}, (_, i) => echelle[Math.min(i, echelle.length - 1)]);
};

/** Une suite d'étapes (2 à 8, en moins de 10 s) : le même bruitage à chaque instant de `aux`, un
 *  cran plus haut à chaque fois, pour une progression qui se sent. `depart` décale toute la suite
 *  (−5 : elle part plus grave). Une suite compte pour un seul emploi du bruitage dans le film. */
export const Suite: React.FC<{readonly src: string; readonly aux: readonly number[]; readonly volume: number; readonly duree?: number; readonly depart?: number}> = ({
	src,
	aux,
	volume,
	duree,
	depart = 0,
}) => {
	const c = crans(aux.length);
	return (
		<>
			{aux.map((a, i) => (
				<Effet key={i} src={src} a={a} volume={volume} duree={duree} ton={depart + c[i]} />
			))}
		</>
	);
};
