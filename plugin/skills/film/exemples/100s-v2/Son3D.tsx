import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {clamp, t} from '../charte';

// La bande-son du film v2, posée sur la grille de la musique (t(n) = temps n).
const Effet: React.FC<{readonly src: string; readonly a: number; readonly volume: number; readonly duree?: number}> = ({
	src,
	a,
	volume,
	duree = 45,
}) => {
	const {fps} = useVideoConfig();
	return (
		<Sequence from={Math.max(0, Math.round(a))} durationInFrames={duree} premountFor={fps} name={`son · ${src}`}>
			<Audio src={staticFile(`son/${src}`)} volume={(f) => volume * interpolate(f, [duree - 10, duree], [1, 0], clamp)} />
		</Sequence>
	);
};

export const Son3D: React.FC = () => {
	const {durationInFrames: fin, fps} = useVideoConfig();
	return (
		<>
			<Sequence durationInFrames={fin} premountFor={fps} name="son · musique">
				<Audio
					src={staticFile('son/musique.mp3')}
					trimBefore={10}
					volume={(f) => interpolate(f, [0, 6, fin - 55, fin - 2], [0, 0.72, 0.72, 0], clamp)}
				/>
			</Sequence>

			{/* 09:00 : un clic par chiffre posé, la bascule, l'élan, l'explosion */}
			{[0, 1, 2, 3, 4].map((o) => (
				<Effet key={o} src="clic.wav" a={t(0.5 + o * 0.55)} volume={0.25} duree={14} />
			))}
			<Effet src="pop.mp3" a={t(5)} volume={0.35} />
			<Effet src="swoosh-2.wav" a={t(7.1)} volume={0.35} />
			<Effet src="impact.mp3" a={t(8) - 2} volume={0.55} duree={75} />

			{/* Le flux */}
			<Effet src="swoosh-1.wav" a={t(9)} volume={0.3} />
			<Effet src="clic.wav" a={t(12)} volume={0.2} duree={14} />

			{/* La source : le balayage, les fiches qui se retournent, le mur */}
			<Effet src="zing.mp3" a={t(21)} volume={0.25} duree={80} />
			{[21.5, 22.5, 23.5, 24.5].map((b) => (
				<Effet key={b} src="pop.mp3" a={t(b)} volume={0.18} />
			))}
			<Effet src="swoosh-2.wav" a={t(26)} volume={0.35} />
			<Effet src="valide.mp3" a={t(27)} volume={0.4} duree={60} />

			{/* Les sujets : les tours se montent */}
			<Effet src="swoosh-1.wav" a={t(32)} volume={0.3} />
			{[32.5, 33, 33.5, 34, 34.5, 35, 35.5, 36].map((b) => (
				<Effet key={b} src="clic.wav" a={t(b)} volume={0.15} duree={14} />
			))}
			<Effet src="clic.wav" a={t(36.5)} volume={0.22} duree={14} />
			<Effet src="clic.wav" a={t(37.5)} volume={0.22} duree={14} />
			{[39, 39.5, 40, 40.5].map((b) => (
				<Effet key={b} src="pop.mp3" a={t(b)} volume={0.2} />
			))}

			{/* L'édition : effondrement, dalle qui se lève, page révélée */}
			<Effet src="swoosh-3.wav" a={t(44)} volume={0.35} />
			<Effet src="swoosh-2.wav" a={t(47)} volume={0.35} />
			<Effet src="pop.mp3" a={t(49)} volume={0.35} />
			<Effet src="eclat.mp3" a={t(49.6)} volume={0.3} duree={80} />

			{/* Le site : un grand souffle par voyage, un pop quand le nom du lieu arrive */}
			{[56.2, 63.6, 71.6, 83.6].map((b, k) => (
				<React.Fragment key={b}>
					<Effet src={`swoosh-${(k % 3) + 1}.wav`} a={t(b)} volume={0.38} />
					<Effet src="impact.mp3" a={t(b + 2)} volume={0.1} duree={30} />
				</React.Fragment>
			))}
			{[58.4, 66.4, 74.4, 86.4].map((b) => (
				<Effet key={`n${b}`} src="pop.mp3" a={t(b)} volume={0.2} />
			))}

			{/* Le S : chaque gros cube qui se pose */}
			<Effet src="swoosh-2.wav" a={t(92)} volume={0.4} />
			{Array.from({length: 10}).map((_, j) => (
				<React.Fragment key={j}>
					<Effet src="clic.wav" a={t(94 + j * 0.5) - 1} volume={0.3} duree={14} />
					<Effet src="impact.mp3" a={t(94 + j * 0.5) - 1} volume={0.12} duree={20} />
				</React.Fragment>
			))}
			<Effet src="eclat.mp3" a={t(99)} volume={0.3} duree={90} />

			{/* Fin : le S rétrécit, les lettres de « luca100 » se lèvent une à une, l'adresse, le bouton */}
			<Effet src="swoosh-3.wav" a={t(104)} volume={0.3} />
			{Array.from({length: 7}).map((_, n) => (
				<Effet key={`l${n}`} src="clic.wav" a={t(105.5 + n * 0.5)} volume={0.25} duree={14} />
			))}
			<Effet src="pop.mp3" a={t(108)} volume={0.3} />
			<Effet src="pop.mp3" a={t(109.5)} volume={0.35} />
		</>
	);
};
