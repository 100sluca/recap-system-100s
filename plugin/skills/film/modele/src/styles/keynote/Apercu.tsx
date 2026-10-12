import React from 'react';
import {AbsoluteFill, Easing, Sequence, useCurrentFrame} from 'remotion';
import {AvecDA, useDA} from '../../da';
import {type ApercuProps, Legende, adapterDA, lerp, mix, prog, ressort} from '../commun';
import {Caret, Curseur, EXPO, FOUET, FenetreMac, Flou, IconeProduit, Phrase, Verre, suivre, tape} from '../interface';
import {BarreMenu, Brume, FondEcran, alpha} from './kit';

// Aperçu « Keynote » (d'après « Frame by Frame », une keynote Apple) : la fenêtre et le logo,
// le curseur qui clique ; l'icône et ses satellites qui se rangent ; la barre de menu et le panneau
// de verre où l'on tape la demande ; un éclair, la page qui défile et se surligne ; le nom lumineux
// sur le noir. Coupes franches sur le temps, la caméra ne s'arrête jamais, flou de mouvement partout.

export const ApercuKeynote: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('keynote', brute);
	const c = da.couleurs;
	const titre: React.CSSProperties = {fontFamily: da.polices.titre.famille, fontWeight: da.polices.titre.graisse ?? 700, color: c.encre, letterSpacing: '-0.035em'};
	const texte: React.CSSProperties = {fontFamily: da.polices.texte.famille, color: c.doux};

	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond, overflow: 'hidden'}}>
				<Flou>
					{/* 1 · La fenêtre et le logo ; le curseur vient cliquer l'icône, la caméra fonce dedans */}
					<Sequence durationInFrames={60}>
						<Plan1 nom={contenu.nom} etiquette={contenu.adresse} titre={titre} />
					</Sequence>
					{/* 2 · L'icône, ses quatre satellites qui tournent puis se rangent en croix */}
					<Sequence from={60} durationInFrames={65}>
						<Plan2 nom={contenu.nom} />
					</Sequence>
					{/* 3 · La barre de menu, le panneau de verre, la demande tapée */}
					<Sequence from={125} durationInFrames={60}>
						<Plan3 nom={contenu.nom} demande={contenu.question} />
					</Sequence>
					{/* 4 · Éclair, la page bascule et défile ; un mot se surligne */}
					<Sequence from={185} durationInFrames={50}>
						<Plan4 nom={contenu.nom} phrase={contenu.phrase} mots={contenu.mots} titre={titre} texte={texte} />
					</Sequence>
					{/* 5 · Le nom lumineux sur le noir */}
					<Sequence from={235}>
						<Plan5 nom={contenu.nom} phrase={contenu.phrase} />
					</Sequence>
				</Flou>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};

const Plan1: React.FC<{readonly nom: string; readonly etiquette: string; readonly titre: React.CSSProperties}> = ({nom, etiquette, titre}) => {
	const f = useCurrentFrame();
	const accent = useDA().couleurs.accent;
	const k = prog(f, 0, 30, EXPO);
	const derive = lerp(1, 1.05, prog(f, 0, 52, Easing.linear));
	const fonce = prog(f, 50, 60, FOUET);
	const s = lerp(1.62, 1.3, k) * derive;
	// L'icône dans la fenêtre (estimée d'après la largeur du nom), puis à l'écran (zoom autour du centre).
	const largeurBloc = 118 + 30 + nom.length * 0.56 * 96;
	const icLocal = {x: 960 - largeurBloc / 2 + 59, y: 540 + 23};
	const ic = {x: 960 + s * (icLocal.x - 960), y: 540 + s * (icLocal.y - 540) + lerp(90, 0, k)};
	const pos = suivre(f, [
		{f: 6, x: 1560, y: 980},
		{f: 40, x: ic.x + 12, y: ic.y + 16},
	]);
	return (
		<AbsoluteFill>
			<Brume />
			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					transform: `translate(${(960 - ic.x) * fonce}px, ${(540 - ic.y) * fonce}px) scale(${s * lerp(1, 3.2, fonce)}) translateY(${lerp(90, 0, k) / s}px)`,
				}}
			>
				<FenetreMac largeur={1240} hauteur={700} titre={nom}>
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30}}>
						<IconeProduit nom={nom} taille={118} style={{scale: String(1 + 0.08 * prog(f, 36, 44))}} />
						<div>
							<div style={{...titre, fontSize: 96, lineHeight: 1}}>{nom}</div>
							<div style={{marginTop: 16, display: 'inline-block', padding: '8px 18px', borderRadius: 999, background: alpha(accent, 0.12), color: accent, fontFamily: useDA().polices.mono.famille, fontSize: 22}}>{etiquette}</div>
						</div>
					</div>
				</FenetreMac>
			</AbsoluteFill>
			<Curseur x={pos.x} y={pos.y} appui={48} survol={prog(f, 36, 44)} visible={1 - fonce} taille={40} />
		</AbsoluteFill>
	);
};

