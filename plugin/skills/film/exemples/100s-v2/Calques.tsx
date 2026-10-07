import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TRAINE, clamp, t} from '../charte';
import {Bloc, Etiquette, FlecheDiag, Odometre, entree} from '../elements';

// Les textes posés sur le monde 3D : barres de surlignage, étiquettes en chasse fixe,
// chiffres en Doto, comme sur luca100s.fr. Chaque groupe vit sur ses temps.

export type Chiffres3D = {
	readonly informations: number;
	readonly sources: number;
	readonly depots: number;
	readonly sujets: number;
	readonly edition: number;
};

const TITRE: React.CSSProperties = {
	fontFamily: POLICE.titre,
	fontWeight: 500,
	fontSize: 80,
	lineHeight: 1,
	letterSpacing: '-0.045em',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: 6,
};

/** Un groupe de textes qui s'efface sur ses dernières images. */
const Groupe: React.FC<{readonly children: React.ReactNode; readonly duree: number}> = ({children, duree}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [duree - 8, duree], [1, 0], clamp);
	return <AbsoluteFill style={{opacity: o, translate: `0px ${(1 - o) * -24}px`}}>{children}</AbsoluteFill>;
};

const Haut: React.FC<{readonly children: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', left: 110, top: 96, ...TITRE}}>{children}</div>
);

const Compteur: React.FC<{
	readonly valeur: number | string;
	readonly libelle: string;
	readonly debut: number;
	readonly accent?: boolean;
	readonly plein?: boolean; // carte orange, chiffres et libellé blancs
}> = ({valeur, libelle, debut, accent, plein}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 10,
				background: plein ? C.orange : C.blanc,
				border: `1.5px solid ${plein ? C.orange : C.filet}`,
				padding: '20px 26px 18px',
				...entree(frame, debut, 12, 30),
			}}
		>
			<Odometre
				valeur={String(valeur)}
				debut={debut + 2}
				style={{fontSize: 140, color: plein ? C.blanc : accent ? C.orange : C.encre}}
			/>
			<div
				style={{
					fontFamily: POLICE.mono,
					fontSize: 22,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
					color: plein ? C.blanc : C.gris,
				}}
			>
				{libelle}
			</div>
		</div>
	);
};

const Entree: React.FC<{readonly children: React.ReactNode; readonly debut: number}> = ({children, debut}) => {
	const frame = useCurrentFrame();
	return <div style={entree(frame, debut, 12, 40)}>{children}</div>;
};

const Bas: React.FC<{readonly children: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', left: 110, bottom: 90, display: 'flex', gap: 70, alignItems: 'flex-end'}}>
		{children}
	</div>
);

const Puce: React.FC<{readonly texte: string; readonly debut: number}> = ({texte, debut}) => {
	const frame = useCurrentFrame();
	return (
		<span
			style={{
				fontFamily: POLICE.mono,
				fontSize: 24,
				letterSpacing: '0.04em',
				color: C.encre,
				background: C.blanc,
				border: `1.5px solid ${C.filet}`,
				padding: '10px 18px',
				...entree(frame, debut, 10, 20),
			}}
		>
			<span style={{color: C.orange}}># </span>
			{texte}
		</span>
	);
};

const NomPage: React.FC<{
	readonly nom: string;
	readonly chemin: string;
	readonly duree: number;
	readonly etiquette?: string;
	readonly orange?: boolean;
}> = ({nom, chemin, duree, etiquette, orange}) => (
	<Groupe duree={duree}>
		<div style={{position: 'absolute', left: 110, bottom: 96, ...TITRE, fontSize: 84}}>
			{etiquette ? (
				<Etiquette debut={0} puce={false} style={{background: C.papier, padding: '6px 10px', marginBottom: 14}}>
					[ {etiquette} ]
				</Etiquette>
			) : null}
			<Bloc debut={0} fond={orange ? C.orange : C.blanc} couleur={orange ? C.blanc : C.encre}>
				{nom}
			</Bloc>
			<Etiquette debut={5} puce={false} style={{background: C.papier, padding: '6px 10px', marginTop: 8}}>
				luca100s.fr{chemin}
			</Etiquette>
		</div>
	</Groupe>
);

const Fin: React.FC<{readonly edition: string}> = ({edition}) => {
	const frame = useCurrentFrame();
	const pop = interpolate(frame, [t(5.5), t(5.5) + 10], [0.85, 1], {...clamp, easing: TRAINE});
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: 1920,
				top: 690,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 34,
			}}
		>
			<div
				style={{
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 92,
					lineHeight: 1,
					letterSpacing: '-0.05em',
					color: C.encre,
					...entree(frame, t(4), 16, 50),
				}}
			>
				luca100s.fr
			</div>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 26,
					background: C.encre,
					borderRadius: 999,
					padding: '12px 12px 12px 40px',
					scale: String(pop),
					...entree(frame, t(5.5), 12, 30),
				}}
			>
				<span style={{fontFamily: POLICE.titre, fontWeight: 600, fontSize: 38, letterSpacing: '-0.03em', color: C.blanc}}>
					Lire l'édition #{edition}
				</span>
				<span
					style={{
						width: 70,
						height: 70,
						borderRadius: 35,
						background: C.orange,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<FlecheDiag taille={34} couleur={C.blanc} />
				</span>
			</div>
		</div>
	);
};

