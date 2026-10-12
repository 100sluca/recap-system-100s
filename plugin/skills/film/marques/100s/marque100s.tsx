import React from 'react';
import {interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {TEMPS, TRAINE, clamp} from '../charte';
import {usePosition} from '../elements';

// La marque 100s (luca100s.fr) : le S en pixels « la traînée », le logo « luca100 » + S et le volet
// de pixels. Ce n'est PAS une charte par défaut : à n'utiliser que pour un film de 100s, ou pour la
// signature de 100s dans un duo (references/da.md). nouveau.mjs --da 100s le copie dans src/marque/.

const CENT = {orange: '#ff5f00', encre: '#16110c'} as const;
const POLICE_100S = 'Funnel Display';

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

/**
 * Le S en pixels « la traînée » : les dix carrés se posent dans l'ordre du tracé.
 * Chaque carré arrive orange vif et s'éteint vers sa couleur finale : la tête de
 * la traînée court le long du S.
 */
export const PixelS: React.FC<{
	readonly hauteur: number;
	readonly debut?: number;
	readonly pas?: number;
	readonly ton?: 'clair' | 'sombre';
	readonly encre?: string;
	readonly style?: React.CSSProperties;
}> = ({hauteur, debut = 0, pas = TEMPS / 2, ton = 'clair', encre = CENT.encre, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const u = hauteur / 53;
	const trainee = ton === 'clair' ? TRAINEE_CLAIR : TRAINEE_SOMBRE;
	return (
		<div style={{position: 'relative', width: 42 * u, height: 53 * u, flexShrink: 0, ...style}}>
			{PIXEL_ORDRE.map(([col, row], i) => {
				const d = debut + Math.round(i * pas);
				const p = frame < d ? 0 : spring({frame: frame - d, fps, config: {damping: 200, mass: 0.5}});
				const [pc, pr] = i === 0 ? [col + 1, row] : PIXEL_ORDRE[i - 1];
				const couleur = interpolateColors(frame, [d + 2, d + 10], [CENT.orange, trainee[i] ?? encre]);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: col * 11 * u,
							top: row * 11 * u,
							width: 9 * u,
							height: 9 * u,
							borderRadius: 2.2 * u,
							background: couleur,
							opacity: p > 0.01 ? 1 : 0,
							scale: String(0.3 + 0.7 * p),
							translate: `${(pc - col) * 11 * u * (1 - p)}px ${(pr - row) * 11 * u * (1 - p)}px`,
						}}
					/>
				);
			})}
		</div>
	);
};

/**
 * Le logo complet « luca100 » + S, posé sur la ligne de base comme une lettre.
 * Avec `grand`, le S naît en très grand au centre puis vient prendre sa place de
 * lettre ; « luca100 » sort alors de derrière lui, de droite à gauche.
 */
export const Logo: React.FC<{
	readonly taille: number;
	readonly top: number;
	readonly debutPixels: number;
	readonly pasPixels: number;
	readonly debutTexte: number;
	readonly grand?: {cx: number; cy: number; hauteur: number; debut: number; duree: number};
}> = ({taille, top, debutPixels, pasPixels, debutTexte, grand}) => {
	const frame = useCurrentFrame();
	const ref = React.useRef<HTMLDivElement>(null);
	const pos = usePosition(ref);
	const hS = taille * 0.7;
	const m = grand
		? interpolate(frame, [grand.debut, grand.debut + grand.duree], [0, 1], {...clamp, easing: TRAINE})
		: 1;
	const r = interpolate(frame, [debutTexte, debutTexte + 18], [0, 1], {...clamp, easing: TRAINE});
	let place: React.CSSProperties = {};
	if (grand && pos) {
		const k = grand.hauteur / hS;
		const fx = pos.x + pos.l / 2;
		const fy = pos.y + pos.h / 2;
		place = {
			translate: `${(grand.cx - fx) * (1 - m)}px ${(grand.cy - fy) * (1 - m)}px`,
			scale: String(k + (1 - k) * m),
		};
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: 1920,
				top,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'baseline',
				fontFamily: POLICE_100S,
				fontWeight: 500,
				fontSize: taille,
				lineHeight: 1,
				letterSpacing: '-0.045em',
				color: CENT.encre,
			}}
		>
			<span
				style={{
					display: 'inline-block',
					clipPath: `inset(-20% -4% -30% ${(1 - r) * 100}%)`,
					translate: `${(1 - r) * 0.35}em 0px`,
					opacity: r > 0 ? 1 : 0,
				}}
			>
				<span style={{opacity: 0.45}}>luca</span>
				<span>100</span>
			</span>
			<div
				ref={ref}
				style={{marginLeft: '0.125em', visibility: grand && !pos ? 'hidden' : 'visible', ...place}}
			>
				<PixelS hauteur={hS} debut={debutPixels} pas={pasPixels} />
			</div>
		</div>
	);
};

/**
 * Le volet maison : une grille de carrés arrondis balaie l'écran en diagonale.
 * La tête du balayage est orange et s'éteint vers l'encre, comme la traînée du S ;
 * à mi-course l'écran est couvert, puis les carrés se retirent sur la scène suivante.
 */
export const VoletPixels: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames, width, height} = useVideoConfig();
	const cols = 16;
	const rows = 9;
	const cellule = width / cols;
	const milieu = durationInFrames / 2;
	const montee = 5;
	const etalement = milieu - montee;
	const carres = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const rang = (c + r * 0.9) / (cols - 1 + (rows - 1) * 0.9);
			const d1 = rang * etalement;
			const d2 = milieu + rang * etalement;
			const entre = interpolate(frame, [d1, d1 + montee], [0, 1], {...clamp, easing: TRAINE});
			const sort = interpolate(frame, [d2, d2 + montee], [0, 1], {...clamp, easing: TRAINE});
			const s = entre * (1 - sort);
			if (s <= 0.001) continue;
			const couleur =
				frame < milieu
					? interpolateColors(frame, [d1 + 1, d1 + 7], [CENT.orange, CENT.encre])
					: interpolateColors(frame, [d2 - 3, d2 + 1], [CENT.encre, CENT.orange]);
			carres.push(
				<div
					key={`${r}-${c}`}
					style={{
						position: 'absolute',
						left: c * cellule,
						top: r * cellule,
						width: cellule + 1,
						height: cellule + 1,
						background: couleur,
						scale: String(s),
						borderRadius: interpolate(s, [0.5, 1], [cellule * 0.24, 0], clamp),
					}}
				/>,
			);
		}
	}
	return <div style={{position: 'absolute', width, height, overflow: 'hidden'}}>{carres}</div>;
};
