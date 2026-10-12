import React from 'react';
import {AbsoluteFill, Easing, Sequence, useCurrentFrame} from 'remotion';
import {AvecDA, useDA} from '../../da';
import {type ApercuProps, Legende, adapterDA, lerp, mix, prog, ressort} from '../commun';
import {EXPO, FenetreMac, Flou, IconeProduit, Phrase, tape} from '../interface';
import {Etape, Legende as Sous, Projecteur, Outil} from './kit';

// Aperçu « Démo produit » (d'après Brieform, AgentHud, Spotify) : une accroche, puis la démo étape
// par étape dans le noir. La vraie fenêtre où le produit travaille (la demande tapée, les outils qui
// tournent puis se cochent, la réponse), une légende dont les mots clés s'allument, le résultat
// chiffré, et le logo. La caméra pousse lentement tout du long ; passages floutés, jamais de fondu.

export const ApercuDemo: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('demo', brute);
	const c = da.couleurs;
	const f = useCurrentFrame();
	const pousse = lerp(1, 1.07, prog(f, 48, 226, Easing.linear));
	const accroche = contenu.accroche ?? contenu.phrase;
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond, overflow: 'hidden'}}>
				<Projecteur />
				<Flou>
					<Sequence durationInFrames={50}>
						<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
							<Sortie debut={40}>
								<div style={{display: 'flex', gap: '0.26em', fontFamily: da.polices.titre.famille, fontWeight: da.polices.titre.graisse ?? 700, fontSize: 104, letterSpacing: '-0.035em', color: c.encre}}>
									{accroche.split(' ').map((m, i) => (
										<Phrase key={i} debut={4 + i * 4} duree={16}>
											{m}
										</Phrase>
									))}
								</div>
							</Sortie>
						</AbsoluteFill>
					</Sequence>
					<Sequence from={48} durationInFrames={178}>
						<AbsoluteFill style={{transform: `scale(${pousse})`}}>
							<Demonstration nom={contenu.nom} question={contenu.question} reponse={contenu.reponse} mots={contenu.mots} adresse={contenu.adresse} phrase={contenu.phrase} chiffre={contenu.chiffre} />
						</AbsoluteFill>
					</Sequence>
					<Sequence from={222}>
						<Fin nom={contenu.nom} phrase={contenu.phrase} adresse={contenu.adresse} />
					</Sequence>
				</Flou>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};

/** Sortie d'un plan : il monte et se floute en 8 images. */
const Sortie: React.FC<{readonly debut: number; readonly children: React.ReactNode}> = ({debut, children}) => {
	const f = useCurrentFrame();
	const k = prog(f, debut, debut + 8, Easing.in(Easing.cubic));
	return <div style={{translate: `0px ${-k * 60}px`, opacity: 1 - k, filter: k > 0 ? `blur(${k * 14}px)` : undefined}}>{children}</div>;
};

