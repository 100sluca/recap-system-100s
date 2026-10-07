import React from 'react';
import {AbsoluteFill} from 'remotion';
import {z} from 'zod';
import {C} from '../charte';
import {Calques} from './Calques';
import {Monde} from './Monde';
import {Son3D} from './Son3D';

// Film v2 « Un matin de veille » : un monde 3D continu (Monde), les textes du site
// par-dessus (Calques), la musique et les bruitages (Son3D). Storyboard : STORYBOARD-v2.md.
export const film3DSchema = z.object({
	informations: z.number().int().describe('Informations relevées (page Veille)'),
	sources: z.number().int().describe('Sources officielles'),
	depots: z.number().int().describe('Dépôts retrouvés'),
	sujets: z.number().int().describe('Sujets recoupés'),
	edition: z.number().int().describe("Numéro de l'édition en cours"),
	son: z.boolean().describe('Musique et bruitages'),
});
export type Film3DProps = z.infer<typeof film3DSchema>;

export const Film3D: React.FC<Film3DProps> = ({son, ...chiffres}) => (
	<AbsoluteFill style={{background: C.papier}}>
		<Monde />
		<Calques {...chiffres} />
		{son ? <Son3D /> : null}
	</AbsoluteFill>
);
