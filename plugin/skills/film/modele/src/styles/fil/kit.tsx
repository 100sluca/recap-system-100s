import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useDA} from '../../da';
import {lerp, prog} from '../commun';
import {EXPO} from '../interface';

// Le kit du style « Fil conducteur » (styles/fil.md) : la courbe d'un ressort (le point la trace en
// dépassant sa cible), l'anneau de mots qui tourne en 3D autour du point, la trame de points qui
// s'étend depuis le centre.

/** La réponse d'un ressort amorti, de 0 à 1 en u ∈ [0, 1] : dépasse d'environ 12 % puis se pose. */
export const courbeRessort = (u: number) => 1 - Math.exp(-5.2 * u) * Math.cos(9.5 * u);

/**
 * Des mots en capitales posés sur un cercle couché, qui tournent autour du point (perspective CSS) :
 * ceux de devant sont nets et clairs, ceux de derrière plus sombres, vus à l'envers.
 */
export const Anneau: React.FC<{readonly mots: string[]; readonly debut: number; readonly fin: number; readonly couleur: string}> = ({mots, debut, fin, couleur}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const ouvre = prog(f, debut, debut + 22, EXPO);
	const ecarte = prog(f, fin - 14, fin, EXPO);
	const rayon = lerp(lerp(60, 470, ouvre), 1500, ecarte);
	const elements = mots.flatMap((m) => [m.toUpperCase(), '·']);
	const n = elements.length;
	return (
		<div style={{position: 'absolute', inset: 0, perspective: 1900, perspectiveOrigin: '50% 30%'}}>
			<div style={{position: 'absolute', left: 960, top: 540, transformStyle: 'preserve-3d', transform: `rotateX(-14deg) rotateY(${f * 1.25}deg)`}}>
				{elements.map((m, i) => {
					const a = (360 / n) * i;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								transform: `rotateY(${a}deg) translateZ(${rayon}px) translate(-50%, -50%)`,
								fontFamily: da.polices.titre.famille,
								fontWeight: da.polices.titre.graisse ?? 800,
								fontSize: 84,
								letterSpacing: '-0.02em',
								whiteSpace: 'nowrap',
								color: couleur,
								opacity: (1 - ecarte) * Math.min(1, ouvre * 1.5),
								backfaceVisibility: 'visible',
							}}
						>
							{m}
						</div>
					);
				})}
			</div>
		</div>
	);
};

/** La trame : des points sur une grille, qui grossissent au passage d'une onde partie du centre. */
export const Trame: React.FC<{readonly debut: number; readonly couleur: string}> = ({debut, couleur}) => {
	const f = useCurrentFrame();
	const pas = 54;
	const front = (f - debut) * 52;
	const points: React.ReactNode[] = [];
	for (let x = pas / 2; x < 1920; x += pas)
		for (let y = pas / 2; y < 1080; y += pas) {
			const d = Math.hypot(x - 960, y - 540);
			const k = Math.max(0, Math.min(1, (front - d) / 420));
			if (k <= 0) continue;
			const t = pas * 1.5 * k;
			points.push(<div key={`${x}-${y}`} style={{position: 'absolute', left: x - t / 2, top: y - t / 2, width: t, height: t, borderRadius: 999, background: couleur}} />);
		}
	return <div style={{position: 'absolute', inset: 0}}>{points}</div>;
};
