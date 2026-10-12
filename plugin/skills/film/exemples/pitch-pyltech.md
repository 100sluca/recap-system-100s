<!-- Exemple réel : le pitch du projet Pyltech · slides multi-agent, écrit le 12/10/2026 d'après sa fiche et FABRICATION.md. 150 mots, lus en 43 à 48 s par Gemini 3.8 Flash TTS. -->
# Pitch Pyltech · slides multi-agent (45 s)


## Le problème
Chaque semaine, quelqu'un refait le même deck à la main : exporter les ventes, refaire les graphiques, tout recoller dans PowerPoint.
Et au moindre changement, on recommence.

## La solution
Pyltech, c'est un deck qui se modifie en une phrase.
Vous écrivez, en français : « passe le graphique en barres horizontales, et mets le Sud en avant ».

## Comment ça marche
Derrière, cinq agents se partagent le travail.
L'extracteur lit les données, le graphiste dessine, l'assembleur monte les slides, et un orchestrateur coordonne le tout, uniquement par messages.
Et seul ce qui change est redessiné : un graphique régénéré, trois réutilisés.

## La preuve
Chaque demande crée une nouvelle version du deck, qu'on peut annuler.
Sur la démo : onze tours de conversation, dix versions, vingt-huit tests au vert.

## La fin
Pyltech : vos slides suivent la conversation.