export const Calques: React.FC<Chiffres3D> = ({informations, sources, depots, sujets, edition}) => {
	const n = String(edition).padStart(2, '0');
	const avant = String(Math.max(0, edition - 1)).padStart(2, '0');
	// Les quatre lieux du site : le nom arrive quand la caméra se pose, part avant le voyage.
	const vues: {nom: string; chemin: string; b: number; fin: number; etiquette?: string}[] = [
		{nom: 'La veille, sujet par sujet.', chemin: '/veille/', b: 58.4, fin: 63.4},
		{nom: 'Les acteurs, couche par couche.', chemin: '/acteurs/', b: 66.4, fin: 71.4},
		{nom: 'Les fresques du marché.', chemin: '/fresques/api-agentique/', b: 74.4, fin: 83.4, etiquette: 'Une fresque'},
		{nom: 'Le Topo des modèles et des prix.', chemin: '/topo/', b: 86.4, fin: 91.6},
	];
	return (
		<AbsoluteFill>
			<Sequence name="Texte · 09:00" durationInFrames={t(8)}>
				<Groupe duree={t(8)}>
					<Haut>
						<Etiquette debut={t(0.5)} puce={false} style={{marginBottom: 22}}>
							[ 09:00 — chaque matin ]
						</Etiquette>
						<Bloc debut={t(2)} fond={C.blanc} couleur={C.encre}>
							Chaque matin, à 9 h,
						</Bloc>
						<Bloc debut={t(2.75)} fond={C.blanc} couleur={C.encre}>
							la veille se met en route.
						</Bloc>
					</Haut>
				</Groupe>
			</Sequence>

			<Sequence name="Texte · Le flux" from={t(8)} durationInFrames={t(20) - t(8)}>
				<Groupe duree={t(20) - t(8)}>
					<Haut>
						<Etiquette debut={t(0.5)} puce={false} style={{marginBottom: 22}}>
							[ Le flux ]
						</Etiquette>
						<Bloc debut={t(1)}>Modèles, agents, API,</Bloc>
						<Bloc debut={t(1.75)}>open source :</Bloc>
						<Bloc debut={t(2.5)}>tout ce qui sort est relevé.</Bloc>
					</Haut>
					<Bas>
						<Compteur valeur={informations} libelle="informations relevées" debut={t(4)} plein />
					</Bas>
				</Groupe>
			</Sequence>

			<Sequence name="Texte · La source" from={t(20)} durationInFrames={t(32) - t(20)}>
				<Groupe duree={t(32) - t(20)}>
					<Haut>
						<Etiquette debut={t(0.5)} puce={false} style={{marginBottom: 22}}>
							[ Vérifié à la source ]
						</Etiquette>
						<Bloc debut={t(1.25)} fond={C.blanc} couleur={C.encre}>
							Chaque info renvoie
						</Bloc>
						<Bloc debut={t(2)}>à sa source officielle.</Bloc>
						<Etiquette debut={t(3.5)} style={{marginTop: 22, background: C.papier, padding: '6px 10px'}}>
							Dépôt · documentation · site de l'éditeur
						</Etiquette>
					</Haut>
					<Bas>
						<Compteur valeur={sources} libelle="sources officielles" debut={t(7)} accent />
					</Bas>
				</Groupe>
			</Sequence>

			<Sequence name="Texte · Les sujets" from={t(32)} durationInFrames={t(44) - t(32)}>
				<Groupe duree={t(44) - t(32)}>
					<Haut>
						<Etiquette debut={t(0.5)} puce={false} style={{marginBottom: 22}}>
							[ Les sujets ]
						</Etiquette>
						<Bloc debut={t(1)} fond={C.blanc} couleur={C.encre}>
							Recoupés entre
						</Bloc>
						<Bloc debut={t(1.75)} fond={C.blanc} couleur={C.encre}>
							plusieurs sources.
						</Bloc>
						<div style={{display: 'flex', gap: 12, marginTop: 26}}>
							<Puce texte="agents" debut={t(7)} />
							<Puce texte="open source" debut={t(7.5)} />
							<Puce texte="modèles" debut={t(8)} />
							<Puce texte="code" debut={t(8.5)} />
						</div>
					</Haut>
					<Bas>
						<Compteur valeur={sujets} libelle="sujets recoupés" debut={t(4.5)} accent />
						<Compteur valeur={depots} libelle="dépôts retrouvés" debut={t(5.5)} />
					</Bas>
				</Groupe>
			</Sequence>

			<Sequence name="Texte · L'édition" from={t(44)} durationInFrames={t(53.5) - t(44)}>
				<Groupe duree={t(53.5) - t(44)}>
					<Haut>
						<Etiquette debut={t(4.5)} puce={false} style={{marginBottom: 14}}>
							[ Chaque lundi ]
						</Etiquette>
						<Entree debut={t(5)}>
							<Odometre valeur={`#${n}`} depuis={`#${avant}`} debut={t(5) + 3} style={{fontSize: 190, color: C.orange}} />
						</Entree>
						<Bloc debut={t(5.75)} fond={C.blanc} couleur={C.encre}>
							L'édition de la semaine.
						</Bloc>
					</Haut>
				</Groupe>
			</Sequence>

			<Sequence name="Texte · Le site" from={t(56)} durationInFrames={t(92) - t(56)}>
				{vues.map((v) => {
					const debut = t(v.b) - t(56);
					const duree = t(v.fin) - t(v.b);
					return (
						<Sequence key={v.nom} from={debut} durationInFrames={duree} name={v.nom}>
							<NomPage nom={v.nom} chemin={v.chemin} duree={duree} etiquette={v.etiquette} orange />
						</Sequence>
					);
				})}
			</Sequence>

			<Sequence name="Texte · Fin" from={t(104)} durationInFrames={t(112) - t(104) + 30}>
				<Fin edition={n} />
			</Sequence>
		</AbsoluteFill>
	);
};
