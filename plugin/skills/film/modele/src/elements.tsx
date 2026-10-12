import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, POLICE, TRAINE, clamp} from './charte';

// Les éléments de base, communs à tous les styles : ils prennent les couleurs de la DA du film par
// rôle (C.fond, C.accent…). Les kits propres à un style sont dans src/styles/<id>/.

/**
 * Position d'un élément dans la scène (racine marquée data-scene), lue sur la mise
 * en page (offsetLeft/offsetTop : insensibles aux transformations et au zoom du Studio).
 * Le rendu attend les polices avant la première mesure.
 */
export const usePosition = (ref: React.RefObject<HTMLElement | null>) => {
	const [pos, setPos] = useState<{x: number; y: number; l: number; h: number} | null>(null);
	const [attente] = useState(() => delayRender('Mesure après chargement des polices'));
	const mesurer = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		let x = 0;
		let y = 0;
		let n: HTMLElement | null = el;
		while (n && n.dataset.scene === undefined) {
			x += n.offsetLeft;
			y += n.offsetTop;
			n = n.offsetParent as HTMLElement | null;
		}
		const v = {x, y, l: el.offsetWidth, h: el.offsetHeight};
		setPos((p) => (p && p.x === v.x && p.y === v.y && p.l === v.l && p.h === v.h ? p : v));
	}, [ref]);
	useLayoutEffect(() => {
		mesurer();
	});
	useEffect(() => {
		document.fonts.ready.then(() => {
			mesurer();
			continueRender(attente);
		});
	}, [attente, mesurer]);
	return pos;
};

/** Entrée d'un fragment : montée, fondu et flou qui se lève, en longue traîne. */
export const entree = (
	frame: number,
	debut: number,
	duree = 14,
	distance = 40,
): React.CSSProperties => {
	const p = interpolate(frame, [debut, debut + duree], [0, 1], {...clamp, easing: TRAINE});
	return {
		opacity: p,
		translate: `0px ${(1 - p) * distance}px`,
		filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
	};
};

/** Étiquette en chasse fixe : « ■ VEILLE », « [ EN CHIFFRES ] ». */
export const Etiquette: React.FC<{
	readonly children: React.ReactNode;
	readonly debut?: number;
	readonly couleur?: string;
	readonly puce?: boolean;
	readonly style?: React.CSSProperties;
}> = ({children, debut = 0, couleur = C.encre, puce = true, style}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				fontFamily: POLICE.mono,
				fontSize: 24,
				letterSpacing: '0.06em',
				textTransform: 'uppercase',
				color: couleur,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				...entree(frame, debut, 12, 14),
				...style,
			}}
		>
			{puce ? (
				<span style={{width: 13, height: 13, background: C.accent, flexShrink: 0}} />
			) : null}
			{children}
		</div>
	);
};

/** Une ligne qui entre mot à mot, un mot tous les `pas` images. */
export const Mots: React.FC<{
	readonly texte: string;
	readonly debut: number;
	readonly pas: number;
	readonly style?: React.CSSProperties;
}> = ({texte, debut, pas, style}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{display: 'flex', flexWrap: 'wrap', columnGap: '0.24em', ...style}}>
			{texte.split(' ').map((mot, i) => (
				<span key={i} style={{display: 'inline-block', ...entree(frame, debut + i * pas, 14, 50)}}>
					{mot}
				</span>
			))}
		</div>
	);
};

/**
 * Le surlignage : un bloc plein se déploie de gauche à droite derrière
 * les mots, puis le texte monte dedans.
 */
