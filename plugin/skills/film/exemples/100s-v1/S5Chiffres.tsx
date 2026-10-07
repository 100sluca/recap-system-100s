import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, TRAINE, clamp, t} from '../charte';
import {Etiquette, Mots, Odometre, entree} from '../elements';

export type ChiffresProps = {
	readonly sources: number;
	readonly depots: number;
	readonly sujets: number;
	readonly acteurs: number;
};

const Carte: React.FC<{
	readonly libelle: string;
	readonly valeur: number;
	readonly detail: string;
	readonly debut: number;
	readonly accent?: boolean;
}> = ({libelle, valeur, detail, debut, accent}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [debut, debut + 16], [0, 1], {...clamp, easing: TRAINE});
	const barre = interpolate(frame, [debut + 4, debut + t(2.5)], [0, 1], {...clamp, easing: TRAINE});
	return (
		<div
			style={{
				width: 410,
				height: 400,
				background: C.blanc,
				border: `1.5px solid ${C.filet}`,
				borderRadius: 20,
				padding: 34,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				position: 'relative',
				overflow: 'hidden',
				opacity: p,
				translate: `0px ${(1 - p) * 90}px`,
			}}
		>
			<div
				style={{
					fontFamily: POLICE.mono,
					fontSize: 20,
					letterSpacing: '0.05em',
					textTransform: 'uppercase',
					color: C.gris,
					display: 'flex',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<span style={{width: 10, height: 10, background: accent ? C.orange : C.encre}} />
				{libelle}
			</div>
			<div>
				<Odometre
					valeur={String(valeur)}
					debut={debut + 4}
					style={{fontSize: 180, color: accent ? C.orange : C.encre}}
				/>
				<div
					style={{
						marginTop: 18,
						fontFamily: POLICE.texte,
						fontSize: 27,
						lineHeight: 1.25,
						color: C.gris,
						...entree(frame, debut + 14, 12, 16),
					}}
				>
					{detail}
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					bottom: 0,
					height: 8,
					width: '100%',
					background: accent ? C.orange : C.encre,
					scale: `${barre} 1`,
					transformOrigin: 'left center',
				}}
			/>
		</div>
	);
};

// Les compteurs du site, à leur valeur du jour (props : actualisables avant le rendu).
export const S5Chiffres: React.FC<ChiffresProps> = ({sources, depots, sujets, acteurs}) => {
	return (
		<AbsoluteFill style={{background: C.papier}}>
			<Etiquette debut={0} puce={false} style={{position: 'absolute', left: 107, top: 185}}>
				[ 100s en chiffres ] — mis à jour chaque matin
			</Etiquette>
			<Mots
				texte="Une veille large, et sourcée."
				debut={t(0.25)}
				pas={TEMPS / 4}
				style={{
					position: 'absolute',
					left: 107,
					top: 250,
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 96,
					lineHeight: 1,
					letterSpacing: '-0.045em',
					color: C.encre,
				}}
			/>
			<div style={{position: 'absolute', left: 107, top: 430, display: 'flex', gap: 22}}>
				<Carte
					libelle="Sources officielles"
					valeur={sources}
					detail="L'éditeur, le dépôt ou la documentation"
					debut={t(0.75)}
					accent
				/>
				<Carte libelle="Dépôts retrouvés" valeur={depots} detail="Sur GitHub, npm ou PyPI" debut={t(1.25)} />
				<Carte libelle="Sujets recoupés" valeur={sujets} detail="Entre plusieurs sources" debut={t(1.75)} />
				<Carte libelle="Acteurs suivis" valeur={acteurs} detail="Rangés en cinq couches" debut={t(2.25)} />
			</div>
		</AbsoluteFill>
	);
};