const Plan2: React.FC<{readonly nom: string}> = ({nom}) => {
	const f = useCurrentFrame();
	const c = useDA().couleurs;
	const arrivee = prog(f, 0, 12, EXPO);
	const range = prog(f, 32, 46, EXPO);
	const part = prog(f, 50, 65, FOUET);
	const sat = [c.accent, c.accent2, mix(c.accent, '#ffffff', 0.45), mix(c.encre, c.accent, 0.35)];
	return (
		<AbsoluteFill style={{background: c.surface, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{position: 'relative', width: 0, height: 0, transform: `translate(${part * 640}px, ${-part * 520}px) scale(${lerp(1, 0.12, part)})`}}>
				{sat.map((couleur, i) => {
					const a = (i * Math.PI) / 2 + f * 0.09 * (1 - range);
					const r = lerp(lerp(420, 230, arrivee), 172, range);
					const finale = (i * Math.PI) / 2 + Math.PI / 4;
					const ang = lerp(a, finale + Math.round((a - finale) / (2 * Math.PI)) * 2 * Math.PI, range);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: Math.cos(ang) * r - 32,
								top: Math.sin(ang) * r - 32,
								width: 64,
								height: 64,
								borderRadius: 17,
								background: couleur,
								boxShadow: '0 12px 26px -10px rgba(0,0,0,0.35)',
								scale: String(arrivee),
							}}
						/>
					);
				})}
				<div style={{position: 'absolute', left: -120, top: -120, scale: String(lerp(0.6, 1, arrivee))}}>
					<div style={{position: 'absolute', inset: -46, borderRadius: 999, background: 'rgba(0,0,0,0.04)'}} />
					<IconeProduit nom={nom} taille={240} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Plan3: React.FC<{readonly nom: string; readonly demande: string}> = ({nom, demande}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	// La caméra : très près de la barre de menu (le zoom part de son icône), puis elle recule.
	const o = {x: 1590, y: 22};
	const z = lerp(2.1, 1.22, prog(f, 18, 44, EXPO)) * lerp(1, 1.03, prog(f, 44, 60, Easing.linear));
	const ecran = (x: number, y: number) => ({x: o.x + z * (x - o.x), y: o.y + z * (y - o.y)});
	const pos = suivre(f, [
		{f: 0, x: 1080, y: 520},
		{f: 14, x: ecran(1592, 26).x, y: ecran(1592, 26).y},
	]);
	const ouvre = ressort(f, 17, {damping: 15, stiffness: 160, mass: 0.8});
	const ecrit = tape(demande, f, 26, 1.1);
	const valide = prog(f, 54, 60);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${o.x}px ${o.y}px`}}>
				<FondEcran />
				{/* La fenêtre du produit, posée sur le bureau derrière le panneau */}
				<div style={{position: 'absolute', left: 300, top: 330, opacity: 0.92}}>
					<FenetreMac largeur={1320} hauteur={640} titre={nom}>
						<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
							<IconeProduit nom={nom} taille={96} />
							<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 80, letterSpacing: '-0.035em', color: c.encre}}>{nom}</div>
						</div>
					</FenetreMac>
				</div>
				<BarreMenu nom={nom} actif={prog(f, 15, 18)} />
				<div style={{position: 'absolute', left: 574, top: 130, width: 1000, transformOrigin: '1016px -100px', scale: String(lerp(0.15, 1, ouvre)), opacity: Math.min(1, ouvre * 3)}}>
					<Verre style={{height: 150, display: 'flex', alignItems: 'center', gap: 24, padding: '0 40px', borderColor: valide > 0 ? alpha(c.accent, 0.4 + 0.6 * valide) : undefined}}>
						<svg width={40} height={40} viewBox="0 0 24 24" fill={c.accent}>
							<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" />
						</svg>
						<span style={{fontFamily: da.polices.texte.famille, fontSize: 46, color: ecrit ? c.encre : c.pale}}>{ecrit || 'Demande…'}</span>
						<Caret hauteur={48} fixe={ecrit.length > 0 && ecrit.length < demande.length} />
					</Verre>
				</div>
			</AbsoluteFill>
			<Curseur x={pos.x} y={pos.y} appui={16} visible={1 - prog(f, 22, 28)} taille={40} />
		</AbsoluteFill>
	);
};

const Plan4: React.FC<{
	readonly nom: string;
	readonly phrase: string;
	readonly mots: string[];
	readonly titre: React.CSSProperties;
	readonly texte: React.CSSProperties;
}> = ({nom, phrase, mots, titre, texte}) => {
	const f = useCurrentFrame();
	const c = useDA().couleurs;
	const mono = useDA().polices.mono.famille;
	const bascule = prog(f, 0, 18, EXPO);
	const defile = lerp(160, -90, prog(f, 0, 50, Easing.bezier(0.2, 0.8, 0.3, 1)));
	const eclair = Math.max(0, 1 - f / 9);
	const surligne = prog(f, 26, 38, EXPO);
	return (
		<AbsoluteFill style={{background: c.surface, perspective: 1800, transform: 'scale(1.22)', transformOrigin: '50% 30%'}}>
			<div style={{position: 'absolute', left: 960 - 560, top: 150, width: 1120, transform: `rotateX(${lerp(28, 0, bascule)}deg) translateY(${defile}px)`, transformOrigin: '50% 0%'}}>
				<div style={{fontFamily: mono, fontSize: 22, color: c.pale, marginBottom: 26}}>{nom}</div>
				<div style={{...titre, fontSize: 64, lineHeight: 1.08, marginBottom: 44}}>{phrase}</div>
				{mots.map((m, i) => (
					<div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 26, padding: '20px 0', borderTop: `1px solid ${c.filet}`}}>
						<span style={{fontFamily: mono, fontSize: 22, color: c.accent}}>{`0${i + 1}`}</span>
						<span style={{position: 'relative', ...titre, fontSize: 44, fontWeight: 600}}>
							{i === mots.length - 1 ? <span style={{position: 'absolute', left: -8, right: -8, top: 4, bottom: -2, borderRadius: 8, background: alpha(c.accent, 0.2), scale: `${surligne} 1`, transformOrigin: 'left'}} /> : null}
							<span style={{position: 'relative'}}>{m}</span>
						</span>
						<span style={{...texte, fontSize: 26, marginLeft: 'auto'}}>{['la fiche et le lanceur', 'de quoi il est fait', 'la vidéo du projet'][i] ?? ''}</span>
					</div>
				))}
			</div>
			<AbsoluteFill style={{background: '#ffffff', opacity: eclair}} />
		</AbsoluteFill>
	);
};

const Plan5: React.FC<{readonly nom: string; readonly phrase: string}> = ({nom, phrase}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	return (
		<AbsoluteFill style={{background: mix(c.encre, '#000000', 0.55), alignItems: 'center', justifyContent: 'center', transform: `scale(${lerp(1.06, 1, prog(f, 0, 35, EXPO))})`}}>
			<Phrase debut={2} duree={18}>
				<div style={{fontFamily: da.polices.titre.famille, fontWeight: da.polices.titre.graisse ?? 700, fontSize: 150, letterSpacing: '-0.04em', color: c.fond, textShadow: `0 0 40px ${alpha(c.accent, 0.75)}, 0 0 110px ${alpha(c.accent, 0.45)}`}}>{nom}</div>
			</Phrase>
			<Phrase debut={10} duree={18}>
				<div style={{fontFamily: da.polices.texte.famille, fontSize: 40, color: mix(c.fond, c.encre, 0.4), marginTop: 8}}>{phrase}</div>
			</Phrase>
		</AbsoluteFill>
	);
};
