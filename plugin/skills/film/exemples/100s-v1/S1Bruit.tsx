import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, clamp, t} from '../charte';

// Le flot d'annonces que tout le monde subit. Aucun nom, aucun compte, aucun réseau.
const PETITS = [
	'ANNONCE',
	'RUMEUR',
	'FUITE',
	'BENCHMARK MAISON',
	'« RÉVOLUTIONNAIRE »',
	"LISTE D'ATTENTE",
	'BÊTA PRIVÉE',
	'IL PARAÎT QUE…',
	'SOTA ?',
	'+ 400 %',
	'DÉMO ?',
	'BIENTÔT',
	'GAME CHANGER',
	'SOURCE ?',
	'NOUVEAU MODÈLE',
	'AGENT AUTONOME',
	'OPEN SOURCE ?',
	'PRIX ?',
	'DISPONIBLE ?',
	'EXCLUSIF',
	'DÉMENTI',
	'PREVIEW',
	'RÉSERVÉ AUX US',
	"CAPTURE D'ÉCRAN",
	'10× PLUS RAPIDE',
	'TOUT CHANGE',
	'V5 ?',
	'NON VÉRIFIÉ',
	'QUI A DIT ÇA ?',
	'EN COURS DE DÉPLOIEMENT',
	'ROADMAP',
	'BREAKING',
];
const GRANDS = ['RUMEUR', 'HYPE', 'BRUIT', 'ANNONCE', '?!'];

type Etiq = {id: string; texte: string; grand: boolean; x: number; y: number; a: number; orange: boolean};

// Positions et instants tirés une fois pour toutes (aléatoire reproductible).
export const ETIQUETTES: Etiq[] = [
	...GRANDS.map((texte) => ({id: `G-${texte}`, texte, grand: true})),
	...PETITS.map((texte) => ({id: `P-${texte}`, texte, grand: false})),
]
	.sort((a, b) => random(`ordre-${a.id}`) - random(`ordre-${b.id}`))
	.map(({id, texte, grand}, i, tout) => {
		// De plus en plus serré : quelques annonces d'abord, puis le déluge.
		const k = i / (tout.length - 1);
		const a = Math.round((Math.sqrt(k) * 6.4 * TEMPS) / (TEMPS / 4)) * (TEMPS / 4);
		return {
			id,
			texte,
			grand,
			x: 140 + random(`x-${id}`) * (grand ? 1100 : 1440),
			y: 110 + random(`y-${id}`) * (grand ? 640 : 820),
			a: Math.round(a),
			orange: !grand && random(`o-${id}`) > 0.82,
		};
	});

export const S1Bruit: React.FC = () => {
	const frame = useCurrentFrame();
	// Implosion sur le dernier temps : tout est aspiré vers un seul point.
	const aspire = interpolate(frame, [t(7), t(7.85)], [0, 1], {
		...clamp,
		easing: (x) => x * x * x,
	});
	const point = interpolate(frame, [t(7.5), t(7.85), t(8) - 1], [0, 1, 1], clamp);
	return (
		<AbsoluteFill style={{background: C.encre, overflow: 'hidden'}}>
			{ETIQUETTES.map((e) => {
				if (frame < e.a) return null;
				const vie = frame - e.a;
				const pop = interpolate(vie, [0, 5], [0, 1], clamp);
				// Léger tremblé, renouvelé toutes les deux images.
				const pas = Math.floor(frame / 2);
				const jx = (random(`jx-${e.id}-${pas}`) - 0.5) * (e.grand ? 4 : 6);
				const jy = (random(`jy-${e.id}-${pas}`) - 0.5) * (e.grand ? 4 : 6);
				const clignote = !e.grand && random(`c-${e.id}-${pas}`) > 0.93 ? 0.35 : 1;
				const x = e.x + (960 - e.x) * aspire + jx;
				const y = e.y + (540 - e.y) * aspire + jy;
				return (
					<div
						key={e.id}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							translate: '-50% -50%',
							scale: String((0.86 + 0.14 * pop) * (1 - aspire)),
							opacity: pop * clignote * (1 - aspire * 0.6),
							whiteSpace: 'nowrap',
							...(e.grand
								? {
										fontFamily: POLICE.titre,
										fontWeight: 600,
										fontSize: 210,
										letterSpacing: '-0.05em',
										color: 'rgba(242,241,237,0.10)',
									}
								: {
										fontFamily: POLICE.mono,
										fontSize: 23,
										letterSpacing: '0.05em',
										color: e.orange ? C.orange : 'rgba(242,241,237,0.78)',
										border: `1.5px solid ${e.orange ? 'rgba(255,95,0,0.6)' : 'rgba(242,241,237,0.22)'}`,
										borderRadius: 999,
										padding: '10px 20px',
										background: 'rgba(22,17,12,0.85)',
									}),
						}}
					>
						{e.texte}
					</div>
				);
			})}
			{/* Ce qui reste du bruit : un seul pixel orange, le premier du S. */}
			<div
				style={{
					position: 'absolute',
					left: 960,
					top: 540,
					width: 46,
					height: 46,
					borderRadius: 11,
					background: C.orange,
					translate: '-50% -50%',
					scale: String(point),
					opacity: point,
				}}
			/>
		</AbsoluteFill>
	);
};
