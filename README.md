# Ardoise

Application web de gestion de bar associatif : caisse, stock et trésorerie réunis dans un seul outil. Chaque opération réelle (un ticket d'achat, une vente, un comptage) n'est saisie qu'une fois ; ses effets sur le stock et sur l'argent sont calculés automatiquement.

Pensée pour les associations tenues par des bénévoles (unités scoutes, cercles, clubs, comités des fêtes), qui gèrent aujourd'hui leur bar avec des tableurs séparés.

## Fonctionnalités

- **Caisse** : ouverture de soirée avec fixation des prix, encaissement multi-serveurs sur smartphone ou tablette, clôture avec comptage des espèces.
- **Ardoises** : consommations mises au nom d'une personne, partageables entre plusieurs, réglées plus tard.
- **Répertoire** : une seule liste de tiers (membres, personnes, magasins), pour voir ensemble ce qu'une personne doit et ce qu'on lui doit.
- **Stock** : achats par ticket, coût moyen pondéré, inventaires et écarts, alertes de réapprovisionnement.
- **Trésorerie** : comptes, projets, frais avancés, créances et dettes, résultat par projet et situation nette.
- **Multi-associations** : chaque association ne voit que ses données ; rôles par association (administrateur, gestionnaire de stock, trésorier, serveur, lecteur).

## Architecture

Deux services indépendants, chacun avec sa propre base PostgreSQL et son conteneur :

| Service | Rôle |
|---|---|
| **identity** | Comptes, associations, adhésions, rôles. Émet les jetons d'accès (JWT signés par clé asymétrique). |
| **management** | Monolithe modulaire à trois modules : **Bar** (catalogue, stock, achats, soirées, ventes, ardoises, inventaires), **Trésorerie** (exercices, comptes, projets, mouvements, créances et dettes) et **Répertoire** (personnes et magasins). |

```
Navigateur (React) ──HTTPS──► Caddy ──► identity    [BD identité]
                                    └─► management  [BD gestion]
                                          ├─ bar ──────► treasury
                                          └─ directory ◄─┘
```

- **Jetons** : Gestion vérifie les jetons localement avec la clé publique d'Identité (JWKS), sans l'appeler à chaque requête.
- **Dépendances à sens unique** : Bar appelle Trésorerie, Bar et Trésorerie appellent Répertoire, rien ne remonte. Chaque module passe par la façade publique de l'autre, jamais par ses tables.
- **Atomicité** : un achat ou une clôture de soirée touche le stock et l'argent dans une seule transaction ; il n'est jamais enregistré d'un côté sans l'autre.
- **Caisse sans dépendance** : l'ardoise appartient au module Bar, donc une vente ne traverse aucune frontière de module ni aucun appel réseau.
- **Frontière vérifiable** : un schéma PostgreSQL par module (`bar`, `treasury`, `directory`) et des règles `dependency-cruiser` en CI.

## Stack

| Couche | Outils |
|---|---|
| Back-end | Node.js 26 · TypeScript 6 (ESM) · NestJS 12 · Zod |
| Données | PostgreSQL · Prisma 7 (multi-schéma, Prisma Migrate) |
| Front-end | React 19 · Vite 8 · TanStack Query & Router · Tailwind CSS 4 · client d'API généré depuis l'OpenAPI |
| Qualité | Vitest · Supertest · oxlint · dependency-cruiser |
| Livraison | pnpm workspaces · Docker · GitHub Actions · release-please · Caddy |

Les versions exactes et les pièges de compatibilité (TypeScript 7, Prisma 8) sont détaillés dans le [cahier des charges, section 10.6](docs/cahier-des-charges.md#106-versions-retenues-et-pièges-de-compatibilité).

## Structure du dépôt

```
apps/
  identity/       service Identité
  management/     service Gestion
    src/bar/
    src/treasury/
    src/directory/
  web/            interface React
packages/
  types/          schémas Zod et types partagés
infra/
  caddy/          reverse proxy et fichiers statiques
  docker/         Dockerfiles
  postgres/       initialisation des bases locales
docs/
  cahier-des-charges.md
```

## Lancer en local

Prérequis : Node.js 26, pnpm 12, Docker ou Podman.

**Développement** (rechargement à chaud) :

```bash
pnpm install
cp apps/identity/.env.example apps/identity/.env
cp apps/management/.env.example apps/management/.env
docker compose up -d postgres
pnpm --filter @ardoise/types build
pnpm --filter @ardoise/identity start:dev     # http://localhost:3001
pnpm --filter @ardoise/management start:dev   # http://localhost:3002
pnpm --filter @ardoise/web dev                # http://localhost:5173
```

**Pile complète en conteneurs**, comme en production :

```bash
docker compose up -d --build                  # http://localhost:8080
```

**Avant de committer** : `pnpm check` (formatage, lint, frontières entre modules, types, tests).

## Documentation

- [Cahier des charges](docs/cahier-des-charges.md) : règles de gestion, user stories, modèle de données, choix techniques.
- Le code est entièrement en anglais ; la correspondance avec les termes du cahier des charges est dans sa [section 10.7](docs/cahier-des-charges.md#107-nommage-dans-le-code).
- Documentation des API : OpenAPI, générée par chaque service.

## Contexte

Projet réalisé dans le cadre de l'UE *Projet d'intégration de développement* — EAFC Namur-Cadets, 2026-2027.

## Licence

[MIT](LICENSE)
