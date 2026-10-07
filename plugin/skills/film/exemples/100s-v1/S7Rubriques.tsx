import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TRAINE, clamp, t} from '../charte';
import {Etiquette, Fenetre, Odometre, entree} from '../elements';

// Les rubriques, avec les mots du site ; une page tous les deux temps.
const PAGES = [
	{capture: 'captures/newsletter.png', titre: 'La newsletter de la semaine', chemin: '/newsletter/'},
	{capture: 'captures/veille.png', titre: 'La veille, sujet par sujet', chemin: '/veille/'},
	{capture: 'captures/acteurs.png', titre: 'Les acteurs, couche par couche', chemin: '/acteurs/'},
	{capture: 'captures/fresques.png', titre: 'Les fresques du marché', chemin: '/fresques/'},
	{capture: 'captures/topo.png', titre: 'Le Topo des modèles et des prix', chemin: '/topo/'},
	{capture: 'captures/ressources.png', titre: 'Les ressources par thème', chemin: '/ressources/'},
];

export const S7Rubriques: React.FC = () => {
	const frame = useCurrentFrame();
	const debuts = PAGES.map((_, k) => t(2 * k));
	const courante = Math.max(0, debuts.filter((d) => frame >= d).length - 1);
	return (
		<AbsoluteFill style={{background: C.papier, overflow: 'hidden'}}>
			<Etiquette debut={0} style={{position: 'absolute', left: 110, top: 205}}>
				Les rubriques
			</Etiquette>
			<div style={{position: 'absolute', left: 104, top: 270}}>
				<Odometre
					key={courante}
					valeur={`0${courante + 1}`}
					depuis={`0${courante}`}
					debut={debuts[courante]}
					style={{fontSize: 150, color: C.orange}}
				/>
			</div>
			{PAGES.map((p, k) => {
				const fin = debuts[k + 1] ?? 100000;
				if (frame < debuts[k] || frame >= fin + 8) return null;
				const sort = interpolate(frame, [fin, fin + 8], [0, 1], {...clamp, easing: TRAINE});
				return (
					<div
						key={p.titre}
						style={{
							position: 'absolute',
							left: 110,
							top: 460,
							width: 390,
							opacity: 1 - sort,
							translate: `0px ${-sort * 40}px`,
						}}
					>
						<div
							style={{
								fontFamily: POLICE.titre,
								fontWeight: 500,
								fontSize: 62,
								lineHeight: 1.02,
								letterSpacing: '-0.04em',
								color: C.encre,
								...entree(frame, debuts[k] + 2, 12, 40),
							}}
						>
							{p.titre}
						</div>
						<div
							style={{
								marginTop: 28,
								fontFamily: POLICE.mono,
								fontSize: 22,
								letterSpacing: '0.04em',
								color: C.gris,
								...entree(frame, debuts[k] + 6, 12, 20),
							}}
						>
							luca100s.fr{p.chemin}
						</div>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: 560,
					top: 190,
					transform: 'perspective(2600px) rotateY(-7deg) rotateX(2deg)',
					transformOrigin: '0% 50%',
				}}
			>
				{PAGES.map((p, k) => {
					const fin = debuts[k + 1] ?? 100000;
					if (frame < debuts[k] || frame >= fin + 14) return null;
					const e = interpolate(frame, [debuts[k], debuts[k] + 13], [0, 1], {...clamp, easing: TRAINE});
					const x = interpolate(frame, [fin, fin + 13], [0, 1], {...clamp, easing: TRAINE});
					return (
						<div
							key={p.capture}
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								zIndex: k,
								translate: `0px ${(1 - e) * 860}px`,
								scale: String(1 - 0.06 * x),
								opacity: 1 - x,
							}}
						>
							<Fenetre src={p.capture} largeur={1250} hauteur={703} />
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
