import type React from 'react';
import type {ApercuProps} from './commun';
import {ApercuCubes} from './cubes/Apercu';
import {ApercuDemo} from './demo/Apercu';
import {ApercuFil} from './fil/Apercu';
import {ApercuKeynote} from './keynote/Apercu';
import {ApercuSequence} from './sequence/Apercu';
import {ApercuTeaser} from './teaser/Apercu';

// Les aperçus du catalogue, par identifiant de catalogue.json. Une composition « Apercu-<id> »
// chacun (Root.tsx) ; outils/apercus.mjs les rend dans la DA du projet.
export const APERCUS: Record<string, React.FC<ApercuProps>> = {
	keynote: ApercuKeynote,
	demo: ApercuDemo,
	fil: ApercuFil,
	teaser: ApercuTeaser,
	sequence: ApercuSequence,
	cubes: ApercuCubes,
};
