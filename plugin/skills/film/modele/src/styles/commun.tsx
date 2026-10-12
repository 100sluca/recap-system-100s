import React, {useEffect, useState} from 'react';
import {Easing, continueRender, delayRender, interpolate, spring} from 'remotion';
import type {DA} from '../da';
import catalogue from './catalogue.json';

// Ce que partagent les styles : le contenu d'un aperçu, la légende du catalogue, quelques outils
// de mouvement. Chaque style a son dossier : kit.tsx (ses briques, réutilisables dans un vrai film)
// et Apercu.tsx (6 secondes pour le montrer). Ses règles : styles/<id>.md dans le skill.

export type StyleCatalogue = {
	id: string;
	numero: number;
	nom: string;
	accroche: string;
	pour: string;
	dimension: string;
	tempo: string;
	references?: string;
	duree: number; // durée de l'aperçu, en images (30 par seconde)
	apercu?: boolean; // false : pas d'aperçu
	option?: boolean; // true : proposé à part, plus long à faire et à rendre (court-métrage 3D)
	vignette?: number; // où prendre la vignette du catalogue, en part de l'aperçu (0,42 par défaut)
	masque?: boolean; // true : jamais proposé d'office
	da: DA;
};
export const CATALOGUE = catalogue as unknown as StyleCatalogue[];
export const styleDe = (id: string) => CATALOGUE.find((s) => s.id === id)!;

/** Le contenu d'un aperçu : le même pour tous les styles, pour comparer les styles et pas les textes. */
export type Contenu = {
	nom: string; // le nom du projet
	phrase: string; // ce qu'il fait, en une phrase courte
	question: string; // une demande qu'on lui fait (le style « Fil de messages » l'écrit)
	reponse: string; // sa réponse
	chiffre: {valeur: string; libelle: string}; // un vrai chiffre du projet
	mots: [string, string, string]; // trois mots-clés (étapes, modules, rubriques)
	adresse: string; // l'adresse ou la commande de fin
	accroche?: string; // une accroche courte (une question, un constat) ; sinon la phrase
};

// L'exemple livré : le récap lui-même (que du vrai).
export const CONTENU_EXEMPLE: Contenu = {
	nom: 'recap-system',
	phrase: 'Ton projet, raconté en 5 pièces.',
	question: 'Fais la vidéo du projet',
	reponse: "C'est parti. Choisis d'abord son style.",
	chiffre: {valeur: '5', libelle: 'pièces dans le récap'},
	mots: ['Démarrer', 'Fabrication', 'Vidéo'],
	adresse: '/recap-system-100s -v',
	accroche: 'Et la vidéo du projet ?',
};

export type ApercuProps = {da: DA; contenu: Contenu; legende: string | null};

