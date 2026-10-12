# Style 4 · Teaser

**D'après** le teaser de feuille de route (youmind.com/fr-FR/video-prompts/product-roadmap-teaser-animation-12038).

**L'idée.** Une bande-annonce : le noir, deux faisceaux de lumière qui balaient lentement, le signe
du projet dont le contour se trace puis s'embrase ; deux phrases qui retournent une idée (l'accroche,
puis la réponse) ; un mur de cartes qui s'allument par à-coups pendant que la caméra glisse, l'une
s'embrase ; enfin le nom, avec un mot en italique à empattements dans l'accent.

**Pour** : annoncer une nouveauté, une version, une sortie ; donner envie avant de montrer. Bon aussi
en ouverture d'une Démo produit.

## La DA

- Palette propre : noir `#0a0807`, surfaces `#16120f`, texte `#f6efe7`, accent ambre `#f2b24c` ;
  Inter, Instrument Serif italique pour le mot final (`appoint` ; avec une marque : sa police d'appoint, sinon sa police de titre en italique).
- DA d'une marque (ses polices et ses seules couleurs, toujours) (`adapterDA('teaser', …)`) : **passée au noir profond**, l'accent pour la lumière.

## Le mouvement

- Lent : entrées de 18 à 26 images, mots qui montent en se défloutant (`Phrase`), sorties floutées.
- Les faisceaux (`Faisceaux`) traversent l'écran en continu ; le signe (`Signe`) se trace (26 images)
  puis s'allume avec une lueur.
- Le mur : les cartes s'allument par à-coups (clignotement de 3 images, ordre au hasard reproductible),
  la caméra glisse et pousse (+10 %), une carte s'embrase (liseré et lueur de l'accent).

## Le son

Nappe grave, impacts sourds sur le signe et sur le nom, un « riser » sous le mur de cartes, silence
juste avant le nom. Musique 85 à 110 temps/min, montée lente (les « suspense » et « riser » de la banque-son).

## Le code

`src/styles/teaser/Apercu.tsx` et `kit.tsx` (`Faisceaux`, `Signe`).

## Une trame possible

Le signe s'embrase → « Tu croyais que… » → « En fait… » → le mur de ce qui arrive → le nom, un mot en
italique, la date ou l'adresse.
