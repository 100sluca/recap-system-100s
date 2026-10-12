import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import liste from '../public/fonts/polices.json';

// Toutes les polices de public/fonts/polices.json, chargées une fois pour toutes : la DA du film
// (da.json) et les aperçus des styles n'ont plus qu'à citer leur famille. Une police du projet ou
// du client : son .woff2 dans public/fonts/ et une ligne ici (outils/da.mjs le fait).
for (const p of liste as {famille: string; fichier: string; graisse?: string; style?: string}[]) {
	loadFont({family: p.famille, url: staticFile(`fonts/${p.fichier}`), weight: p.graisse ?? '400', style: p.style ?? 'normal'});
}