// ─── Adapter une DA à un style ────────────────────────────────────────────────────────────────
// Une DA de marque appliquée telle quelle aplatit les styles (tout devient « fond blanc + accent »).
// Chaque style la réinterprète avec les seules couleurs de la marque (et du noir, du blanc) :
// la typo l'inverse (fond = son encre), le plan en fait un plan de nuit teinté de l'accent, le pop
// met l'accent en aplat. Une palette de style (source « style ») est déjà faite pour lui : inchangée.
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (v: number[]) => '#' + v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
/** Mélange deux couleurs #rrggbb (k = 0 : a, k = 1 : b). */
export const mix = (a: string, b: string, k: number) => (/^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b) ? hex(rgb(a).map((x, i) => x + (rgb(b)[i] - x) * k)) : a);
export const luminance = (h: string) => {
	if (!/^#[0-9a-f]{6}$/i.test(h)) return 0.5;
	const [r, g, b] = rgb(h).map((x) => {
		const s = x / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
/** Le texte lisible sur une couleur : blanc ou presque noir. */
const lisibleSur = (fond: string, sombre = '#111111') => (contraste('#ffffff', fond) >= contraste(sombre, fond) ? '#ffffff' : sombre);
const filetDe = (h: string, a: number) => {
	const [r, g, b] = rgb(h);
	return `rgba(${r},${g},${b},${a})`;
};

export const adapterDA = (id: string, da: DA): DA => {
	if (da.source === 'style') return da;
	const c = da.couleurs;
	const claire = luminance(c.fond) > 0.4;
	const sombre = claire ? (luminance(c.encre) < 0.1 ? c.encre : mix(c.encre, '#000000', 0.5)) : c.fond;
	const lumineuse = claire ? c.fond : (luminance(c.encre) > 0.6 ? c.encre : '#f5f5f5');
	// Les polices de la marque restent les siennes, toujours ; seules les couleurs changent de rôle.
	const avec = (couleurs: Partial<DA['couleurs']>): DA => ({...da, couleurs: {...c, ...couleurs}});
	// Versions claire et sombre de la marque, pour les styles qui imposent l'une ou l'autre.
	const versClair = (fond: string): DA['couleurs'] => ({
		...c,
		fond,
		surface: claire ? c.surface : '#ffffff',
		encre: claire ? c.encre : sombre,
		doux: claire ? c.doux : mix(sombre, fond, 0.4),
		pale: claire ? c.pale : mix(sombre, fond, 0.62),
		accent: contraste(c.accent, fond) > 2.2 ? c.accent : mix(c.accent, '#000000', 0.3),
		filet: filetDe(claire ? c.encre : sombre, 0.08),
	});
	const versSombre = (fond: string): DA['couleurs'] => {
		const accent = contraste(c.accent, fond) > 3 ? c.accent : mix(c.accent, '#ffffff', 0.45);
		return {
			...c,
			fond,
			surface: mix(fond, '#ffffff', 0.07),
			encre: lumineuse,
			doux: mix(lumineuse, fond, 0.38),
			pale: mix(lumineuse, fond, 0.62),
			accent,
			surAccent: lisibleSur(accent, fond),
			accent2: lumineuse,
			filet: filetDe(lumineuse, 0.1),
		};
	};
	switch (id) {
		case 'keynote':
			// Clair et lumineux : le fond de la marque à peine teinté de son accent (ou un blanc bleuté).
			return avec(versClair(claire ? mix(c.fond, c.accent, 0.03) : mix('#f5f6f8', c.accent, 0.04)));
		case 'sequence':
			// Le blanc, ou le fond clair de la marque.
			return avec(versClair(claire ? c.fond : '#ffffff'));
		case 'demo':
			// Le noir chaud de la démo : l'encre de la marque, assombrie.
			return avec(versSombre(claire ? mix(sombre, '#000000', 0.45) : c.fond));
		case 'teaser':
			// Plus noir encore : le cinéma.
			return avec(versSombre(mix(claire ? sombre : c.fond, '#000000', 0.62)));
		case 'fil':
			// Le point est l'accent : la marque telle quelle.
			return avec({});
		case 'court-metrage':
			// L'heure bleue : l'encre de la marque tirée vers un bleu de nuit ; ses lumières à l'accent.
			return avec(versSombre(mix(claire ? sombre : c.fond, '#141c33', 0.55)));
		default:
			return da;
	}
};
export const DUREE_APERCU = 270; // 9 s à 30 images par seconde, si le style ne dit rien

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** 0 avant a, 1 après b, selon la courbe. */
export const prog = (f: number, a: number, b: number, e: (x: number) => number = Easing.bezier(0.16, 1, 0.3, 1)) =>
	interpolate(f, [a, Math.max(b, a + 0.001)], [0, 1], {...cl, easing: e});
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Un ressort qui part à l'image a (0 avant). */
export const ressort = (f: number, a: number, config: {damping?: number; stiffness?: number; mass?: number} = {}) =>
	f < a ? 0 : spring({frame: f - a, fps: 30, config: {damping: 200, ...config}});

/** Une clé de caméra 2D : à l'image f, regarder le point (x, y) avec le zoom z. */
export type Cle2D = {f: number; x: number; y: number; z: number; e?: (x: number) => number};
/**
 * La caméra entre ses clés, en ease-in-out (ou la courbe `e` de la clé d'arrivée) ; le zoom est
 * interpolé en logarithme (vitesse perçue constante).
 */
export const camera2D = (f: number, cles: Cle2D[]) => {
	const doux = Easing.bezier(0.65, 0, 0.35, 1);
	if (f <= cles[0].f) return cles[0];
	for (let i = 1; i < cles.length; i++) {
		const a = cles[i - 1];
		const b = cles[i];
		if (f <= b.f) {
			const k = (b.e ?? doux)((f - a.f) / Math.max(1, b.f - a.f));
			return {f, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k))};
		}
	}
	return cles[cles.length - 1];
};

/** Coupe une phrase en n morceaux de longueurs proches, sans couper un mot. */
export const decouper = (phrase: string, n: number): string[] => {
	const mots = phrase.split(/\s+/).filter(Boolean);
	const total = phrase.length;
	const out: string[] = [];
	let courant: string[] = [];
	for (const m of mots) {
		courant.push(m);
		const fait = out.join(' ').length + courant.join(' ').length;
		if (out.length < n - 1 && fait >= (total * (out.length + 1)) / n) {
			out.push(courant.join(' '));
			courant = [];
		}
	}
	if (courant.length) out.push(courant.join(' '));
	return out;
};

/** La taille de police qui fait tenir `texte` dans `largeur` (chasse moyenne `chasse` em par signe). */
export const ajuster = (texte: string, largeur: number, max: number, chasse = 0.6) =>
	Math.min(max, largeur / Math.max(1, texte.length * chasse));

/** Attend que les polices citées soient prêtes (pour dessiner du texte dans un canvas). */
export const usePolicesPretes = (polices: string[]) => {
	const [pret, setPret] = useState(false);
	const [attente] = useState(() => delayRender('Polices des textures'));
	const cle = polices.join('|');
	useEffect(() => {
		Promise.all(cle.split('|').map((p) => document.fonts.load(p))).then(() => {
			setPret(true);
			continueRender(attente);
		});
	}, [cle, attente]);
	return pret;
};

/** La légende du catalogue, en haut à gauche, la même pour tous les styles. */
export const Legende: React.FC<{readonly texte: string | null}> = ({texte}) =>
	texte ? (
		<div
			style={{
				position: 'absolute',
				left: 44,
				top: 40,
				padding: '10px 18px 11px',
				borderRadius: 999,
				background: 'rgba(0,0,0,0.62)',
				color: '#ffffff',
				fontFamily: 'JetBrains Mono',
				fontSize: 24,
				letterSpacing: '0.02em',
				zIndex: 50,
			}}
		>
			{texte}
		</div>
	) : null;
