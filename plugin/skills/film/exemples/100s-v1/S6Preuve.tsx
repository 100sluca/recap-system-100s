import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, TRAINE, clamp, t} from '../charte';
import {Bloc, Etiquette, Mots, entree} from '../elements';

const Source: React.FC<{readonly texte: string; readonly debut: number; readonly coche: number}> = ({
	texte,
	debut,
	coche,
}) => {
	const frame = useCurrentFrame();
	const c = interpolate(frame, [coche, coche + 6], [0, 1], {...clamp, easing: TRAINE});
	const trace = interpolate(frame, [coche + 2, coche + 9], [0, 1], clamp);
	return (
		<div
			style={{
				width: 660,
				height: 104,
				background: C.blanc,
				border: `1.5px solid ${c > 0.5 ? 'rgba(255,95,0,0.45)' : C.filet}`,
				borderRadius: 18,
				display: 'flex',
				alignItems: 'center',
				gap: 28,
				padding: '0 32px',
				...entree(frame, debut, 14, 60),
			}}
		>
			<div
				style={{
					width: 44,
					height: 44,
					borderRadius: 8,
					border: `2.5px solid ${c > 0 ? C.orange : C.encre}`,
					background: c > 0 ? C.orange : 'transparent',
					scale: String(1 + 0.25 * Math.sin(Math.PI * c)),
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<svg width={30} height={30} viewBox="0 0 24 24" fill="none">
					<path
						d="M5 12.5l4.5 4.5L19 7.5"
						stroke={C.blanc}
						strokeWidth={3}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - trace}
					/>
				</svg>
			</div>
			<div
				style={{
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 46,
					letterSpacing: '-0.035em',
					color: C.encre,
				}}
			>
				{texte}
			</div>
		</div>
	);
};

// Comment 100s vérifie : une annonce, ses sources officielles, le tampon.
// Puis la doctrine du site, en grand.
export const S6Preuve: React.FC = () => {
	const frame = useCurrentFrame();
	const tampon = t(4);
	const verifie = frame >= tampon;
	const slam = interpolate(frame, [tampon, tampon + 7], [0, 1], {...clamp, easing: TRAINE});
	const secousse =
		frame >= tampon && frame < tampon + 6 ? (random(`s-${frame}`) - 0.5) * 10 * (1 - (frame - tampon) / 6) : 0;
	const fleche = interpolate(frame, [t(1), t(1.75)], [0, 1], {...clamp, easing: TRAINE});
	const sortie = interpolate(frame, [t(6), t(6.75)], [0, 1], {...clamp, easing: TRAINE});
	return (
		<AbsoluteFill style={{background: C.papier, overflow: 'hidden'}}>
			{/* Partie 1 : la vérification */}
			<AbsoluteFill
				style={{opacity: 1 - sortie, translate: `${secousse}px ${-sortie * 220 + secousse * 0.6}px`}}
			>
				<Etiquette debut={0} style={{position: 'absolute', left: 120, top: 285}}>
					Comment on vérifie
				</Etiquette>
				<div
					style={{
						position: 'absolute',
						left: 120,
						top: 400,
						width: 700,
						height: 400,
						background: C.blanc,
						border: `1.5px solid ${C.filet}`,
						borderRadius: 20,
						padding: 40,
						display: 'flex',
						flexDirection: 'column',
						gap: 26,
						...entree(frame, t(0.25), 16, 70),
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							fontFamily: POLICE.mono,
							fontSize: 19,
							letterSpacing: '0.05em',
							textTransform: 'uppercase',
						}}
					>
						<span
							style={{
								background: C.encre,
								color: C.blanc,
								padding: '6px 12px',
							}}
						>
							Annonce
						</span>
						<span
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								border: `1.5px solid ${verifie ? C.orange : C.filet}`,
								padding: '6px 12px',
								color: verifie ? C.encre : C.grisClair,
							}}
						>
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: 5,
									background: verifie ? C.orange : C.grisClair,
								}}
							/>
							{verifie ? 'Source officielle' : 'Non vérifiée'}
						</span>
					</div>
					<div
						style={{
							fontFamily: POLICE.titre,
							fontWeight: 500,
							fontSize: 56,
							lineHeight: 1.05,
							letterSpacing: '-0.04em',
							color: C.encre,
						}}
					>
						« Notre nouveau modèle est 2× plus rapide »
					</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto'}}>
						<div style={{height: 12, width: '92%', borderRadius: 6, background: 'rgba(22,17,12,0.07)'}} />
						<div style={{height: 12, width: '64%', borderRadius: 6, background: 'rgba(22,17,12,0.07)'}} />
					</div>
				</div>
				{/* Le tampon */}
				<div
					style={{
						position: 'absolute',
						left: 430,
						top: 720,
						rotate: '-6deg',
						scale: String(1.9 - 0.9 * slam),
						opacity: slam,
						background: C.blanc,
						border: `3px solid ${C.orange}`,
						color: C.orange,
						fontFamily: POLICE.mono,
						fontWeight: 600,
						fontSize: 26,
						letterSpacing: '0.06em',
						textTransform: 'uppercase',
						padding: '14px 22px',
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						boxShadow: '0 20px 40px -20px rgba(255,95,0,0.6)',
					}}
				>
					<span style={{width: 14, height: 14, borderRadius: 7, background: C.orange}} />
					Vérifié à la source
				</div>
				{/* La flèche vers les sources */}
				<svg
					style={{position: 'absolute', left: 840, top: 560}}
					width={240}
					height={60}
					viewBox="0 0 240 60"
					fill="none"
				>
					<path
						d="M4 30 H220"
						stroke={C.encre}
						strokeWidth={3}
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - fleche}
					/>
					<path
						d="M204 16 L222 30 L204 44"
						stroke={C.encre}
						strokeWidth={3}
						strokeLinecap="round"
						strokeLinejoin="round"
						opacity={fleche > 0.95 ? 1 : 0}
					/>
				</svg>
				<div
					style={{
						position: 'absolute',
						left: 1100,
						top: 410,
						display: 'flex',
						flexDirection: 'column',
						gap: 24,
					}}
				>
					<Source texte="Le dépôt GitHub" debut={t(1.5)} coche={t(2.25)} />
					<Source texte="La documentation" debut={t(2)} coche={t(2.75)} />
					<Source texte="Le site de l'éditeur" debut={t(2.5)} coche={t(3.25)} />
				</div>
			</AbsoluteFill>

			{/* Partie 2 : la doctrine du site */}
			<div style={{position: 'absolute', left: 170, top: 270}}>
				<Etiquette debut={t(6.5)} puce={false}>
					[ Pourquoi 100s ]
				</Etiquette>
				<div style={{height: 40}} />
				<Mots
					texte="Une info ne vaut que"
					debut={t(6.75)}
					pas={TEMPS / 4}
					style={{
						fontFamily: POLICE.titre,
						fontWeight: 500,
						fontSize: 132,
						lineHeight: 1.02,
						letterSpacing: '-0.045em',
						color: C.encre,
					}}
				/>
				<div
					style={{
						fontFamily: POLICE.titre,
						fontWeight: 500,
						fontSize: 132,
						lineHeight: 1.02,
						letterSpacing: '-0.045em',
						marginTop: 8,
					}}
				>
					<Bloc debut={t(8.25)}>par sa source.</Bloc>
				</div>
				<div
					style={{
						marginTop: 44,
						fontFamily: POLICE.titre,
						fontWeight: 500,
						fontSize: 52,
						lineHeight: 1.2,
						letterSpacing: '-0.03em',
						color: C.gris,
					}}
				>
					<div style={entree(frame, t(9.25), 14, 30)}>
						Le dépôt, l'éditeur et les chiffres font foi.
					</div>
					<div style={{...entree(frame, t(10), 14, 30), color: C.grisClair}}>Le reste, c'est du bruit.</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
