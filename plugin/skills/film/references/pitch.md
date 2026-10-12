# Le pitch et la voix off

Sans voix, un film montre le projet mais n'explique ni le problème ni le besoin. Le pitch est un
vrai pitch d'entrepreneur, lu en voix off : le problème, la solution, comment ça marche, la
preuve. C'est lui qui porte le film ; les plans viennent illustrer chaque phrase.

## Quand

Après la lecture du projet (et le choix de la DA et du style), **avant le storyboard**. Poser une
seule fois à l'utilisateur, sauf s'il a déjà répondu :

1. **La voix off** : une voix IA (proposée par défaut), sa propre voix enregistrée en doublage sur
   le film (rien ne sort de la machine : le bon choix pour un projet confidentiel), ou aucune (film
   musical) ;
2. **La durée** : de 45 s à 2 min, proposée d'après la taille du projet (tableau plus bas) ;
3. s'il a déjà son texte, le prendre tel quel.

Sans voix off, sauter cette étape : le film reste calé sur la musique.

## Écrire `<atelier>/PITCH.md`

Une phrase par ligne, sous cinq titres `##`. **Une ligne = une phrase lue = un plan du film.**
Le reste du fichier (titre `#`, notes en `>`, commentaires `<!-- -->`) n'est pas lu.

```markdown
# Pitch <projet> (<durée visée>)

## Le problème
<qui le vit, ce qui coince, concrètement : 1 à 2 phrases>

## La solution
<ce qu'est le projet, nommé, en une phrase ; puis ce qu'on fait avec, en une phrase>

## Comment ça marche
<le mécanisme en mots simples, 2 à 4 phrases : la carte « fonctionnement » de 4-archi/ dit l'ordre>

## La preuve
<des faits vérifiés : tests, versions, utilisateurs, temps gagné, ce que montre la démo>

## La fin
<le nom + la promesse en une phrase ; au besoin, où le trouver (adresse, commande)>
```

### Le budget de mots

Mesuré sur Gemini 3.8 Flash TTS (12/10/2026) : 150 mots lus en 43 à 48 s, soit environ
**3,2 mots par seconde**. Une personne qui lit son texte va plutôt à 2,5 mots par seconde.

| Durée | Voix IA | Sa voix | Pour |
|--:|--:|--:|---|
| 45 s | 130 mots | 110 mots | un outil, un script, une démo |
| 60 s | 180 | 150 | une appli d'un seul tenant |
| 90 s | 270 | 220 | une appli à plusieurs modules |
| 2 min | 360 | 300 | une plateforme, un projet client complet |

Le film dure la voix, plus 1 s avant (`--debut`) et environ 2 s pour la fin : `voix.mjs` donne le
minimum à la fin de son calcul.

### Les règles d'écriture

- **Que du vrai.** Le problème peut être dit de façon générale (« chaque semaine, quelqu'un
  refait le même deck »), mais aucun chiffre, client, témoignage ou résultat inventé. Les
  chiffres viennent du code, de la fiche, des cartes, du site.
- **Du français parlé.** Phrases courtes (20 mots au plus), une idée par phrase, le sujet en
  premier. « Vous » ou « tu » : un seul, celui de l'utilisateur.
- **Écrire comme ça se dit.** Les nombres en lettres quand ils sont petits (« vingt-huit
  tests »), les sigles comme ils se prononcent, les noms anglais vérifiés dans l'échantillon.
- **Pas de jargon sans explication.** « Cinq agents se passent le travail par messages » plutôt
  que « architecture multi-agent sur bus d'événements ».
- **Rien de confidentiel** : ni secret, ni donnée personnelle, ni nom de client sans son accord.

### Le faire valider

Montrer le pitch entier dans la réponse, avec sa durée estimée, et **attendre la réponse de
l'utilisateur** : la voix est l'épine dorsale du film, on ne la refait pas après les plans. Il
peut valider, corriger une phrase ou demander un autre ton. Exemple réel :
`exemples/pitch-pyltech.md`.

