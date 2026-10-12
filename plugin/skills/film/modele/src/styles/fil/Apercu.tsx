import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {AvecDA} from '../../da';
import {type ApercuProps, Legende, adapterDA, lerp, prog} from '../commun';
import {Curseur, EXPO, Flou, suivre} from '../interface';
import {Anneau, Trame, courbeRessort} from './kit';

// Aperçu « Fil conducteur » (d'après le point orange et la balle blanche) : un seul point de
// l'accent relie tout le film. Il est le bouton d'un interrupteur, devient le point final du nom,
// saute sur une courbe de ressort qu'il trace en dépassant sa cible, inonde l'écran, se rétracte
// dans le noir où des mots tournent autour de lui en 3D, puis une trame de points ramène le clair
// et la carte finale, où il redevient le point du nom. Chaque changement naît du point.

const R = 34; // le rayon du point
const G = {x0: 520, y0: 820, l: 900, h: 460}; // le graphe

export const ApercuFil: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('fil', brute);
	const c = da.couleurs;
	const f = useCurrentFrame();
	const titre: React.CSSProperties = {fontFamily: da.polices.titre.famille, fontWeight: da.polices.titre.graisse ?? 800, letterSpacing: '-0.04em', lineHeight: 1};
	const nom = contenu.nom;
	const finFinale = nom.length * 0.53 * 170;
	// Où est le point, quelle taille, quelle couleur, à chaque image.
	const point = (() => {
		const off = {x: 1120, y: 540};
		const on = {x: 1240, y: 540};
		const periode = {x: 1010 + 24, y: 540 + 40};
		if (f < 18) return {x: off.x, y: off.y, r: 50, c: '#ffffff'};
		if (f < 34) {
			const k = prog(f, 18, 26, EXPO);
			const t = prog(f, 26, 34);
			return {x: lerp(off.x, on.x, k), y: on.y, r: lerp(50, R, t), c: t > 0.5 ? c.accent : '#ffffff'};
		}
		if (f < 62) {
			const k = prog(f, 34, 52, Easing.bezier(0.3, 0, 0.3, 1));
			return {x: lerp(on.x, periode.x, k), y: lerp(on.y, periode.y, k) - Math.sin(Math.PI * k) * 170, r: R, c: c.accent};
		}
		if (f < 74) {
			const k = prog(f, 62, 74, Easing.bezier(0.3, 0, 0.3, 1));
			return {x: lerp(periode.x, G.x0, k), y: lerp(periode.y, G.y0, k) - Math.sin(Math.PI * k) * 140, r: R, c: c.accent};
		}
		if (f < 130) {
			const u = prog(f, 74, 112, Easing.linear);
			return {x: G.x0 + G.l * u, y: G.y0 - G.h * courbeRessort(u), r: R, c: c.accent};
		}
		if (f < 146) {
			const k = prog(f, 130, 146, Easing.bezier(0.45, 0, 0.2, 1));
			return {x: lerp(G.x0 + G.l, 960, k), y: lerp(G.y0 - G.h, 540, k) - Math.sin(Math.PI * k) * 80, r: R, c: c.accent};
		}
		if (f < 176) {
			const grand = prog(f, 146, 160, Easing.bezier(0.6, 0, 0.3, 1)) * (1 - prog(f, 162, 176, Easing.bezier(0.6, 0, 0.3, 1)));
			return {x: 960, y: 540, r: lerp(R, 1300, grand), c: c.accent};
		}
		if (f < 262) return {x: 960, y: 540, r: R * (1 + 0.06 * Math.sin(f / 5)), c: c.accent};
		const k = prog(f, 262, 282, Easing.bezier(0.3, 0, 0.3, 1));
		const cible = {x: 960 + finFinale / 2 + 24, y: 523};
		return {x: lerp(960, cible.x, k), y: lerp(540, cible.y, k) - Math.sin(Math.PI * k) * 120, r: R, c: c.accent};
	})();
	const sombre = f >= 162 && f < 258;
	const fond = sombre ? c.encre : c.fond;
	const curseur = suivre(f, [
		{f: 0, x: 1480, y: 900},
		{f: 15, x: 1250, y: 560},
	]);
	const u = prog(f, 74, 112, Easing.linear);
	const compte = Number(contenu.chiffre.valeur.replace(/\s/g, '').replace(',', '.'));
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: fond, overflow: 'hidden'}}>
				<Flou>
					<AbsoluteFill>
						{/* 1 · le nom et l'interrupteur */}
						{f < 72 ? (
							<>
								<div style={{position: 'absolute', right: 1920 - 1010, top: 540 - 66, ...titre, fontSize: 120, whiteSpace: 'nowrap', color: c.encre, opacity: 1 - prog(f, 62, 70)}}>
									{nom}
								</div>
								<div style={{position: 'absolute', left: 1050, top: 540 - 70, width: 260, height: 140, borderRadius: 70, background: f >= 20 ? c.accent : c.pale, scale: String(1 - prog(f, 28, 36, Easing.in(Easing.cubic))), transformOrigin: '190px 70px'}} />
							</>
						) : null}
						{/* 2 · le graphe et la courbe de ressort */}
						{f >= 62 && f < 146 ? (
							<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 1 - prog(f, 136, 146)}}>
								<line x1={G.x0} y1={G.y0} x2={G.x0 + G.l * prog(f, 62, 76, EXPO)} y2={G.y0} stroke={c.encre} strokeWidth={4} />
								<line x1={G.x0} y1={G.y0} x2={G.x0} y2={G.y0 - (G.h + 80) * prog(f, 62, 76, EXPO)} stroke={c.encre} strokeWidth={4} />
								<line x1={G.x0} y1={G.y0 - G.h} x2={G.x0 + G.l * prog(f, 70, 84, EXPO)} y2={G.y0 - G.h} stroke={c.doux} strokeWidth={3} strokeDasharray="14 12" />
								<path
									d={Array.from({length: 61}, (_, i) => i / 60)
										.filter((v) => v <= u)
										.map((v, i) => `${i ? 'L' : 'M'}${G.x0 + G.l * v} ${G.y0 - G.h * courbeRessort(v)}`)
										.join(' ')}
									fill="none"
									stroke={c.encre}
									strokeWidth={6}
									strokeLinecap="round"
								/>
								<text x={G.x0 + G.l * u + 50} y={G.y0 - G.h * courbeRessort(u) - 40} fontFamily={da.polices.titre.famille} fontWeight={800} fontSize={96} fill={c.encre} opacity={prog(f, 90, 100)}>
									{Number.isFinite(compte) ? Math.round(compte * Math.min(1, courbeRessort(u))) : contenu.chiffre.valeur}
								</text>
								<text x={G.x0} y={G.y0 + 60} fontFamily={da.polices.mono.famille} fontSize={28} fill={c.doux} opacity={prog(f, 76, 86)}>
									{contenu.chiffre.libelle}
								</text>
							</svg>
						) : null}
						{/* 4 · l'anneau de mots en 3D autour du point */}
						{f >= 168 && f < 250 ? <Anneau mots={[...contenu.mots, nom]} debut={168} fin={236} couleur={c.fond} /> : null}
						{/* 5 · la trame de points qui ramène le clair */}
						{f >= 232 && f < 262 ? <Trame debut={232} couleur={c.fond} /> : null}
						{/* 6 · la carte finale : le nom, dont le point est le point final */}
						{f >= 258 ? (
							<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 22}}>
								<div style={{...titre, fontSize: 170, color: c.encre, opacity: prog(f, 258, 268), translate: `0px ${lerp(30, 0, prog(f, 258, 276, EXPO))}px`}}>{nom}</div>
								<div style={{fontFamily: da.polices.texte.famille, fontSize: 42, color: c.doux, opacity: prog(f, 270, 282)}}>{contenu.phrase}</div>
							</AbsoluteFill>
						) : null}
						{/* Le point, toujours au-dessus */}
						<div style={{position: 'absolute', left: point.x - point.r, top: point.y - point.r, width: point.r * 2, height: point.r * 2, borderRadius: 9999, background: point.c, boxShadow: f < 30 ? '0 6px 14px rgba(0,0,0,0.25)' : undefined}} />
						{f < 30 ? <Curseur x={curseur.x} y={curseur.y} appui={18} visible={1 - prog(f, 24, 30)} taille={44} /> : null}
					</AbsoluteFill>
				</Flou>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};

