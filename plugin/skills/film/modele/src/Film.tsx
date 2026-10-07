import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {z} from 'zod';
import {C, PIXEL_ORDRE, POLICE, TRAINEE_CLAIR, t} from './charte';
import {Bloc, Etiquette, entree} from './elements';
import {GrosCube, Scene3D} from './monde/kit3d';
import {COULEURS3D, type Cle, type V3, cameraDepuisCles, ease} from './monde/outils3d';
import {Effet, Musique} from './Son';

// FILM DE DÉPART (à remplacer) : il montre la mécanique, pas une histoire.
// 16 temps : le S du logo se pose en gros cubes, la caméra tourne autour, un titre et une adresse.
// Pour un vrai film : storyboard d'abord (references/storyboard.md), puis une histoire propre au projet.

export const filmSchema = z.object({
	titre: z.string().describe('Le titre'),
	adresse: z.string().describe("L'adresse en fin de film"),
	son: z.boolean().describe('Musique et bruitages'),
});
export type FilmProps = z.infer<typeof filmSchema>;

const S: V3[] = PIXEL_ORDRE.map(([col, ligne]) => [(col * 11 + 4.5 - 21) * 0.25, ((4 - ligne) * 11 + 4.5) * 0.25, 0]);
const TRAINEE = TRAINEE_CLAIR.map((c) => new THREE.Color(c));

const CLES: Cle[] = [
	{b: 0, pos: [-16, 6, 32], cible: [-4, 6, 0], fov: 38},
	{b: 8, pos: [4, 9, 36], cible: [-4, 6, 0]},
	{b: 16, pos: [10, 8, 34], cible: [-4, 5.5, 0]},
];
const camera = cameraDepuisCles(CLES);

const Monde: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Scene3D camera={camera}>
			{S.map((p, j) => {
				const a = t(1 + j * 0.5);
				const k = ease(f, a, a + 10);
				const c = COULEURS3D.orange.clone().lerp(TRAINEE[j] ?? COULEURS3D.encre, ease(f, a + 4, a + 16));
				return <GrosCube key={j} taille={2.2} p={[p[0], p[1] + (1 - k) * 4, p[2]]} echelle={k} couleur={c} />;
			})}
		</Scene3D>
	);
};

export const Film: React.FC<FilmProps> = ({titre, adresse, son}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.papier}}>
			<Monde />
			<div style={{position: 'absolute', left: 110, top: 96, display: 'flex', flexDirection: 'column', gap: 6}}>
				<Etiquette debut={t(0.5)} puce={false} style={{marginBottom: 20}}>
					[ Projet ]
				</Etiquette>
				<div style={{fontFamily: POLICE.titre, fontWeight: 500, fontSize: 96, letterSpacing: '-0.045em', lineHeight: 1}}>
					<Bloc debut={t(1)} fond={C.blanc} couleur={C.encre}>
						{titre}
					</Bloc>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: 110,
					width: '100%',
					textAlign: 'center',
					fontFamily: POLICE.titre,
					fontWeight: 500,
					fontSize: 110,
					letterSpacing: '-0.05em',
					...entree(frame, t(10), 16, 50),
				}}
			>
				{adresse}
			</div>
			{son ? (
				<Sequence name="Sons">
					<Musique />
					{S.map((_, j) => (
						<Effet key={j} src="clic.wav" a={t(1 + j * 0.5)} volume={0.25} duree={14} />
					))}
					<Effet src="pop.mp3" a={t(10)} volume={0.35} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};
