import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {C, POLICE, TRAINE, clamp, t} from '../charte';
import {Odometre, entree} from '../elements';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const Ligne: React.FC<{
	readonly debut: number;
	readonly fin?: number;
	readonly chiffres: React.ReactNode;
	readonly texte: string;
}> = ({debut, fin, chiffres, texte}) => {
	const frame = useCurrentFrame();
	const sort = fin === undefined ? 0 : interpolate(frame, [fin, fin + 9], [0, 1], {...clamp, easing: TRAINE});
	if (frame < debut) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 250,
				width: 1920,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 40,
				opacity: 1 - sort,
				translate: `0px ${-sort * 90}px`,
			}}
		>
			<div style={{...entree(frame, debut, 12, 60), color: C.orange, fontSize: 170}}>{chiffres}</div>
			<div
				style={{
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 118,
					lineHeight: 1,
					letterSpacing: '-0.045em',
					color: C.papier,
					...entree(frame, debut + 5, 14, 60),
				}}
			>
				{texte}
			</div>
		</div>
	);
};

// La respiration : le rendez-vous quotidien, puis l'édition du lundi.
export const S8Rythme: React.FC<{readonly edition: number}> = ({edition}) => {
	const frame = useCurrentFrame();
	const n = String(edition).padStart(2, '0');
	const avant = String(Math.max(0, edition - 1)).padStart(2, '0');
	const bascule = t(4);
	return (
		<AbsoluteFill style={{background: C.encre}}>
			<Ligne
				debut={0}
				fin={bascule}
				texte="Chaque matin, la veille."
				chiffres={<Odometre valeur="09:00" depuis="08:59" debut={t(0.75)} />}
			/>
			<Ligne
				debut={bascule}
				texte="Chaque lundi, l'édition."
				chiffres={<Odometre valeur={`#${n}`} depuis={`#${avant}`} debut={bascule + t(0.5)} />}
			/>
			{/* La semaine en pixels : les jours passent, puis lundi s'allume. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 770,
					width: 1920,
					display: 'flex',
					justifyContent: 'center',
					gap: 20,
					...entree(frame, t(0.5), 12, 20),
				}}
			>
				{JOURS.map((j, i) => {
					const allume = t(0.75 + i * 0.45);
					const lundi = i === 0 && frame >= bascule + t(0.5);
					const couleur = lundi
						? C.orange
						: frame < bascule
							? interpolateColors(frame, [allume, allume + 3, allume + 12], [
									'rgba(242,241,237,0.10)',
									C.orange,
									'rgba(242,241,237,0.45)',
								])
							: 'rgba(242,241,237,0.12)';
					return (
						<div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
							<div
								style={{
									width: 58,
									height: 58,
									borderRadius: 13,
									background: couleur,
									scale: lundi
										? String(interpolate(frame, [bascule + t(0.5), bascule + t(0.5) + 8], [1.5, 1], clamp))
										: '1',
								}}
							/>
							<div
								style={{
									fontFamily: POLICE.mono,
									fontSize: 20,
									color: lundi ? C.orange : 'rgba(242,241,237,0.5)',
								}}
							>
								{j}
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
