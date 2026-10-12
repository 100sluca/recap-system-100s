import {CameraMotionBlur} from '@remotion/motion-blur';
import React from 'react';
import {Easing, Img, getInputProps, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useDA} from '../da';
import {lerp, mix, prog} from './commun';

// Les briques communes aux films « produit » (styles keynote, demo, fil, teaser, sequence) : on voit
// le produit s'utiliser. Un curseur qui glisse et clique, une fenêtre Mac, un panneau de verre, le
// halo irisé d'un champ de saisie, du texte qui se tape, et le flou de mouvement qui rend le tout
// « pro ». Tout bouge par l'image courante (jamais d'horloge ni de transition CSS).

/** La courbe d'entrée des plans : arrive vite, décélère longtemps (exponentielle). */
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
/** Départ qui accélère (sortie d'un plan, fouetté de caméra). */
export const FOUET = Easing.bezier(0.7, 0, 0.84, 0);

/**
 * Le flou de mouvement : chaque image est la moyenne de `echantillons` sous-images (obturateur à
 * 180°). Indispensable dès que quelque chose va vite. Coûteux (le rendu est × échantillons) : coupé
 * quand le rendu est lancé avec la prop `rapide` (planches, aperçus de travail). Jamais autour d'un
 * canvas Three.js (un canvas WebGL par échantillon).
 */
export const Flou: React.FC<{readonly children: React.ReactNode; readonly echantillons?: number}> = ({children, echantillons = 6}) => {
	const rapide = Boolean((getInputProps() as {rapide?: boolean}).rapide);
	if (rapide || echantillons <= 1) return <>{children}</>;
	return (
		<CameraMotionBlur shutterAngle={180} samples={echantillons}>
			{children}
		</CameraMotionBlur>
	);
};

/** Une trajectoire de curseur : des clés {f, x, y}, reliées en ease-in-out. */
export type CleCurseur = {f: number; x: number; y: number};
export const suivre = (f: number, cles: CleCurseur[]) => {
	if (f <= cles[0].f) return {x: cles[0].x, y: cles[0].y};
	for (let i = 1; i < cles.length; i++) {
		if (f <= cles[i].f) {
			const k = Easing.bezier(0.45, 0, 0.2, 1)((f - cles[i - 1].f) / Math.max(1, cles[i].f - cles[i - 1].f));
			return {x: lerp(cles[i - 1].x, cles[i].x, k), y: lerp(cles[i - 1].y, cles[i].y, k)};
		}
	}
	return {x: cles[cles.length - 1].x, y: cles[cles.length - 1].y};
};

/**
 * Le curseur macOS (flèche ou main). `appui` : l'image du clic (il s'enfonce, un anneau part).
 * `survol` : de 0 à 1, il grossit un peu au-dessus d'un bouton.
 */
export const Curseur: React.FC<{
	readonly x: number;
	readonly y: number;
	readonly type?: 'fleche' | 'main';
	readonly appui?: number;
	readonly survol?: number;
	readonly taille?: number;
	readonly visible?: number;
}> = ({x, y, type = 'fleche', appui, survol = 0, taille = 34, visible = 1}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const enfonce = appui === undefined ? 0 : Math.sin(Math.PI * prog(f, appui - 2, appui + 5, Easing.linear));
	const anneau = appui === undefined ? 0 : prog(f, appui, appui + 14, EXPO);
	const s = (1 + 0.18 * survol) * (1 - 0.16 * enfonce);
	return (
		<div style={{position: 'absolute', left: x, top: y, zIndex: 60, opacity: visible, pointerEvents: 'none'}}>
			{appui !== undefined && anneau > 0 && anneau < 1 ? (
				<div style={{position: 'absolute', left: -28 * anneau, top: -28 * anneau, width: 56 * anneau, height: 56 * anneau, borderRadius: 99, border: `3px solid ${da.couleurs.accent}`, opacity: 1 - anneau}} />
			) : null}
			<svg width={taille} height={taille * 1.3} viewBox="0 0 24 31" style={{scale: String(s), transformOrigin: '2px 2px', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))', overflow: 'visible'}}>
				{type === 'fleche' ? (
					<path d="M2 2 L2 24 L7.5 18.6 L11.2 27.4 L15 25.8 L11.4 17.2 L19 17.2 Z" fill="#ffffff" stroke="#111111" strokeWidth={1.6} strokeLinejoin="round" />
				) : (
					<path
						d="M8 3.5c0-1.4 2.6-1.4 2.6 0v8.6h.6V9.6c0-1.4 2.6-1.4 2.6 0v2.5h.6v-1.6c0-1.4 2.6-1.4 2.6 0v2h.6v-.9c0-1.4 2.5-1.4 2.5 0V20c0 4-2.6 7.5-7 7.5h-1.5c-2.6 0-4.2-1.3-5.6-3.4L2.6 17.6c-.8-1.2.9-2.6 2.1-1.4L8 19.4z"
						fill="#ffffff"
						stroke="#111111"
						strokeWidth={1.4}
						strokeLinejoin="round"
					/>
				)}
			</svg>
		</div>
	);
};

