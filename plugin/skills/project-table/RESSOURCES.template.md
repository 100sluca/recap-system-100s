# Ressources du projet <NOM>

> Mis à jour le <JJ/MM/AAAA> · **aucune valeur secrète ici** : seulement les noms, les formats, les comptes et où tout trouver.
> Les clés elles-mêmes, si tu veux les noter : `RESSOURCES.local.md` (ignoré par git).

## 1. Comptes

| Fournisseur | Compte | Organisation / projet / ID | Sert à | Lien console |
|---|---|---|---|---|
| Google | `prenom@exemple.com` | projet Google Cloud `mon-projet-123` | Clé Gemini, OAuth | https://console.cloud.google.com |
| Supabase | `prenom@exemple.com` | org `…`, projet `abcd1234` | Base de données, auth | https://supabase.com/dashboard |
| Cloudflare | `prenom@exemple.com` | compte `…` | Hébergement (Pages) | https://dash.cloudflare.com |
| GitHub | `pseudo` | dépôt `pseudo/depot` | Code, CI | https://github.com/pseudo/depot |

## 2. Services et adresses

| Source | Ressource | Adresse | À quoi ça sert | Projet | État |
|---|---|---|---|---|---|
| Cloudflare Pages | Projet `mon-site` | https://mon-site.pages.dev | Site public | `site/` | actif |

**Services écartés :** <service> (<raison>).

## 3. Variables d'environnement

| Source | Projet | Où la définir | Variable | Valeur attendue | Obligatoire | Lien |
|---|---|---|---|---|---|---|
| Google AI Studio | `app/` | `app/.env` | `GOOGLE_API_KEY` | clé `AIza…` | oui | https://aistudio.google.com/apikey |

## 4. Clés d'API et fournisseurs

| Fournisseur | Type | API / modèle | Sert à | Compte lié | Variable | Stockée où | Offre | Ta clé |
|---|---|---|---|---|---|---|---|---|
| Google (Gemini) | LLM | Gemini API | Résumés, analyse | `prenom@exemple.com` | `GOOGLE_API_KEY` | `app/.env` | gratuite (quota) | |

## 5. Jetons, accès et scopes

| Fournisseur | Jeton ou accès | Scopes et droits | Utilisé par | Stocké où | Expiration | Lien |
|---|---|---|---|---|---|---|
| GitHub | Jeton fine-grained `nom` | dépôt `pseudo/depot` seulement ; Contents : Read and write | API du site | secret Cloudflare `GITHUB_TOKEN` | 1 an | https://github.com/settings/personal-access-tokens |

## 6. API publiques sans clé

| Source | Adresse | Usage | Projet |
|---|---|---|---|

## 7. Ports locaux

| Port | Service | Commande |
|---|---|---|
