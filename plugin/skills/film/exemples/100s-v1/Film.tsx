import {TransitionSeries} from '@remotion/transitions';
import React from 'react';
import {useVideoConfig} from 'remotion';
import {z} from 'zod';
import {VoletPixels} from './elements';
import {S1Bruit} from './scenes/S1Bruit';
import {S2Question} from './scenes/S2Question';
import {S3Promesse} from './scenes/S3Promesse';
import {S4Site} from './scenes/S4Site';
import {S5Chiffres} from './scenes/S5Chiffres';
import {S6Preuve} from './scenes/S6Preuve';
import {S7Rubriques} from './scenes/S7Rubriques';
import {S8Rythme} from './scenes/S8Rythme';
import {S9RendezVous} from './scenes/S9RendezVous';
import {Son} from './Son';

// Les chiffres du site au jour du rendu (scripts/rendre.mjs les relit sur luca100s.fr).
export const filmSchema = z.object({
	sources: z.number().int().describe('Sources officielles'),
	depots: z.number().int().describe('Dépôts retrouvés'),
	sujets: z.number().int().describe('Sujets recoupés'),
	acteurs: z.number().int().describe('Acteurs suivis'),
	edition: z.number().int().describe("Numéro de l'édition en cours"),
	son: z.boolean().describe('Musique et bruitages'),
});
export type FilmProps = z.infer<typeof filmSchema>;

// Chaque scène tient un nombre entier de mesures (4 temps à 105 temps/min) :
// les coupes tombent sur les temps forts de la musique.
// Durées en images = t(fin) − t(début) : 8, 8, 12, 8, 8, 12, 12, 8, 12 temps.
export const Film: React.FC<FilmProps> = ({sources, depots, sujets, acteurs, edition, son}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			<TransitionSeries>
				<TransitionSeries.Sequence name="1 · Le bruit" durationInFrames={137} premountFor={fps}>
					<S1Bruit />
				</TransitionSeries.Sequence>
				<TransitionSeries.Sequence name="2 · La question" durationInFrames={137} premountFor={fps}>
					<S2Question />
				</TransitionSeries.Sequence>
				<TransitionSeries.Overlay durationInFrames={24} premountFor={fps}>
					<VoletPixels />
				</TransitionSeries.Overlay>
				<TransitionSeries.Sequence name="3 · La promesse" durationInFrames={206} premountFor={fps}>
					<S3Promesse />
				</TransitionSeries.Sequence>
				<TransitionSeries.Sequence name="4 · Le site" durationInFrames={137} premountFor={fps}>
					<S4Site />
				</TransitionSeries.Sequence>
				<TransitionSeries.Sequence name="5 · Les chiffres" durationInFrames={137} premountFor={fps}>
					<S5Chiffres sources={sources} depots={depots} sujets={sujets} acteurs={acteurs} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Overlay durationInFrames={24} premountFor={fps}>
					<VoletPixels />
				</TransitionSeries.Overlay>
				<TransitionSeries.Sequence name="6 · La preuve" durationInFrames={206} premountFor={fps}>
					<S6Preuve />
				</TransitionSeries.Sequence>
				<TransitionSeries.Sequence name="7 · Les rubriques" durationInFrames={206} premountFor={fps}>
					<S7Rubriques />
				</TransitionSeries.Sequence>
				<TransitionSeries.Sequence name="8 · Le rythme" durationInFrames={137} premountFor={fps}>
					<S8Rythme edition={edition} />
				</TransitionSeries.Sequence>
				<TransitionSeries.Overlay durationInFrames={24} premountFor={fps}>
					<VoletPixels />
				</TransitionSeries.Overlay>
				<TransitionSeries.Sequence name="9 · Rendez-vous" durationInFrames={206} premountFor={fps}>
					<S9RendezVous edition={edition} />
				</TransitionSeries.Sequence>
			</TransitionSeries>
			{son ? <Son /> : null}
		</>
	);
};
