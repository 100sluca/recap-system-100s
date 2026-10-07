import React from 'react';
import {Composition} from 'remotion';
import {NB_TEMPS, t} from './charte';
import {Film, filmSchema} from './Film';

// Le film à rendre s'appelle toujours « Film » (outils/rendre.mjs le cherche sous ce nom).
// Ajouter au besoin une composition par scène pour l'ouvrir seule dans le Studio.
export const RemotionRoot: React.FC = () => (
	<Composition
		id="Film"
		component={Film}
		schema={filmSchema}
		durationInFrames={t(NB_TEMPS)}
		fps={30}
		width={1920}
		height={1080}
		defaultProps={{titre: 'Nom du projet', adresse: 'exemple.fr', son: true}}
	/>
);
