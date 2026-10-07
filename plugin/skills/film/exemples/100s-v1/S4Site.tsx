import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, DOUX, POLICE, TRAINE, clamp, t} from '../charte';
import {Bloc, Etiquette, Fenetre} from '../elements';

// Le vrai site, pas une maquette : la page d'accueil défile dans une fenêtre
// inclinée, pendant que la phrase du site s'écrit par-dessus sur ses barres.
export const S4Site: React.FC = () => {
	const frame = useCurrentFrame();
	const arrivee = interpolate(frame, [0, t(1.25)], [0, 1], {...clamp, easing: TRAINE});
	const defile = interpolate(frame, [t(1), t(6.75)], [0, 1285], {...clamp, easing: DOUX});
	const derive = interpolate(frame, [0, t(8)], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: C.papier, overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: 600,
					top: 95,
					transform: `perspective(2400px) rotateY(${-22 + 12 * arrivee - 3 * derive}deg) rotateX(${4 + 2 * (1 - arrivee)}deg)`,
					transformOrigin: '0% 50%',
					translate: `${(1 - arrivee) * 260}px ${(1 - arrivee) * 760}px`,
				}}
			>
				<Fenetre src="captures/accueil-long.png" largeur={1280} hauteur={890} defilement={defile} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 120,
					top: 250,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					gap: 8,
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 84,
					lineHeight: 1,
					letterSpacing: '-0.045em',
				}}
			>
				<Etiquette debut={t(0.5)} style={{marginBottom: 26}}>
					luca100s.fr
				</Etiquette>
				<Bloc debut={t(1)} fond={C.blanc} couleur={C.encre}>
					Une veille,
				</Bloc>
				<Bloc debut={t(2)} fond={C.blanc} couleur={C.encre}>
					une newsletter,
				</Bloc>
				<Bloc debut={t(3)} fond={C.blanc} couleur={C.encre}>
					une carte du marché,
				</Bloc>
				<Bloc debut={t(4.25)}>au même endroit.</Bloc>
			</div>
		</AbsoluteFill>
	);
};