## La voix

`OUTILS/voix.mjs` écrit `public/voix/voix.wav` et `src/pitch.ts` (chaque phrase, avec l'instant où
elle commence et finit). L'étape « Pitch » du journal couvre le texte et la voix ; en doublage,
l'enregistrement a sa propre étape, « Doublage ».

### Voix IA : Gemini 3.8 Flash TTS

5e au classement mondial des voix (Artificial Analysis Speech Arena, octobre 2026), dans le palier
gratuit de l'API Gemini, plus de 130 langues dont le français. Un pitch de 45 s se génère en
moins de 20 s.

1. **La voix.** Par défaut **Achird** (amicale, masculine ; la préférée à l'écoute du 12/10/2026,
   devant Charon), ou le réglage `voix` de l'utilisateur. Pour comparer :
   `node OUTILS/voix.mjs echantillons <atelier>` lit les deux premières phrases avec Achird,
   Charon (informative, masculine), Sulafat (chaleureuse, féminine) et Kore (ferme, féminine) ;
   envoyer les quatre fichiers à l'utilisateur, qui choisit. `--voix A,B,C` pour d'autres voix
   parmi les 30 de Gemini.
2. **Lire le pitch.** `node OUTILS/voix.mjs ia <atelier> [--voix <nom>]`. Un seul appel : la voix
   enchaîne naturellement, le minutage est retrouvé à 0,5 s près. `--par-phrase` lit chaque
   phrase à part : minutage exact, une phrase ratée se refait seule, enchaînement un peu moins
   fluide. `--style "…"` change le ton (par défaut : posé, chaleureux, confiant, rythme vif).
3. **Une voix à soi** : créée dans Google AI Studio, par description (voice design) ou à partir
   d'un enregistrement de la personne avec son accord enregistré (voice replication). Son
   identifiant `voice_…` se passe à `--voix`.

La clé : la ligne `GEMINI_API_KEY=` de `~/.claude/recap-system-100s/.env`, copié du modèle
`.env.example` (skill `recap-system-100s`) par `-installer`, ou par `voix.mjs` au premier besoin ;
le réglage `envGemini` désigne un autre fichier si l'utilisateur préfère. Sans clé, `voix.mjs`
s'arrête en donnant le chemin du fichier : le dire à l'utilisateur, qui y colle sa clé lui-même.
Ne jamais lui demander la clé dans la conversation (elle resterait dans le journal) ; s'il la
donne quand même, ne l'écrire nulle part et lui conseiller de la régénérer. Clé gratuite :
https://aistudio.google.com/apikey. Une clé à part pour les films évite de partager le quota d'un
autre usage. **Le palier gratuit autorise Google à se servir
des textes envoyés** : pour un pitch confidentiel (client, projet non annoncé), passer par le
palier payant (quelques centimes la minute de voix) ou par la voix de l'utilisateur.

Il existe une voix mieux classée : ElevenLabs v4, payante. Ne l'utiliser que si l'utilisateur a un
compte et le demande.

### Sa propre voix, en doublage

L'utilisateur dit son pitch **sur le film**, comme un comédien de doublage : il voit la vidéo
passer et sait à chaque instant quelle phrase dire. Rien ne sort de sa machine.

1. **Le minutage prévu** : `node OUTILS/voix.mjs prevoir <atelier> [--debit 2.6] [--debut 2]`.
   Chaque phrase reçoit la durée d'une lecture posée (2,6 mots par seconde), avec une pause de
   0,5 s entre deux phrases et de 0,9 s entre deux parties. Le film commence 2 s avant la première
   phrase, le temps de la voir arriver. `src/pitch.ts` reçoit ce minutage, sans voix ; il est
   aussi rangé dans `doublage/prevu.json`.
