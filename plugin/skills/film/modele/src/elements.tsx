import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {
	Img,
	continueRender,
	delayRender,
	interpolate,
	interpolateColors,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	C,
	PIXEL_ORDRE,
	POLICE,
	TEMPS,
	TRAINE,
	TRAINEE_CLAIR,
	TRAINEE_SOMBRE,
	clamp,
} from './charte';

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

/** Étiquette en chasse fixe, comme sur le site : « ■ VEILLE », « [ 100S EN CHIFFRES ] ». */
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
				<span style={{width: 13, height: 13, background: C.orange, flexShrink: 0}} />
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
 * Le surlignage du site : un bloc plein se déploie de gauche à droite derrière
 * les mots, puis le texte monte dedans.
 */
export const Bloc: React.FC<{
	readonly children: React.ReactNode;
	readonly debut: number;
	readonly fond?: string;
	readonly couleur?: string;
	readonly duree?: number;
	readonly style?: React.CSSProperties;
}> = ({children, debut, fond = C.orange, couleur = C.blanc, duree = 12, style}) => {
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
}> = ({hauteur, debut = 0, pas = TEMPS / 2, ton = 'clair', encre = C.encre, style}) => {
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
				const couleur = interpolateColors(frame, [d + 2, d + 10], [C.orange, trainee[i] ?? encre]);
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
				fontFamily: POLICE.titre,
				fontWeight: 500,
				fontSize: taille,
				lineHeight: 1,
				letterSpacing: '-0.045em',
				color: C.encre,
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
 * Compteur à rouleaux en Doto, comme les chiffres de luca100s.fr : chaque chiffre
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
				fontFamily: POLICE.points,
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
				background: C.papier,
				boxShadow:
					'0 50px 100px -40px rgba(22,17,12,0.45), 0 18px 36px -18px rgba(22,17,12,0.25), 0 0 0 1px rgba(22,17,12,0.08)',
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

/** Flèche ↗ des boutons du site. */
export const FlecheDiag: React.FC<{readonly taille: number; readonly couleur: string}> = ({
	taille,
	couleur,
}) => (
	<svg width={taille} height={taille} viewBox="0 0 24 24" fill="none">
		<path d="M7 17L17 7M9 7h8v8" stroke={couleur} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

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
					? interpolateColors(frame, [d1 + 1, d1 + 7], [C.orange, C.encre])
					: interpolateColors(frame, [d2 - 3, d2 + 1], [C.encre, C.orange]);
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
