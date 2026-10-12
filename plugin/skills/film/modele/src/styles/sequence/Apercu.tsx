import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {AvecDA} from '../../da';
import {type ApercuProps, Legende, adapterDA, camera2D, lerp, mix, prog, ressort} from '../commun';
import {Caret, Curseur, EXPO, Flou, Halo, Phrase, tape} from '../interface';
import {alpha} from '../keynote/kit';

// Aperçu « Plan-séquence » (d'après Food craving et CloudJoi) : un seul plan, sans coupe. La caméra
// part tout près d'un champ de saisie au halo irisé qui s'écrit, un mot se surligne, elle recule
// jusqu'au téléphone ; la demande part en bulle, une petite animation « je prépare », la seconde
// couleur inonde l'écran et se rétracte en carte de résultat ; le doigt appuie sur « Lancer » ; la
// caméra s'envole et laisse de grandes phrases sur le blanc. Chaque moment naît du précédent.

const TEL = {x: 700, y: 30, l: 520, h: 1020}; // le téléphone, dans le monde
const CHAMP = {x: 740, y: 150, l: 440, h: 150}; // le champ de saisie, dans le téléphone

export const ApercuSequence: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('sequence', brute);
	const c = da.couleurs;
	const f = useCurrentFrame();
	const q = contenu.question;
	const ecrit = tape(q, f, 6, 0.55);
	const caretX = CHAMP.x + 30 + Math.min(ecrit.length, 22) * 15.5;
	const cam = camera2D(f, [
		{f: 0, x: CHAMP.x + 60, y: CHAMP.y + 70, z: 3.3},
		{f: 50, x: Math.min(caretX, CHAMP.x + 330), y: CHAMP.y + 70, z: 3.1},
		{f: 92, x: CHAMP.x + 260, y: CHAMP.y + 80, z: 2.6},
		{f: 126, x: 960, y: 520, z: 1.02, e: EXPO},
		{f: 205, x: 960, y: 560, z: 1.08},
		{f: 246, x: 960, y: 600, z: 1.14},
		{f: 262, x: 960, y: 640, z: 4, e: Easing.in(Easing.cubic)},
	]);
	// Le mot surligné : les deux derniers mots de la demande.
	const mots = q.split(' ');
	const debutSurligne = mots.slice(0, -2).join(' ').length + (mots.length > 2 ? 1 : 0);
	const surligne = prog(f, 64, 84, EXPO);
	const envoi = ressort(f, 128, {damping: 16, stiffness: 150, mass: 0.8});
	const flot = prog(f, 176, 190, Easing.bezier(0.7, 0, 0.2, 1));
	const retracte = prog(f, 192, 206, Easing.bezier(0.6, 0, 0.3, 1));
	const carte = prog(f, 200, 214, EXPO);
	const clic = 230;
	const blanc = prog(f, 252, 262);
	// Le centre de l'inondation : le bol de « je prépare », à l'écran.
	const bol = {x: 960, y: 640};
	const bolEcran = {x: 960 + cam.z * (bol.x - cam.x), y: 540 + cam.z * (bol.y - cam.y)};
	const doigt = {x: TEL.x + 36 + 60, y: 800};
	const doigtEcran = {x: 960 + cam.z * (doigt.x - cam.x), y: 540 + cam.z * (doigt.y - cam.y)};
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond, overflow: 'hidden'}}>
				<Flou>
					<AbsoluteFill>
						<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`}}>
							{/* Le téléphone (il apparaît en reculant) */}
							<div style={{position: 'absolute', left: TEL.x, top: TEL.y, width: TEL.l, height: TEL.h, borderRadius: 78, border: '14px solid #0c0c0e', background: c.fond, boxSizing: 'border-box', opacity: prog(f, 96, 118), boxShadow: '0 60px 120px -50px rgba(0,0,0,0.4)'}}>
								<div style={{position: 'absolute', left: 40, top: 30, fontFamily: da.polices.texte.famille, fontWeight: 600, fontSize: 26, color: c.encre}}>9:41</div>
							</div>
							{/* Le champ de saisie et son halo */}
							<div style={{position: 'absolute', left: CHAMP.x, top: CHAMP.y, width: CHAMP.l, height: CHAMP.h, translate: `0px ${lerp(0, 260, envoi)}px`, scale: String(lerp(1, 0.86, envoi)), opacity: 1 - prog(f, 132, 140)}}>
								<Halo largeur={CHAMP.l} hauteur={CHAMP.h} rayon={30} force={1 - prog(f, 120, 130)} />
								<div style={{position: 'absolute', inset: 0, borderRadius: 30, background: c.surface === c.fond ? c.fond : mix(c.fond, c.surface, 0.3), border: `1.5px solid ${c.filet}`, padding: '22px 30px', boxSizing: 'border-box', fontFamily: da.polices.texte.famille, fontSize: 30, lineHeight: 1.3, color: c.encre}}>
									<span>{ecrit.slice(0, debutSurligne)}</span>
									<span style={{position: 'relative'}}>
										<span style={{position: 'absolute', left: -2, right: -2, top: 2, bottom: -2, borderRadius: 6, background: alpha(c.accent, 0.28), scale: `${surligne} 1`, transformOrigin: 'left'}} />
										<span style={{position: 'relative'}}>{ecrit.slice(debutSurligne)}</span>
									</span>
									<Caret hauteur={34} fixe={ecrit.length < q.length} />
									<div style={{position: 'absolute', right: 16, bottom: 14, width: 46, height: 46, borderRadius: 99, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(1 - 0.15 * Math.sin(Math.PI * prog(f, 124, 132, Easing.linear)))}}>
										<svg width={22} height={22} viewBox="0 0 24 24" fill="none">
											<path d="M12 19V5M5 12l7-7 7 7" stroke={c.surAccent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</div>
								</div>
							</div>
							{/* La demande, devenue bulle */}
							{f >= 132 ? (
								<div style={{position: 'absolute', left: TEL.x + 36, top: 400, width: TEL.l - 72, display: 'flex', justifyContent: 'flex-end'}}>
									<div style={{maxWidth: 380, padding: '16px 22px', borderRadius: '26px 26px 8px 26px', background: c.accent, color: c.surAccent, fontFamily: da.polices.texte.famille, fontSize: 26, opacity: prog(f, 132, 138), scale: String(lerp(0.85, 1, prog(f, 132, 146, EXPO))), transformOrigin: 'right bottom'}}>
										{q}
									</div>
								</div>
							) : null}
							{/* Je prépare… : le bol et la balle */}
							{f >= 140 && f < 192 ? (
								<div style={{position: 'absolute', left: bol.x - 90, top: bol.y - 40, width: 180, height: 180, opacity: prog(f, 140, 148)}}>
									<div style={{position: 'absolute', left: 50 + Math.sin(f / 6) * 18, top: 40 - Math.abs(Math.sin(f / 5)) * 90, width: 44, height: 44, borderRadius: 99, background: c.accent}} />
									<div style={{position: 'absolute', left: 0, top: 90, width: 180, height: 90, borderRadius: '0 0 90px 90px', background: c.accent2, rotate: `${Math.sin(f / 5) * 8}deg`}} />
									<div style={{position: 'absolute', left: -60, top: 200, width: 300, textAlign: 'center', fontFamily: da.polices.mono.famille, fontSize: 22, color: c.doux}}>Je prépare…</div>
								</div>
							) : null}
							{/* Le résultat : une carte, puis la réponse et les boutons */}
							{f >= 196 ? (
								<div style={{position: 'absolute', left: TEL.x + 36, top: 500, width: TEL.l - 72, borderRadius: 30, background: c.surface, padding: 28, boxSizing: 'border-box', scale: String(lerp(0.4, 1, carte)), opacity: Math.min(1, carte * 3)}}>
									<div style={{fontFamily: da.polices.mono.famille, fontSize: 18, color: c.doux}}>{contenu.nom}</div>
									<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 38, color: c.encre, marginTop: 6, letterSpacing: '-0.02em'}}>
										{contenu.chiffre.valeur} {contenu.chiffre.libelle}
									</div>
									<div style={{display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap'}}>
										{contenu.mots.map((m, i) => (
											<span key={i} style={{padding: '8px 14px', borderRadius: 99, background: c.fond, border: `1px solid ${c.filet}`, fontFamily: da.polices.texte.famille, fontSize: 20, color: c.encre, opacity: prog(f, 206 + i * 4, 214 + i * 4)}}>
												{m}
											</span>
										))}
									</div>
								</div>
							) : null}
							{f >= 214 ? (
								<div style={{position: 'absolute', left: TEL.x + 36, top: 790, width: TEL.l - 72, display: 'flex', gap: 14, opacity: prog(f, 214, 222)}}>
									<div style={{padding: '18px 28px', borderRadius: 99, background: c.encre, color: c.fond, whiteSpace: 'nowrap', fontFamily: da.polices.texte.famille, fontWeight: 600, fontSize: 24, scale: String(1 - 0.08 * Math.sin(Math.PI * prog(f, clic - 2, clic + 5, Easing.linear)))}}>
										{f < clic + 2 ? 'Lancer' : f < clic + 12 ? '…' : '✓ Lancé'}
									</div>
									<div style={{padding: '18px 28px', borderRadius: 99, border: `1.5px solid ${c.filet}`, color: c.encre, whiteSpace: 'nowrap', fontFamily: da.polices.texte.famille, fontSize: 24}}>Voir le détail</div>
								</div>
							) : null}
						</div>
						{/* L'inondation, en espace écran : elle naît du bol et se rétracte dans la carte */}
						{flot > 0 && retracte < 1 ? (
							<AbsoluteFill style={{background: c.accent2, clipPath: `circle(${flot * 2300 * (1 - retracte) + 40 * retracte}px at ${lerp(bolEcran.x, 960, retracte)}px ${lerp(bolEcran.y, 600, retracte)}px)`}} />
						) : null}
						{f >= 218 && f < 248 ? <Curseur x={lerp(1500, doigtEcran.x, prog(f, 218, 228, EXPO))} y={lerp(1100, doigtEcran.y, prog(f, 218, 228, EXPO))} type="main" appui={clic} taille={52} /> : null}
						{/* Le blanc, et les grandes phrases */}
						{blanc > 0 ? (
							<AbsoluteFill style={{background: c.fond, opacity: blanc, alignItems: 'center', justifyContent: 'center', gap: 18}}>
								<Phrase debut={262} duree={18}>
									<div style={{fontFamily: da.polices.titre.famille, fontWeight: 700, fontSize: 92, letterSpacing: '-0.035em', color: c.encre}}>{contenu.phrase}</div>
								</Phrase>
								<Phrase debut={276} duree={18}>
									<div style={{fontFamily: da.polices.texte.famille, fontSize: 44, color: c.doux}}>{contenu.nom}</div>
								</Phrase>
							</AbsoluteFill>
						) : null}
					</AbsoluteFill>
				</Flou>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};
