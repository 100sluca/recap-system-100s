import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {AvecDA} from '../../da';
import type {V3} from '../../monde/outils3d';
import {type ApercuProps, Legende, adapterDA, lerp, mix, prog} from '../commun';
import {tape} from '../interface';
import {Immeubles, Lampadaires, Panneau, Passant, Plateau, Rue, Tram, lignesDe, pave, rangee} from './kit';

// Aperçu « Court-métrage 3D » (d'après « le premier tram du matin ») : 10 secondes, trois plans.
// 1. L'heure bleue : quelqu'un marche le long d'une rue, les fenêtres s'allument une à une.
// 2. Il s'arrête à l'abribus ; la caméra passe par-dessus son épaule jusqu'à l'écran, où l'on voit
//    le produit s'utiliser (la demande s'écrit, la réponse arrive).
// 3. Le jour se lève en accéléré, un tram passe, la caméra s'élève et l'enseigne du projet
//    s'allume sur un toit. Pas de flou de mouvement : il ne s'applique pas à un canvas 3D.

const DOUX = Easing.bezier(0.65, 0, 0.35, 1);
const TRAINE = Easing.bezier(0.16, 1, 0.3, 1);
const l3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// Les clés de la caméra : {image, position, cible, fov}, reliées en ease-in-out.
const CLES: {f: number; pos: V3; cible: V3; fov: number}[] = [
	{f: 0, pos: [-17, 1.35, -0.6], cible: [-8, 1.5, 5], fov: 38},
	{f: 100, pos: [-5.2, 1.5, 1.3], cible: [-1.6, 1.6, 5.6], fov: 36},
	{f: 150, pos: [0.4, 1.62, 3.05], cible: [0.2, 1.6, 6], fov: 30},
	{f: 192, pos: [0.5, 1.63, 2.85], cible: [0.2, 1.6, 6], fov: 30},
	{f: 228, pos: [-2.5, 3.6, -0.8], cible: [5, 3.4, 7], fov: 40},
	{f: 294, pos: [-9, 10.5, -3.5], cible: [17, 8, 9], fov: 44},
];
const camera = (f: number) => {
	let i = 0;
	while (i < CLES.length - 2 && f > CLES[i + 1].f) i++;
	const [a, b] = [CLES[i], CLES[i + 1]];
	const k = prog(f, a.f, b.f, DOUX);
	return {pos: l3(a.pos, b.pos, k), cible: l3(a.cible, b.cible, k), fov: lerp(a.fov, b.fov, k)};
};
// L'heure : nuit bleue au début, puis le jour se lève en accéléré pendant le troisième plan.
const heure = (f: number) => (f < 192 ? lerp(0.05, 0.12, f / 192) : lerp(0.12, 0.66, prog(f, 192, 290, DOUX)));

const ABRIBUS = {x: 0, z: 6.05, y: 1.62, l: 2.4, h: 1.5};
const ENSEIGNE = {x: 12, largeur: 10, hauteur: 13};