/** Une fenêtre macOS : barre de titre à trois pastilles, coins arrondis, ombre portée. */
export const FenetreMac: React.FC<{
	readonly largeur: number;
	readonly hauteur: number;
	readonly titre?: string;
	readonly droite?: React.ReactNode;
	readonly sombre?: boolean;
	readonly children: React.ReactNode;
	readonly style?: React.CSSProperties;
}> = ({largeur, hauteur, titre, droite, sombre = false, children, style}) => {
	const da = useDA();
	const fond = sombre ? da.couleurs.surface : '#ffffff';
	return (
		<div
			style={{
				width: largeur,
				height: hauteur,
				borderRadius: 22,
				background: fond,
				overflow: 'hidden',
				boxShadow: sombre ? '0 40px 90px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)' : '0 40px 90px -40px rgba(15,27,45,0.35), 0 0 0 1px rgba(15,27,45,0.07)',
				display: 'flex',
				flexDirection: 'column',
				...style,
			}}
		>
			<div style={{height: 46, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', borderBottom: `1px solid ${da.couleurs.filet}`, flexShrink: 0}}>
				{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
					<span key={c} style={{width: 13, height: 13, borderRadius: 99, background: sombre ? 'rgba(255,255,255,0.18)' : c}} />
				))}
				<span style={{marginLeft: 14, fontFamily: da.polices.texte.famille, fontSize: 17, color: da.couleurs.doux}}>{titre}</span>
				<span style={{marginLeft: 'auto'}}>{droite}</span>
			</div>
			<div style={{position: 'relative', flex: 1}}>{children}</div>
		</div>
	);
};

/** Un panneau de verre dépoli (le look « keynote ») : flou de ce qui est derrière, liseré clair. */
export const Verre: React.FC<{readonly children?: React.ReactNode; readonly style?: React.CSSProperties; readonly sombre?: boolean}> = ({children, style, sombre = false}) => (
	<div
		style={{
			background: sombre ? 'rgba(30,30,34,0.55)' : 'rgba(255,255,255,0.62)',
			backdropFilter: 'blur(28px) saturate(160%)',
			border: sombre ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.75)',
			borderRadius: 26,
			boxShadow: sombre ? '0 30px 70px -30px rgba(0,0,0,0.7)' : '0 30px 70px -34px rgba(15,27,45,0.35)',
			...style,
		}}
	>
		{children}
	</div>
);

/**
 * Le halo irisé derrière un champ de saisie (comme les champs « IA ») : un dégradé conique flou
 * qui tourne lentement. Ses couleurs viennent de la DA (accent, accent2) et de deux teintes voisines.
 */
export const Halo: React.FC<{readonly largeur: number; readonly hauteur: number; readonly rayon: number; readonly force?: number}> = ({largeur, hauteur, rayon, force = 1}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	return (
		<div
			style={{
				position: 'absolute',
				left: -18,
				top: -18,
				width: largeur + 36,
				height: hauteur + 36,
				borderRadius: rayon + 18,
				background: `conic-gradient(from ${f * 2}deg, ${c.accent}, ${c.accent2}, ${mix(c.accent, '#ffffff', 0.5)}, ${mix(c.accent2, c.accent, 0.5)}, ${c.accent})`,
				filter: 'blur(26px)',
				opacity: 0.55 * force,
			}}
		/>
	);
};

/** Le texte tapé à l'image f : `vitesse` signes par image à partir de `debut`. */
export const tape = (texte: string, f: number, debut: number, vitesse = 0.9) => texte.slice(0, Math.max(0, Math.floor((f - debut) * vitesse)));

/** Le curseur de texte, qui clignote quand on ne tape pas. */
export const Caret: React.FC<{readonly hauteur: number; readonly fixe?: boolean}> = ({hauteur, fixe = false}) => {
	const f = useCurrentFrame();
	const da = useDA();
	return <span style={{display: 'inline-block', width: Math.max(2, hauteur * 0.07), height: hauteur, background: da.couleurs.accent, marginLeft: 3, verticalAlign: 'middle', opacity: fixe || Math.floor(f / 9) % 2 === 0 ? 1 : 0}} />;
};

/** L'icône du produit : le logo de la DA s'il existe, sinon un carré arrondi avec l'initiale. */
export const IconeProduit: React.FC<{readonly nom: string; readonly taille: number; readonly fond?: string; readonly style?: React.CSSProperties}> = ({nom, taille, fond, style}) => {
	const da = useDA();
	if (da.logo)
		return (
			<div style={{width: taille, height: taille, borderRadius: taille * 0.24, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
				<Img src={staticFile(da.logo)} style={{maxWidth: taille * 0.72, maxHeight: taille * 0.72}} />
			</div>
		);
	return (
		<div
			style={{
				width: taille,
				height: taille,
				borderRadius: taille * 0.24,
				background: fond ?? da.couleurs.encre,
				color: da.couleurs.fond,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: da.polices.titre.famille,
				fontWeight: 700,
				fontSize: taille * 0.5,
				boxShadow: `0 ${taille * 0.12}px ${taille * 0.3}px -${taille * 0.1}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
				...style,
			}}
		>
			{nom.slice(0, 1).toUpperCase()}
		</div>
	);
};

/** Un texte qui monte d'une ligne de masque en se défloutant (entrée des grandes phrases). */
export const Phrase: React.FC<{readonly debut: number; readonly children: React.ReactNode; readonly duree?: number; readonly style?: React.CSSProperties}> = ({debut, children, duree = 16, style}) => {
	const f = useCurrentFrame();
	const k = prog(f, debut, debut + duree, EXPO);
	return (
		<div style={{overflow: 'hidden', paddingBottom: '0.1em', ...style}}>
			<div style={{translate: `0px ${(1 - k) * 100}%`, filter: k < 1 ? `blur(${(1 - k) * 10}px)` : undefined, opacity: interpolate(k, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'})}}>{children}</div>
		</div>
	);
};
