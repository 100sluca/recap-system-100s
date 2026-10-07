import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {TEMPS, clamp, t} from './charte';
import {ETIQUETTES} from './scenes/S1Bruit';

// La bande-son, posée sur la grille de la musique (t(n) = temps n du film).
// Musique et bruitages : la banque-son de l'auteur (non publiée).

const Effet: React.FC<{
	readonly src: string;
	readonly a: number;
	readonly volume: number;
	readonly duree?: number;
}> = ({src, a, volume, duree = 45}) => {
	const {fps} = useVideoConfig();
	return (
		<Sequence from={Math.max(0, a)} durationInFrames={duree} premountFor={fps} name={`son · ${src}`}>
			<Audio
				src={staticFile(`son/${src}`)}
				volume={(f) => volume * interpolate(f, [duree - 10, duree], [1, 0], clamp)}
			/>
		</Sequence>
	);
};

export const Son: React.FC = () => {
	const {durationInFrames, fps} = useVideoConfig();
	const fin = durationInFrames;
	return (
		<>
			{/* musique-qui-bouge.mp3, 105 temps/min : son premier temps tombe sur l'image 0 */}
			<Sequence durationInFrames={fin} premountFor={fps} name="son · musique">
				<Audio
					src={staticFile('son/musique.mp3')}
					trimBefore={10}
					volume={(f) => interpolate(f, [0, 6, fin - 55, fin - 2], [0, 0.72, 0.72, 0], clamp)}
				/>
			</Sequence>

			{/* 1. Le bruit : un clic par annonce, de plus en plus serré */}
			{ETIQUETTES.filter((e) => !e.grand).map((e) => (
				<Effet key={e.id} src="clic.wav" a={e.a} volume={0.09} duree={12} />
			))}
			<Effet src="impact.mp3" a={t(8) - 2} volume={0.5} duree={70} />

			{/* 2. La question */}
			<Effet src="swoosh-1.wav" a={t(8) + t(5) - 4} volume={0.45} />
			<Effet src="swoosh-2.wav" a={t(16) - 12} volume={0.5} />

			{/* 3. Le logo pixel par pixel, puis la promesse */}
			{Array.from({length: 10}).map((_, i) => (
				<Effet key={i} src="clic.wav" a={t(16) + t(0.75) + Math.round((i * TEMPS) / 2)} volume={0.22} duree={14} />
			))}
			<Effet src="zing.mp3" a={t(16) + t(5.5)} volume={0.35} duree={70} />
			<Effet src="pop.mp3" a={t(16) + t(8.75)} volume={0.35} />

			{/* 4. Le site */}
			<Effet src="swoosh-3.wav" a={t(28) - 2} volume={0.45} />

			{/* 5. Les chiffres */}
			{[0.75, 1.25, 1.75, 2.25].map((b) => (
				<Effet key={b} src="clic.wav" a={t(36) + t(b)} volume={0.18} duree={14} />
			))}
			<Effet src="swoosh-2.wav" a={t(44) - 12} volume={0.5} />

			{/* 6. La preuve */}
			<Effet src="swoosh-1.wav" a={t(44) + t(1)} volume={0.3} />
			{[2.25, 2.75, 3.25].map((b) => (
				<Effet key={b} src="pop.mp3" a={t(44) + t(b)} volume={0.3} />
			))}
			<Effet src="valide.mp3" a={t(44) + t(4)} volume={0.5} duree={60} />
			<Effet src="impact.mp3" a={t(44) + t(4)} volume={0.2} duree={40} />
			<Effet src="swoosh-3.wav" a={t(44) + t(8.25) - 3} volume={0.3} />

			{/* 7. Les rubriques : un souffle par page */}
			{[0, 1, 2, 3, 4, 5].map((k) => (
				<Effet key={k} src={`swoosh-${(k % 3) + 1}.wav`} a={t(56) + t(2 * k) - 3} volume={0.32} />
			))}

			{/* 8. Le rythme */}
			<Sequence from={t(68)} durationInFrames={t(8)} premountFor={fps} name="son · tic-tac">
				<Audio
					src={staticFile('son/tic-tac.mp3')}
					volume={(f) => interpolate(f, [0, 6, t(8) - 14, t(8)], [0, 0.3, 0.3, 0], clamp)}
				/>
			</Sequence>
			<Effet src="pop.mp3" a={t(72) + t(0.5)} volume={0.35} />
			<Effet src="swoosh-2.wav" a={t(76) - 12} volume={0.5} />

			{/* 9. Rendez-vous */}
			{Array.from({length: 10}).map((_, i) => (
				<Effet key={i} src="clic.wav" a={t(76) + t(0.4) + Math.round((i * TEMPS) / 4)} volume={0.16} duree={12} />
			))}
			<Effet src="eclat.mp3" a={t(76) + t(1.9)} volume={0.35} duree={90} />
			<Effet src="pop.mp3" a={t(76) + t(4.25)} volume={0.35} />
		</>
	);
};
