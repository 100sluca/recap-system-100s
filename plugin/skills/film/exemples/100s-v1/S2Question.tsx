import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, POLICE, TEMPS, clamp, t} from '../charte';
import {Bloc, Etiquette, Mots, entree} from '../elements';

const TITRE: React.CSSProperties = {
	fontFamily: POLICE.titre,
	fontWeight: 500,
	fontSize: 150,
	lineHeight: 1.02,
	letterSpacing: '-0.045em',
	color: C.encre,
};

// La question que le site pose lui-même, sur le premier temps fort de la musique.
export const S2Question: React.FC = () => {
	const frame = useCurrentFrame();
	const pousse = interpolate(frame, [0, t(8)], [1, 1.045], clamp);
	return (
		<AbsoluteFill style={{background: C.papier}}>
			<div
				style={{
					position: 'absolute',
					left: 170,
					top: 215,
					scale: String(pousse),
					transformOrigin: '0% 50%',
				}}
			>
				<Etiquette debut={0}>Une seule question</Etiquette>
				<div style={{height: 46}} />
				<Mots texte="Qu'est-ce qui est" debut={t(0.5)} pas={TEMPS / 2} style={TITRE} />
				<Mots texte={'vraiment sorti ?'} debut={t(2)} pas={TEMPS / 2} style={TITRE} />
				<div style={{...TITRE, display: 'flex', alignItems: 'baseline', columnGap: '0.24em', marginTop: 12}}>
					<Mots texte="Et peut-on le" debut={t(3.5)} pas={TEMPS / 2} style={{color: C.grisClair}} />
					<span style={{display: 'inline-block', ...entree(frame, t(5), 4, 0)}}>
						<Bloc debut={t(5)} duree={10}>
							{'prouver ?'}
						</Bloc>
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
