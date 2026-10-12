import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, random, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {AvecDA} from '../../da';
import {casesTexte} from '../../monde/chiffres';
import {Cubes, Scene3D} from '../../monde/kit3d';
import type {Etat, V3} from '../../monde/outils3d';
import {type ApercuProps, adapterDA, Legende, lerp, prog} from '../commun';

// Aperçu « Monde en cubes » (le style des films 100s, avec le kit src/monde/) : un essaim tombe
// et forme une dalle, puis une partie de la dalle se lève et écrit le chiffre ; la caméra tourne.
// Ce style a déjà servi plusieurs fois : ne le proposer que si on le demande (styles/cubes.md).

const DOUX = Easing.bezier(0.65, 0, 0.35, 1);
const TRAINE = Easing.bezier(0.16, 1, 0.3, 1);
const COLS = 12;
const RANGS = 10;
const N = COLS * RANGS;
const PAS = 1.15;
const l3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

const camera = (f: number) => {
	const k = prog(f, 0, 180, DOUX);
	return {
		pos: l3(l3([-15, 14, 23], [-4, 8.5, 21], prog(f, 0, 70, DOUX)), [9, 5.5, 17.5], prog(f, 70, 180, DOUX)),
		cible: [lerp(0, -3.2, k), lerp(1, 2.6, k), 0] as V3,
		fov: 36,
	};
};

export const ApercuCubes: React.FC<ApercuProps> = ({da: brute, contenu, legende}) => {
	const da = adapterDA('cubes', brute);
	const f = useCurrentFrame();
	const c = da.couleurs;
	const coul = useMemo(() => ({accent: new THREE.Color(c.accent), encre: new THREE.Color(c.encre), surface: new THREE.Color(c.surface), pale: new THREE.Color(c.pale)}), [c]);
	const chiffre = useMemo(() => casesTexte(contenu.chiffre.valeur.replace(/[^\d:]/g, '').slice(0, 4) || '0', PAS, 2).slice(0, N), [contenu.chiffre.valeur]);
	// Quel cube de la dalle part écrire quelle case du chiffre : des cubes répartis sur la dalle.
	const role = useMemo(() => {
		const r = new Map<number, number>();
		chiffre.forEach((_, j) => r.set(Math.round(((j + 0.5) * N) / chiffre.length) % N, j));
		return r;
	}, [chiffre]);

	const etat = (i: number, fr: number): Etat => {
		const col = i % COLS;
		const rang = Math.floor(i / COLS);
		const dalle: V3 = [(col - (COLS - 1) / 2) * PAS, 0.5, (rang - (RANGS - 1) / 2) * PAS];
		const ciel: V3 = [(random(`x${i}`) - 0.5) * 40, 16 + random(`y${i}`) * 14, (random(`z${i}`) - 0.5) * 30];
		const a = 4 + (col + rang) * 2.2;
		const pose = prog(fr, a, a + 22, TRAINE);
		let p = l3(ciel, dalle, pose);
		let couleur = coul.accent.clone().lerp(coul.surface, prog(fr, a + 8, a + 26));
		let r: V3 = [(1 - pose) * 3 * random(`r${i}`), (1 - pose) * 4, 0];
		const j = role.get(i);
		if (j !== undefined) {
			const d = 70 + j * 2.2;
			const k = prog(fr, d, d + 22, TRAINE);
			const cible: V3 = [chiffre[j].p[0], chiffre[j].p[1] + 1.3, 0];
			p = l3(p, cible, k);
			p = [p[0], p[1] + Math.sin(Math.PI * k) * 3, p[2]];
			r = [0, k * Math.PI * 2, 0];
			if (fr >= d) couleur = coul.accent.clone().lerp(coul.encre, prog(fr, d + 10, d + 30));
		} else {
			couleur = couleur.lerp(coul.pale, prog(fr, 76, 100));
		}
		return {p, r, s: [0.9, 0.9, 0.9], c: couleur};
	};

	const titre = prog(f, 138, 158, TRAINE);
	return (
		<AvecDA da={da}>
			<AbsoluteFill style={{background: c.fond}}>
				<Scene3D camera={camera} brouillard={[40, 90]}>
					<Cubes nombre={N} etat={etat} />
				</Scene3D>
				<div style={{position: 'absolute', left: 110, bottom: 100}}>
					<div style={{height: 14, width: 120, background: c.accent, marginBottom: 26, scale: `${titre} 1`, transformOrigin: 'left'}} />
					<div style={{overflow: 'hidden'}}>
						<div style={{fontFamily: da.polices.titre.famille, fontWeight: da.polices.titre.graisse ?? 700, fontSize: 104, color: c.encre, letterSpacing: '-0.04em', lineHeight: 1.02, translate: `0px ${(1 - titre) * 110}%`}}>
							{contenu.nom}
						</div>
					</div>
					<div style={{fontFamily: da.polices.texte.famille, fontSize: 36, color: c.doux, marginTop: 12, opacity: prog(f, 150, 166)}}>
						{contenu.chiffre.valeur} {contenu.chiffre.libelle}
					</div>
				</div>
				<Legende texte={legende} />
			</AbsoluteFill>
		</AvecDA>
	);
};