export const ApercuCourtMetrage: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('court-metrage', brute);
	const c = da.couleurs;
	const f = useCurrentFrame();
	const t = da.polices.titre;
	const x = da.polices.texte;
	const immeubles = useMemo(
		() => [
			...rangee('nord', 1, -110, 110, [7, 19], [[ENSEIGNE.x - ENSEIGNE.largeur / 2 - 0.5, ENSEIGNE.x + ENSEIGNE.largeur / 2 + 0.5]]),
			{x: ENSEIGNE.x, largeur: ENSEIGNE.largeur, hauteur: ENSEIGNE.hauteur, profondeur: 12, c: '#bdb6aa', cote: 1 as const},
			// En face, plus bas : le soleil du matin passe par-dessus et atteint les façades.
			...rangee('sud', -1, 22, 110, [5, 9]),
			...rangee('sud-ouest', -1, -110, -28, [5, 9]),
		],
		[],
	);

	// Le passant marche jusqu'à l'abribus, puis se tourne vers l'écran.
	const marche = prog(f, 0, 104, Easing.linear);
	const px = lerp(-8, -1.6, marche);
	const arret = prog(f, 98, 112);
	const pas = marche < 1 ? f * 0.36 : 0;

	// L'écran de l'abribus : le produit en train de servir.
	const fondEcran = mix('#ffffff', c.accent, 0.05);
	const encreEcran = mix(c.fond, '#000000', 0.35);
	const dessinerEcran = (ctx: CanvasRenderingContext2D, L: number, H: number, fr: number) => {
		pave(ctx, 0, 0, L, H, 28, fondEcran);
		pave(ctx, 28, 26, L - 56, 92, 20, mix(fondEcran, c.accent, 0.1));
		pave(ctx, 52, 50, 44, 44, 12, c.accent);
		ctx.fillStyle = encreEcran;
		ctx.font = `${t.graisse ?? 700} 46px "${t.famille}"`;
		ctx.textBaseline = 'middle';
		ctx.fillText(contenu.nom, 118, 73);
		// Le champ : la demande s'écrit.
		pave(ctx, 28, 150, L - 56, 110, 22, '#ffffff');
		ctx.strokeStyle = mix(fondEcran, c.accent, prog(fr, 108, 116) * 0.8);
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.roundRect(28, 150, L - 56, 110, 22);
		ctx.stroke();
		ctx.font = `${x.graisse ?? 400} 40px "${x.famille}"`;
		const ecrit = tape(contenu.question, fr, 112, 0.6);
		ctx.fillStyle = encreEcran;
		ctx.fillText(ecrit, 64, 205);
		if (fr < 158 && Math.floor(fr / 8) % 2 === 0) {
			const w = ctx.measureText(ecrit).width;
			ctx.fillRect(68 + w, 182, 4, 46);
		}
		// La réponse arrive.
		const k = prog(fr, 156, 172, TRAINE);
		if (k > 0) {
			ctx.globalAlpha = k;
			ctx.font = `${x.graisse ?? 400} 38px "${x.famille}"`;
			const lignes = lignesDe(ctx, contenu.reponse, L - 170).slice(0, 3);
			const h = 60 + lignes.length * 50;
			const y0 = 300 + (1 - k) * 50;
			pave(ctx, 28, y0, L - 56, h, 26, c.accent);
			ctx.fillStyle = c.surAccent;
			lignes.forEach((ligne, n) => ctx.fillText(ligne, 64, y0 + 55 + n * 50));
			ctx.globalAlpha = 1;
		}
		ctx.font = `400 26px "${da.polices.mono.famille}"`;
		ctx.fillStyle = mix(encreEcran, fondEcran, 0.45);
		ctx.fillText(`${contenu.chiffre.valeur} ${contenu.chiffre.libelle}`.slice(0, 48), 40, H - 40);
	};

	// L'enseigne du toit : un néon qui grésille avant de tenir.
	const allume = f < 232 ? 0 : f < 235 ? 1 : f < 239 ? 0.25 : f < 242 ? 1 : f < 245 ? 0.45 : 1;
	const dessinerEnseigne = (ctx: CanvasRenderingContext2D, L: number, H: number) => {
		pave(ctx, 0, 0, L, H, 30, '#15171c');
		ctx.font = `${t.graisse ?? 700} ${Math.min(150, (L * 1.5) / Math.max(4, contenu.nom.length))}px "${t.famille}"`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.shadowColor = c.accent;
		ctx.shadowBlur = 40 * allume;
		ctx.fillStyle = allume > 0 ? mix('#3a3a3a', mix(c.accent, '#ffffff', 0.25), allume) : '#33353b';
		ctx.fillText(contenu.nom, L / 2, H / 2 + 6);
		ctx.shadowBlur = 0;
	};

	const titre = prog(f, 250, 272, TRAINE);
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond}}>
				<Plateau camera={camera} heure={heure} azimut={-0.2}>
					<Rue />
					<Immeubles immeubles={immeubles} />
					<Lampadaires xs={[-26, -16, -6, 6, 18, 30, 42]} proches={[-6, 6]} />
					{/* L'abribus : deux montants, un toit, l'écran. */}
					{[-1.35, 1.35].map((dx) => (
						<mesh key={dx} position={[ABRIBUS.x + dx, 1.4, ABRIBUS.z + 0.05]} castShadow>
							<boxGeometry args={[0.1, 2.8, 0.1]} />
							<meshStandardMaterial color="#2b2d31" />
						</mesh>
					))}
					<mesh position={[ABRIBUS.x, 2.85, ABRIBUS.z - 0.5]} castShadow>
						<boxGeometry args={[3.2, 0.12, 1.5]} />
						<meshStandardMaterial color="#2b2d31" />
					</mesh>
					<Panneau
						p={[ABRIBUS.x, ABRIBUS.y, ABRIBUS.z]}
						ry={Math.PI}
						largeur={ABRIBUS.l}
						hauteur={ABRIBUS.h}
						polices={[`${t.graisse ?? 700} 46px "${t.famille}"`, `${x.graisse ?? 400} 40px "${x.famille}"`, `400 26px "${da.polices.mono.famille}"`]}
						dessiner={dessinerEcran}
						eclat={lerp(0.25, 1, prog(f, 60, 100))}
					/>
					<Passant p={[px, 0.16, 5.15]} ry={lerp(Math.PI / 2, Math.PI * 0.08, arret)} couleur={mix(c.accent, '#222222', 0.35)} pas={pas} marche={1 - arret} />
					<Passant p={[px - 1.1, 0.16, 5.5]} ry={lerp(Math.PI / 2, Math.PI * 0.12, arret)} couleur="#e9d27a" taille={0.62} pas={pas * 1.4} marche={1 - arret} />
					<Tram x={lerp(-46, 40, prog(f, 196, 300, Easing.linear))} couleur={c.accent} />
					{/* L'enseigne sur le toit, avec son cadre. */}
					<mesh position={[ENSEIGNE.x, ENSEIGNE.hauteur + 1.4, 7.75]}>
						<boxGeometry args={[8.4, 2.3, 0.2]} />
						<meshStandardMaterial color="#1c1e23" />
					</mesh>
					<Panneau
						p={[ENSEIGNE.x, ENSEIGNE.hauteur + 1.4, 7.62]}
						ry={Math.PI}
						largeur={8}
						hauteur={2}
						polices={[`${t.graisse ?? 700} 120px "${t.famille}"`]}
						dessiner={dessinerEnseigne}
						eclat={1}
					/>
				</Plateau>
				<div style={{position: 'absolute', left: 110, bottom: 100, opacity: titre}}>
					<div style={{height: 12, width: 110, background: c.accent, marginBottom: 24, scale: `${titre} 1`, transformOrigin: 'left'}} />
					<div style={{fontFamily: t.famille, fontWeight: t.graisse ?? 700, fontSize: 96, color: '#ffffff', letterSpacing: '-0.035em', lineHeight: 1.02, textShadow: '0 4px 30px rgba(0,0,0,0.35)', translate: `0px ${(1 - titre) * 30}px`}}>
						{contenu.nom}
					</div>
					<div style={{fontFamily: x.famille, fontSize: 36, color: 'rgba(255,255,255,0.9)', marginTop: 10, textShadow: '0 2px 20px rgba(0,0,0,0.4)'}}>{contenu.phrase}</div>
				</div>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};
