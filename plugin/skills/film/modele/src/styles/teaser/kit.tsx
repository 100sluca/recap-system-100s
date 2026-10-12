import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useDA} from '../../da';
import {prog} from '../commun';
import {EXPO} from '../interface';
import {alpha} from '../keynote/kit';

// Le kit du style « Teaser » (styles/teaser.md) : les faisceaux de lumière qui balaient le noir, et
// le signe du projet (son initiale, ou son logo) dont le contour se trace puis s'embrase.

/** Deux faisceaux de lumière, longs et flous, qui balaient lentement l'écran en diagonale. */
export const Faisceaux: React.FC = () => {
	const f = useCurrentFrame();
	const c = useDA().couleurs;
	const faisceau = (decalage: number, vitesse: number, largeur: number, force: number) => (
		<div
			style={{
				position: 'absolute',
				left: -600 + ((f * vitesse + decalage) % 3200),
				top: -500,
				width: largeur,
				height: 2200,
				rotate: '32deg',
				background: `linear-gradient(90deg, transparent, ${alpha(c.accent, 0.11 * force)}, ${alpha('#ffffff', 0.05 * force)}, transparent)`,
				filter: 'blur(40px)',
			}}
		/>
	);
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
			{faisceau(400, 6, 420, 1)}
			{faisceau(1700, 4.5, 260, 0.7)}
		</div>
	);
};

/** Le signe : un carré arrondi dont le contour se trace (lueur de l'accent), puis l'initiale s'allume. */
export const Signe: React.FC<{readonly nom: string; readonly debut: number; readonly taille: number}> = ({nom, debut, taille}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const trace = prog(f, debut, debut + 26, EXPO);
	const allume = prog(f, debut + 18, debut + 38, EXPO);
	return (
		<div style={{position: 'relative', width: taille, height: taille, filter: `drop-shadow(0 0 ${18 * trace}px ${alpha(c.accent, 0.7)})`}}>
			<svg width={taille} height={taille} viewBox="0 0 100 100" style={{position: 'absolute', inset: 0}}>
				<rect x="4" y="4" width="92" height="92" rx="24" fill="none" stroke={c.accent} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - trace} />
			</svg>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: da.polices.titre.famille,
					fontWeight: 700,
					fontSize: taille * 0.52,
					color: c.encre,
					opacity: allume,
					textShadow: `0 0 ${30 * allume}px ${alpha(c.accent, 0.9)}`,
				}}
			>
				{nom.slice(0, 1).toUpperCase()}
			</div>
		</div>
	);
};
