import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {FPS, MUSIQUE, PREMIER_TEMPS, clamp} from './charte';
import {SONS} from './reglages';

// La musique (son premier temps tombe sur l'image 0) et les bruitages posés sur la grille t(n).
// Les sons sont dans public/son/ (copiés de la banque-son de l'utilisateur par outils/nouveau.mjs).
// Sans musique (film muet) ou sans un bruitage, le composant ne joue rien.

export const Musique: React.FC<{readonly volume?: number}> = ({volume = 0.72}) => {
	const {durationInFrames: fin, fps} = useVideoConfig();
	if (!MUSIQUE) return null;
	return (
		<Sequence durationInFrames={fin} premountFor={fps} name="son · musique">
			<Audio
				src={staticFile(MUSIQUE)}
				trimBefore={Math.round(PREMIER_TEMPS * FPS)}
				volume={(f) => interpolate(f, [0, 6, fin - 55, fin - 2], [0, volume, volume, 0], clamp)}
			/>
		</Sequence>
	);
};

/** Un bruitage à l'image `a` (en général t(n)), coupé en fondu après `duree` images. */
export const Effet: React.FC<{readonly src: string; readonly a: number; readonly volume: number; readonly duree?: number}> = ({
	src,
	a,
	volume,
	duree = 45,
}) => {
	const {fps} = useVideoConfig();
	if (!SONS.includes(src)) return null;
	return (
		<Sequence from={Math.max(0, Math.round(a))} durationInFrames={duree} premountFor={fps} name={`son · ${src}`}>
			<Audio src={staticFile(`son/${src}`)} volume={(f) => volume * interpolate(f, [duree - 10, duree], [1, 0], clamp)} />
		</Sequence>
	);
};
