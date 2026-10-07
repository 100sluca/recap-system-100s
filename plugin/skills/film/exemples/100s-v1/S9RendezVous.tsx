import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, TRAINE, clamp, t} from '../charte';
import {FlecheDiag, Logo, entree} from '../elements';

// Le rendez-vous : le logo se redessine, l'adresse, le bouton du site.
export const S9RendezVous: React.FC<{readonly edition: number}> = ({edition}) => {
	const frame = useCurrentFrame();
	const n = String(edition).padStart(2, '0');
	const pop = interpolate(frame, [t(4.25), t(4.25) + 10], [0.85, 1], {...clamp, easing: TRAINE});
	return (
		<AbsoluteFill data-scene style={{background: C.papier}}>
			<Logo taille={150} top={190} debutPixels={t(0.4)} pasPixels={TEMPS / 4} debutTexte={t(1.9)} />
			<div
				style={{
					position: 'absolute',
					top: 420,
					left: 0,
					width: 1920,
					textAlign: 'center',
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 210,
					lineHeight: 1,
					letterSpacing: '-0.05em',
					color: C.encre,
					...entree(frame, t(2.75), 16, 80),
				}}
			>
				luca100s.fr
			</div>
			<div
				style={{
					position: 'absolute',
					top: 740,
					left: 0,
					width: 1920,
					display: 'flex',
					justifyContent: 'center',
					...entree(frame, t(4.25), 12, 40),
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 30,
						background: C.encre,
						borderRadius: 999,
						padding: '14px 14px 14px 48px',
						scale: String(pop),
					}}
				>
					<span
						style={{
							fontFamily: POLICE.titre,
							fontWeight: 600,
							fontSize: 44,
							letterSpacing: '-0.03em',
							color: C.blanc,
						}}
					>
						Lire l'édition #{n}
					</span>
					<span
						style={{
							width: 84,
							height: 84,
							borderRadius: 42,
							background: C.orange,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FlecheDiag taille={42} couleur={C.blanc} />
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