export const Bloc: React.FC<{
	readonly children: React.ReactNode;
	readonly debut: number;
	readonly fond?: string;
	readonly couleur?: string;
	readonly duree?: number;
	readonly style?: React.CSSProperties;
}> = ({children, debut, fond = C.accent, couleur = C.surAccent, duree = 12, style}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [debut, debut + duree], [0, 1], {...clamp, easing: TRAINE});
	const q = interpolate(frame, [debut + duree * 0.3, debut + duree * 1.2], [0, 1], {
		...clamp,
		easing: TRAINE,
	});
	return (
		<span
			style={{
				position: 'relative',
				display: 'inline-block',
				padding: '0.04em 0.13em 0.12em',
				clipPath: 'inset(0)',
				...style,
			}}
		>
			<span
				style={{
					position: 'absolute',
					inset: 0,
					background: fond,
					scale: `${p} 1`,
					transformOrigin: 'left center',
				}}
			/>
			<span
				style={{
					position: 'relative',
					display: 'inline-block',
					color: couleur,
					opacity: q,
					translate: `0px ${(1 - q) * 0.6}em`,
				}}
			>
				{children}
			</span>
		</span>
	);
};

/** Un chiffre qui roule de `de` à `a` (colonne 0→9 comme le compteur du site). */
const Rouleau: React.FC<{readonly de: number; readonly a: number; readonly p: number}> = ({de, a, p}) => {
	const cible = a >= de ? a : a + 10;
	const position = de + (cible - de) * p;
	return (
		<span style={{position: 'relative', display: 'inline-block', height: '1em', overflow: 'hidden'}}>
			<span style={{display: 'flex', flexDirection: 'column', translate: `0px ${-position}em`}}>
				{Array.from({length: 20}).map((_, d) => (
					<span key={d} style={{height: '1em', lineHeight: 1}}>
						{d % 10}
					</span>
				))}
			</span>
		</span>
	);
};

/**
 * Compteur à rouleaux (police des chiffres de la DA) : chaque chiffre
 * roule depuis `depuis` (0 par défaut) jusqu'à sa valeur ; le dernier chiffre part en premier.
 */
export const Odometre: React.FC<{
	readonly valeur: string;
	readonly debut: number;
	readonly depuis?: string;
	readonly style?: React.CSSProperties;
}> = ({valeur, debut, depuis, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const chars = valeur.split('');
	const avant = (depuis ?? valeur.replace(/\d/g, '0')).padStart(chars.length, '0').split('');
	return (
		<span
			style={{
				fontFamily: POLICE.chiffres,
				fontWeight: 900,
				display: 'inline-flex',
				lineHeight: 1,
				...style,
			}}
		>
			{chars.map((c, i) => {
				if (!/\d/.test(c)) return <span key={i}>{c}</span>;
				const retard = debut + Math.round(0.08 * fps * (chars.length - 1 - i));
				const p =
					frame < retard
						? 0
						: spring({frame: frame - retard, fps, config: {stiffness: 60, damping: 18, mass: 1}});
				const de = Number(avant[i]) || 0;
				// Depuis zéro : un tour complet avant la valeur, comme sur le site.
				const a = depuis === undefined ? Number(c) + 10 : Number(c);
				return <Rouleau key={i} de={de} a={a} p={p} />;
			})}
		</span>
	);
};

/** Une capture du vrai site dans une carte arrondie, sans chrome de navigateur inventé. */
export const Fenetre: React.FC<{
	readonly src: string;
	readonly largeur: number;
	readonly hauteur: number;
	readonly defilement?: number; // en pixels de la capture (1920 de large)
	readonly style?: React.CSSProperties;
}> = ({src, largeur, hauteur, defilement = 0, style}) => {
	const echelle = largeur / 1920;
	return (
		<div
			style={{
				width: largeur,
				height: hauteur,
				borderRadius: 20,
				overflow: 'hidden',
				background: C.fond,
				boxShadow:
					'0 50px 100px -40px rgba(0,0,0,0.45), 0 18px 36px -18px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
				...style,
			}}
		>
			<Img
				src={staticFile(src)}
				style={{display: 'block', width: largeur, translate: `0px ${-defilement * echelle}px`}}
			/>
		</div>
	);
};

/** Flèche ↗ (bouton, lien). */
export const FlecheDiag: React.FC<{readonly taille: number; readonly couleur: string}> = ({
	taille,
	couleur,
}) => (
	<svg width={taille} height={taille} viewBox="0 0 24 24" fill="none">
		<path d="M7 17L17 7M9 7h8v8" stroke={couleur} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