const Demonstration: React.FC<{
	readonly nom: string;
	readonly question: string;
	readonly reponse: string;
	readonly mots: string[];
	readonly adresse: string;
	readonly phrase: string;
	readonly chiffre: {valeur: string; libelle: string};
}> = ({nom, question, reponse, mots, adresse, phrase, chiffre}) => {
	const f = useCurrentFrame(); // depuis le début de la démonstration
	const da = useDA();
	const c = da.couleurs;
	const entree = prog(f, 0, 20, EXPO);
	const bascule = prog(f, 100, 116, Easing.inOut(Easing.cubic)); // passage à l'étape 2
	const ecrit = tape(question, f, 14, 1.1);
	const valeur = Number(chiffre.valeur.replace(/\s/g, '').replace(',', '.'));
	const compte = Number.isFinite(valeur) ? Math.round(valeur * prog(f, 118, 150, Easing.out(Easing.cubic))) : chiffre.valeur;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center'}}>
				{f < 108 ? <Etape numero="01" texte="Demande" debut={2} /> : <Etape numero="02" texte="Résultat" debut={108} />}
			</div>
			<div style={{position: 'absolute', left: 960 - 590, top: 200, scale: String(lerp(0.94, 1, entree)), translate: `0px ${lerp(50, 0, entree)}px`, opacity: entree}}>
				<FenetreMac
					largeur={1180}
					hauteur={560}
					titre="Claude Code"
					sombre
					droite={
						<span style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: da.polices.mono.famille, fontSize: 17, color: c.doux}}>
							<span style={{width: 9, height: 9, borderRadius: 9, background: c.accent}} />
							{nom} · connecté
						</span>
					}
				>
					{/* Étape 1 : la conversation */}
					<div style={{position: 'absolute', inset: 0, padding: '34px 44px', opacity: 1 - bascule, filter: bascule > 0 ? `blur(${bascule * 16}px)` : undefined}}>
						<div style={{display: 'flex', justifyContent: 'flex-end'}}>
							<div style={{maxWidth: 640, padding: '18px 26px', borderRadius: 20, background: mix(c.surface, '#ffffff', 0.08), fontFamily: da.polices.texte.famille, fontSize: 30, color: c.encre, minHeight: 36}}>
								{ecrit}
								{ecrit.length < question.length ? <span style={{display: 'inline-block', width: 3, height: 32, background: c.accent, marginLeft: 3, verticalAlign: 'middle'}} /> : null}
							</div>
						</div>
						<div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16}}>
							{mots.map((m, i) => (
								<Outil key={i} texte={`${nom} · ${m.toLowerCase()}`} debut={44 + i * 9} />
							))}
						</div>
						<div style={{marginTop: 26, fontFamily: da.polices.texte.famille, fontSize: 30, color: c.encre, opacity: prog(f, 74, 84), translate: `0px ${lerp(14, 0, prog(f, 74, 88, EXPO))}px`}}>{reponse}</div>
						<div style={{marginTop: 16, display: 'inline-block', padding: '10px 18px', borderRadius: 12, border: `1.5px solid ${c.accent}`, fontFamily: da.polices.mono.famille, fontSize: 22, color: c.accent, opacity: prog(f, 82, 90)}}>{adresse}</div>
					</div>
					{/* Étape 2 : le résultat chiffré */}
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 70, padding: '0 80px', opacity: bascule, filter: bascule < 1 ? `blur(${(1 - bascule) * 16}px)` : undefined}}>
						<div>
							<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 230, lineHeight: 0.9, color: c.accent, letterSpacing: '-0.05em'}}>{compte}</div>
							<div style={{fontFamily: da.polices.texte.famille, fontSize: 32, color: c.doux, marginTop: 10}}>{chiffre.libelle}</div>
						</div>
						<div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 18}}>
							{mots.map((m, i) => {
								const k = ressort(f, 124 + i * 7, {damping: 16, stiffness: 170});
								return (
									<div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', borderRadius: 16, background: mix(c.surface, '#ffffff', 0.05), border: `1px solid ${c.filet}`, opacity: Math.min(1, k * 2), translate: `${lerp(40, 0, k)}px 0px`}}>
										<svg width={30} height={30} viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="11" fill={c.accent} />
											<path d="M7 12.5l3.2 3.2L17 9" stroke={c.surAccent} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
										<span style={{fontFamily: da.polices.texte.famille, fontSize: 32, color: c.encre}}>{m}</span>
									</div>
								);
							})}
						</div>
					</div>
				</FenetreMac>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 808, display: 'flex', justifyContent: 'center'}}>
				{f < 108 ? <Sous texte={phrase} debut={24} /> : <Sous texte={`${chiffre.valeur} ${chiffre.libelle}.`} debut={116} fort={1} />}
			</div>
		</AbsoluteFill>
	);
};

const Fin: React.FC<{readonly nom: string; readonly phrase: string; readonly adresse: string}> = ({nom, phrase, adresse}) => {
	const f = useCurrentFrame();
	const da = useDA();
	const c = da.couleurs;
	const k = ressort(f, 2, {damping: 18, stiffness: 120});
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 26, background: c.fond}}>
			<Projecteur />
			<div style={{display: 'flex', alignItems: 'center', gap: 28, scale: String(lerp(0.9, 1, k)), opacity: Math.min(1, k * 2)}}>
				<IconeProduit nom={nom} taille={110} fond={c.accent} style={{color: c.surAccent}} />
				<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 120, letterSpacing: '-0.04em', color: c.encre}}>{nom}</div>
			</div>
			<Sous texte={phrase} debut={10} grand />
			<div style={{padding: '14px 26px', borderRadius: 14, background: c.accent, color: c.surAccent, fontFamily: da.polices.mono.famille, fontSize: 28, opacity: prog(f, 20, 28), translate: `0px ${lerp(16, 0, prog(f, 20, 34, EXPO))}px`}}>{adresse}</div>
		</AbsoluteFill>
	);
};
