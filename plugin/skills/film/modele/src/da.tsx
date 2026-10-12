import React, {createContext, useContext} from 'react';
import daFilm from '../da.json';

// La DA du film : ses couleurs par rôle, ses polices, sa marque. Elle vient de da.json, écrit à
// l'étape « La DA » (references/da.md) : celle du projet, celle du client relevée sur son site
// (outils/da.mjs), un duo client × signature, ou la palette propre au style choisi.
// Les composants lisent `C` et `POLICE` (la DA du film) ou `useDA()` (la DA de l'aperçu en cours).

export type Couleurs = {
	fond: string; // le fond du film
	surface: string; // cartes, bulles, fenêtres posées sur le fond
	encre: string; // le texte principal
	doux: string; // le texte secondaire
	pale: string; // étiquettes, détails, traits fins
	accent: string; // LA couleur de la marque, pour ce qui compte
	surAccent: string; // le texte posé sur l'accent
	accent2: string; // une seconde couleur, rare (ou la signature d'un duo)
	filet: string; // bordures fines
};
export type Police = {famille: string; graisse?: number; italique?: boolean};
export type DA = {
	nom: string; // d'où vient la DA, en clair : « site de Dupont & fils, relevé le 12/10/2026 »
	source: 'projet' | 'client' | 'duo' | 'style' | 'marque';
	couleurs: Couleurs;
	polices: {titre: Police; texte: Police; mono: Police; chiffres?: Police; appoint?: Police}; // appoint : un mot en italique, un caractère (sinon le titre)
	logo?: string | null; // fichier dans public/ (svg ou png), ou null : le nom en texte
	signature?: {nom: string; logo?: string | null; couleur?: string} | null; // duo : qui signe
};

export const DA_FILM = daFilm as unknown as DA;

const Contexte = createContext<DA>(DA_FILM);
/** Donne une autre DA aux composants dessous (les aperçus des styles s'en servent). */
export const AvecDA: React.FC<{readonly da?: DA; readonly children: React.ReactNode}> = ({da, children}) => (
	<Contexte.Provider value={da ?? DA_FILM}>{children}</Contexte.Provider>
);
export const useDA = () => useContext(Contexte);

export const C = DA_FILM.couleurs;
export const POLICE = {
	titre: DA_FILM.polices.titre.famille,
	texte: DA_FILM.polices.texte.famille,
	mono: DA_FILM.polices.mono.famille,
	chiffres: (DA_FILM.polices.chiffres ?? DA_FILM.polices.titre).famille,
};