2. **Le film** se fait sur `p(i)` comme avec une voix, puis se rend une première fois sans voix.
3. **Le studio** : `node OUTILS/doublage.mjs <atelier>` (en arrière-plan) sert une page locale
   (http://localhost:3074) et l'ouvre dans le navigateur. On y trouve :
   - la vidéo, avec dessous la **bande rythmo** : le texte défile de droite à gauche et chaque
     phrase s'étire sur la durée prévue pour la dire ; on la dit quand elle passe sous la barre
     orange ;
   - la phrase à dire en grand, la suivante dessous, et un compte à rebours avant chacune ;
   - « Répéter » (sans enregistrer), « Enregistrer » (barre d'espace, après un décompte 3-2-1),
     « Réécouter la prise » (la prise jouée sur le film), « Garder cette prise » ;
   - le choix du micro, son niveau, et « J'ai un casque » (micro sans traitement ; sans casque,
     l'annulation d'écho du navigateur retire la musique du film).
   La prise commence avant le film ; la page mesure où tombe l'image 0 du film dans la prise
   (le « décalage »), et l'envoie avec elle.
4. **Le recalage** : « Garder cette prise » range la prise dans `doublage/prises/` et lance
   `voix.mjs importer --doublage`. L'outil retire ce qui précède l'image 0 et ramène la voix à
   −17 LUFS. Il cherche ensuite chaque phrase où la voix reprend après un silence, à 1,5 s au
   plus de l'instant prévu. Il écrit `voix.wav` et `src/pitch.ts` (la voix entre à l'image 0) et
   donne l'écart de chaque phrase avec le prévu (testé : 0,1 s près). « C'est bon, terminer »
   arrête l'outil. On refait alors planche et rendu : les plans se recalent sur la vraie voix.

Les conseils à lui donner :
- un casque si possible, une pièce calme, à 20 cm du micro ;
- pas besoin d'être exact à la syllabe : une phrase dite un peu tôt ou un peu tard déplace son
  plan, pas l'inverse.

Une lecture libre, sans le film (un mémo vocal par exemple), s'importe aussi :
`node OUTILS/voix.mjs importer <atelier> "<fichier audio>"` (wav, mp3, m4a, webm…). Les phrases sont
alors retrouvées comme pour une voix IA.

## Le film sur la voix

- **Les plans se coupent sur les phrases** : `p(i)` (dans `src/Voix.tsx`) est l'image où commence
  la phrase i, `pFin(i)` celle où elle finit. Le plan d'une phrase commence un peu avant elle
  (`p(i, -6)`) : l'image annonce, la voix confirme. La grille `t(n)` de la musique reste pour les
  petits mouvements.
- **La musique passe dessous** : `<Musique />` (dans `Son.tsx`) joue aussi la voix et multiplie
  son propre volume par `sousVoix(f)` : 30 % pendant qu'on parle, remontée en 0,4 s dans les
  silences de plus de 1,5 s. Rien à ajouter au film. Une musique calme : c'est la voix qui mène.
- **Des sous-titres**, dans la DA du film : une vidéo sur un réseau se regarde souvent sans le son.
  `phraseA(f)` donne la phrase en cours.
- **La durée** : `NB_TEMPS` couvre `DEBUT_VOIX` + `DUREE_VOIX` + la fin.
- **Contrôles** : sur la planche, une image à `p(i) + 10` par phrase (le plan montre-t-il bien ce
  que dit la phrase ?) ; au rendu, viser −16 à −14 LUFS et une voix nettement au-dessus de la
  musique. Testé le 12/10/2026 : −14,9 LUFS en voix IA, −14,1 en doublage.
- **Transparence** : pour une voix IA, l'indiquer dans la description de la vidéo (« voix off
  générée par IA »), et toujours pour une voix clonée.
- **Livraison** : `livrer.mjs` range le pitch avec la vidéo (`<projet>-vN-pitch.md`) et garde
  `voix.wav` dans `-source/public/voix/` (un enregistrement de l'utilisateur ne se refait pas).
