import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {C, POLICE, t} from './charte';
import {Bloc, Etiquette, entree} from './elements';
import {Effet, Musique} from './Son';

// FILM DE DÉPART (à remplacer) : il montre la mécanique (DA de da.json, grille de la musique, sons),
// pas une histoire ni un style. Pour un vrai film : le style choisi (styles/<id>.md et
// src/styles/<id>/kit.tsx), le storyboard (references/storyboard.md), puis une histoire propre au projet.

export const filmSchema = z.object({
	titre: z.string().describe('Le titre'),
	adresse: z.string().describe("L'adresse en fin de film"),
	son: z.boolean().describe('Musique et bruitages'),
});
export type FilmProps = z.infer<typeof filmSchema>;

export const Film: React.FC<FilmProps> = ({titre, adresse, son}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.fond, color: C.encre}}>
			<div style={{position: 'absolute', left: 110, top: 96, display: 'flex', flexDirection: 'column', gap: 6}}>
				<Etiquette debut={t(0.5)} style={{marginBottom: 20}}>
					Projet
				</Etiquette>
				<div style={{fontFamily: POLICE.titre, fontWeight: 700, fontSize: 120, letterSpacing: '-0.04em', lineHeight: 1}}>
					<Bloc debut={t(1)}>{titre}</Bloc>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: 110,
					width: '100%',
					textAlign: 'center',
					fontFamily: POLICE.titre,
					fontWeight: 700,
					fontSize: 96,
					letterSpacing: '-0.04em',
					...entree(frame, t(8), 16, 50),
				}}
			>
				{adresse}
			</div>
			{son ? (
				<Sequence name="Sons">
					<Musique />
					<Effet src="clic.wav" a={t(1)} volume={0.25} duree={14} />
					<Effet src="pop.mp3" a={t(8)} volume={0.35} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};
