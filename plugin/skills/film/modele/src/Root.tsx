import React from 'react';
import {Composition, Folder} from 'remotion';
import {NB_TEMPS, t} from './charte';
import {Film, filmSchema} from './Film';
import {APERCUS} from './styles/apercus';
import {CATALOGUE, CONTENU_EXEMPLE, DUREE_APERCU} from './styles/commun';

// Le film à rendre s'appelle toujours « Film » (outils/rendre.mjs le cherche sous ce nom).
// Ajouter au besoin une composition par scène pour l'ouvrir seule dans le Studio.
// Le dossier « Styles » : un aperçu de 6 s par style du catalogue (outils/apercus.mjs les rend).
export const RemotionRoot: React.FC = () => (
	<>
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
		<Folder name="Styles">
			{CATALOGUE.filter((s) => APERCUS[s.id]).map((s) => (
				<Composition
					key={s.id}
					id={`Apercu-${s.id}`}
					component={APERCUS[s.id]}
					durationInFrames={s.duree || DUREE_APERCU}
					fps={30}
					width={1920}
					height={1080}
					defaultProps={{da: s.da, contenu: CONTENU_EXEMPLE, legende: `${s.numero} · ${s.nom}`}}
				/>
			))}
		</Folder>
	</>
);
