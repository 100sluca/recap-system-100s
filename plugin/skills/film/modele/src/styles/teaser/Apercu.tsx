import React from 'react';
import {AbsoluteFill, Easing, Sequence, random, useCurrentFrame} from 'remotion';
import {AvecDA, useDA} from '../../da';
import {type ApercuProps, Legende, adapterDA, lerp, mix, prog} from '../commun';
import {EXPO, Flou, Phrase} from '../interface';
import {Faisceaux, Signe} from './kit';
import {alpha} from '../keynote/kit';

// Aperçu « Teaser » (d'après le teaser de feuille de route) : le noir, deux faisceaux de lumière qui
// balaient, le signe du projet qui se trace et s'embrase ; l'accroche puis la phrase, mot à mot ;
// un mur de cartes qui s'allument par à-coups pendant que la caméra glisse, l'une s'embrase ; et le
// nom, avec un mot en italique dans l'accent. Lent, sombre, lumineux.

export const ApercuTeaser: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('teaser', brute);
	const c = da.couleurs;
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond, overflow: 'hidden'}}>
				<Faisceaux />
				<Flou>
					<Sequence durationInFrames={140}>
						<Ouverture nom={contenu.nom} accroche={contenu.accroche ?? contenu.question} phrase={contenu.phrase} />
					</Sequence>
					<Sequence from={136} durationInFrames={76}>
						<Mur mots={contenu.mots} nom={contenu.nom} />
					</Sequence>
					<Sequence from={210}>
						<Fin nom={contenu.nom} phrase={contenu.phrase} adresse={contenu.adresse} />
					</Sequence>
				</Flou>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};

const Ouverture: React.FC<{readonly nom: string; readonly accroche: string; readonly phrase: string}> = ({nom, accroche, phrase}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const monte = prog(f, 64, 90, EXPO);
	const ligne = (texte: string, debut: number, fin: number) => {
		const sort = prog(f, fin, fin + 8, Easing.in(Easing.cubic));
		return (
			<div style={{display: 'flex', gap: '0.26em', justifyContent: 'center', opacity: 1 - sort, filter: sort > 0 ? `blur(${sort * 12}px)` : undefined}}>
				{texte.split(' ').map((m, i) => (
					<Phrase key={i} debut={debut + i * 3} duree={18}>
						{m}
					</Phrase>
				))}
			</div>
		);
	};
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{translate: `0px ${lerp(0, -150, monte)}px`, scale: String(lerp(1, 0.62, monte))}}>
				<Signe nom={nom} debut={12} taille={260} />
			</div>
			<div style={{position: 'absolute', top: 640, left: 0, right: 0, fontFamily: da.polices.texte.famille, fontSize: 58, color: c.encre, letterSpacing: '-0.01em'}}>
				{f < 108 ? ligne(accroche, 70, 100) : ligne(phrase, 108, 132)}
			</div>
		</AbsoluteFill>
	);
};

const Mur: React.FC<{readonly mots: string[]; readonly nom: string}> = ({mots, nom}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const COL = 6;
	const LIG = 3;
	const L = 300;
	const H = 210;
	const glisse = lerp(60, -90, prog(f, 0, 76, Easing.linear));
	const centre = {i: 2, j: 1};
	const embrase = prog(f, 44, 58, EXPO);
	return (
		<AbsoluteFill style={{transform: `translateX(${glisse}px) scale(${lerp(1.0, 1.1, prog(f, 0, 76, Easing.linear))})`, opacity: 1 - prog(f, 68, 76)}}>
			{Array.from({length: COL * LIG}, (_, n) => {
				const i = n % COL;
				const j = Math.floor(n / COL);
				const d = 4 + random(`mur-${n}`) * 30;
				const vu = f >= d ? (f < d + 3 && Math.floor(f) % 2 ? 0.35 : 1) : 0; // s'allume par à-coups
				const fort = i === centre.i && j === centre.j;
				return (
					<div
						key={n}
						style={{
							position: 'absolute',
							left: 960 - (COL * (L + 26)) / 2 + i * (L + 26),
							top: 540 - (LIG * (H + 26)) / 2 + j * (H + 26),
							width: L,
							height: H,
							borderRadius: 18,
							background: c.surface,
							border: `1px solid ${fort ? alpha(c.accent, 0.4 + 0.6 * embrase) : c.filet}`,
							boxShadow: fort ? `0 0 ${60 * embrase}px ${alpha(c.accent, 0.45 * embrase)}` : undefined,
							opacity: vu * (fort ? 1 : 0.85),
							padding: 22,
							boxSizing: 'border-box',
						}}
					>
						<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
							<div style={{width: 30, height: 30, borderRadius: 8, background: fort ? c.accent : mix(c.surface, '#ffffff', 0.12)}} />
							<span style={{fontFamily: da.polices.texte.famille, fontSize: 22, color: fort ? c.encre : c.doux}}>{fort ? nom : mots[n % mots.length]}</span>
						</div>
						{[0.9, 0.7, 0.5].map((w, k) => (
							<div key={k} style={{height: 10, width: `${w * 100}%`, borderRadius: 5, background: mix(c.surface, '#ffffff', 0.09), marginTop: k ? 12 : 26}} />
						))}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

const Fin: React.FC<{readonly nom: string; readonly phrase: string; readonly adresse: string}> = ({nom, phrase, adresse}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const mots = phrase.replace(/[.!?]$/, '').split(' ');
	const dernier = mots.pop() ?? '';
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 22}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 26}}>
				<Signe nom={nom} debut={-40} taille={96} />
				<Phrase debut={4} duree={20}>
					<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 112, letterSpacing: '-0.04em', color: c.encre}}>{nom}</div>
				</Phrase>
			</div>
			<Phrase debut={14} duree={20}>
				<div style={{fontFamily: da.polices.texte.famille, fontSize: 52, color: c.encre}}>
					{mots.join(' ')} <span style={{fontFamily: (da.polices.appoint ?? da.polices.titre).famille, fontStyle: 'italic', fontSize: da.polices.appoint ? 66 : 54, color: c.accent}}>{dernier}.</span>
				</div>
			</Phrase>
			<div style={{fontFamily: da.polices.mono.famille, fontSize: 26, color: c.doux, opacity: prog(f, 30, 40)}}>{adresse}</div>
		</AbsoluteFill>
	);
};
