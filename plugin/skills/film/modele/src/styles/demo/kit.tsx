import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {useDA} from '../../da';
import {lerp, mix, prog} from '../commun';
import {EXPO} from '../interface';

// Le kit du style « Démo produit » (styles/demo.md) : le projecteur (un halo doux au centre du noir),
// l'étiquette d'étape numérotée, la légende dont les derniers mots s'allument dans l'accent, la
// ligne d'outil qui tourne puis se coche.

/** Le halo doux au centre du fond noir (un projecteur, pas un dégradé décoratif). */
export const Projecteur: React.FC = () => {
	const c = useDA().couleurs;
	return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(55% 50% at 50% 46%, ${mix(c.fond, '#ffffff', 0.07)}, ${c.fond} 72%)`}} />;
};

/** L'étiquette d'étape : « 01 · DEMANDE » (le numéro sur une pastille de l'accent). */
export const Etape: React.FC<{readonly numero: string; readonly texte: string; readonly debut: number}> = ({numero, texte, debut}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const k = prog(f, debut, debut + 14, EXPO);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: k, translate: `0px ${lerp(14, 0, k)}px`, fontFamily: da.polices.mono.famille, fontSize: 24, letterSpacing: '0.12em', textTransform: 'uppercase', color: da.couleurs.doux}}>
			<span style={{padding: '4px 10px', borderRadius: 6, background: da.couleurs.accent, color: da.couleurs.surAccent, letterSpacing: 0}}>{numero}</span>
			{texte}
		</div>
	);
};

/** La légende sous l'image : les `fort` derniers mots (2 par défaut) passent dans l'accent. */
export const Legende: React.FC<{readonly texte: string; readonly debut: number; readonly fort?: number; readonly grand?: boolean}> = ({texte, debut, fort = 2, grand = false}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const mots = texte.split(' ');
	return (
		<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.28em', fontFamily: da.polices.texte.famille, fontSize: grand ? 46 : 40, color: da.couleurs.encre, maxWidth: 1500}}>
			{mots.map((m, i) => {
				const k = prog(f, debut + i * 2, debut + i * 2 + 14, EXPO);
				const allume = i >= mots.length - fort ? prog(f, debut + mots.length * 2 + 4, debut + mots.length * 2 + 12) : 0;
				return (
					<span key={i} style={{opacity: k, translate: `0px ${lerp(18, 0, k)}px`, color: allume > 0 ? mix(da.couleurs.encre, da.couleurs.accent, allume) : undefined}}>
						{m}
					</span>
				);
			})}
		</div>
	);
};

/** Une ligne d'outil : un cercle qui tourne pendant 8 images, puis une coche ; le texte en mono. */
export const Outil: React.FC<{readonly texte: string; readonly debut: number}> = ({texte, debut}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const k = prog(f, debut, debut + 10, EXPO);
	const fini = f >= debut + 8;
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: k, translate: `${lerp(-16, 0, k)}px 0px`, fontFamily: da.polices.mono.famille, fontSize: 24, color: c.doux}}>
			{fini ? (
				<svg width={26} height={26} viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="11" fill={c.accent} />
					<path d="M7 12.5l3.2 3.2L17 9" stroke={c.surAccent} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			) : (
				<svg width={26} height={26} viewBox="0 0 24 24" style={{rotate: `${f * 24}deg`}}>
					<circle cx="12" cy="12" r="9" stroke={c.pale} strokeWidth={3} fill="none" />
					<path d="M12 3a9 9 0 019 9" stroke={c.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
				</svg>
			)}
			<span style={{color: fini ? c.encre : c.doux}}>{texte}</span>
			<span style={{marginLeft: 'auto', opacity: fini ? prog(f, debut + 8, debut + 14, Easing.linear) : 0, color: c.pale}}>ok</span>
		</div>
	);
};
