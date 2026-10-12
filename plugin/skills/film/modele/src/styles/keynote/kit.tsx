import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useDA} from '../../da';
import {mix} from '../commun';
import {IconeProduit} from '../interface';

// Le kit du style « Keynote » (styles/keynote.md) : la brume lumineuse du fond, la barre de menu
// d'un Mac, l'icône du produit avec ses satellites. Le reste vient de ../interface.tsx (curseur,
// verre, halo, texte tapé, flou de mouvement).

/** Une couleur #rrggbb avec une opacité. */
export const alpha = (hex: string, a: number) => {
	const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
};

/** Le fond clair et sa brume de l'accent, qui dérive lentement (pas un fond animé : un décor qui respire). */
export const Brume: React.FC = () => {
	const f = useCurrentFrame();
	const c = useDA().couleurs;
	const x = 28 + Math.sin(f / 60) * 4;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: `radial-gradient(60% 55% at ${x}% 18%, ${alpha(c.accent, 0.16)}, transparent 70%), radial-gradient(50% 45% at 78% 90%, ${alpha(c.accent2, 0.14)}, transparent 70%), ${c.fond}`,
			}}
		/>
	);
};

/** Le fond d'écran d'un Mac, tiré de l'accent (clair en haut, profond en bas). */
export const FondEcran: React.FC = () => {
	const c = useDA().couleurs;
	return <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${mix(c.accent, '#ffffff', 0.72)} 0%, ${mix(c.accent, '#ffffff', 0.25)} 45%, ${mix(c.accent, '#000000', 0.45)} 100%)`}} />;
};

/** La barre de menu d'un Mac, avec l'icône du produit (à x = 1585) et l'heure. */
export const BarreMenu: React.FC<{readonly nom: string; readonly actif?: number}> = ({nom, actif = 0}) => {
	const da = useDA();
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				height: 42,
				background: 'rgba(255,255,255,0.55)',
				backdropFilter: 'blur(20px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'flex-end',
				gap: 26,
				padding: '0 28px',
				fontFamily: da.polices.texte.famille,
				fontSize: 19,
				color: '#1d1d1f',
				zIndex: 20,
			}}
		>
			<div style={{position: 'absolute', left: 1566, top: 5, width: 40, height: 32, borderRadius: 8, background: `rgba(0,0,0,${0.12 * actif})`}} />
			<IconeProduit nom={nom} taille={26} fond={da.couleurs.accent} style={{position: 'absolute', left: 1573, top: 8, boxShadow: 'none'}} />
			<svg width={22} height={18} viewBox="0 0 22 18" style={{marginLeft: 60}}>
				<path d="M11 15.5l2.2-2.6a3.2 3.2 0 00-4.4 0zM5.6 10.4l1.9 2a5 5 0 017 0l1.9-2a7.8 7.8 0 00-10.8 0zM2.2 6.9l1.9 2a9.8 9.8 0 0113.8 0l1.9-2a12.5 12.5 0 00-17.6 0z" fill="#1d1d1f" />
			</svg>
			<svg width={30} height={15} viewBox="0 0 30 15">
				<rect x="0.75" y="0.75" width="25" height="13.5" rx="4" fill="none" stroke="#1d1d1f" strokeWidth="1.5" />
				<rect x="3" y="3" width="18" height="9" rx="2" fill="#1d1d1f" />
				<rect x="27" y="5" width="2" height="5" rx="1" fill="#1d1d1f" />
			</svg>
			<span>lun. 12 oct. 9:41</span>
		</div>
	);
};
