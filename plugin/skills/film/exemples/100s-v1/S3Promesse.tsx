import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, clamp, t} from '../charte';
import {Bloc, Logo} from '../elements';

const LIGNE: React.CSSProperties = {
	fontFamily: POLICE.titre,
	fontWeight: 500,
	fontSize: 104,
	lineHeight: 1,
	letterSpacing: '-0.045em',
};

// La réponse : le S se dessine pixel par pixel, devient la dernière lettre de
// luca100s, puis la promesse du site s'écrit dessous sur ses barres.
export const S3Promesse: React.FC = () => {
	const frame = useCurrentFrame();
	const pousse = interpolate(frame, [t(7), t(12)], [1, 1.025], clamp);
	return (
		<AbsoluteFill data-scene style={{background: C.papier}}>
			<AbsoluteFill style={{scale: String(pousse)}}>
				<Logo
					taille={170}
					top={215}
					debutPixels={t(0.75)}
					pasPixels={TEMPS / 2}
					debutTexte={t(6.4)}
					grand={{cx: 960, cy: 530, hauteur: 520, debut: t(5.5), duree: t(1.1)}}
				/>
				<div
					style={{
						position: 'absolute',
						top: 470,
						left: 0,
						width: 1920,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 10,
						...LIGNE,
					}}
				>
					<Bloc debut={t(7.25)} fond={C.blanc} couleur={C.encre}>
						Ce qui sort en IA,
					</Bloc>
					<Bloc debut={t(8)} fond={C.blanc} couleur={C.encre}>
						trié, expliqué,
					</Bloc>
					<Bloc debut={t(8.75)}>vérifié à la source.</Bloc>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
