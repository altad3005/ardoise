# Ardoise

Application web de gestion de bar associatif : caisse, stock et trésorerie réunis dans un seul outil. Chaque opération réelle (un ticket d'achat, une vente, un comptage) n'est saisie qu'une fois ; ses effets sur le stock et sur l'argent sont calculés automatiquement.

Pensée pour les associations tenues par des bénévoles (unités scoutes, cercles, clubs, comités des fêtes), qui gèrent aujourd'hui leur bar avec des tableurs séparés.

## Fonctionnalités

- **Caisse** : ouverture de soirée avec fixation des prix, encaissement multi-serveurs sur smartphone ou tablette, clôture avec comptage des espèces.
- **Ardoises** : consommations mises au nom d'une personne, partageables entre plusieurs, réglées plus tard.
- **Stock** : achats par ticket, coût moyen pondéré, inventaires et écarts, alertes de réapprovisionnement.
- **Trésorerie** : comptes, projets, frais avancés, créances et dettes, résultat par projet et situation nette.
- **Multi-associations** : chaque association ne voit que ses données ; rôles par association (administrateur, gestionnaire de stock, trésorier, serveur, lecteur).

## Architecture

Deux services indépendants, chacun avec sa propre base PostgreSQL et son conteneur :

| Service | Rôle |
|---|---|
| **identite** | Comptes, associations, adhésions, rôles. Émet les jetons d'accès (JWT signés par clé asymétrique). |
| **gestion** | Monolithe modulaire : module **Stock** (catalogue, achats, soirées, ventes, inventaires) et module **Trésorerie** (comptes, projets, mouvements, créances et dettes). |

```
Navigateur (React) ──HTTPS──► Caddy ──► identite  [BD identité]
                                    └─► gestion   [BD gestion]
                                          ├─ stock
                                          └─ tresorerie
```

Le service Gestion vérifie les jetons localement avec la clé publique, sans appeler Identité. Les modules Stock et Trésorerie n'accèdent jamais aux tables l'un de l'autre : le Stock appelle l'interface publique de la Trésorerie, dans la même transaction, ce qui garantit qu'une vente ou un achat n'est jamais enregistré d'un côté sans l'autre.

## Stack

TypeScript · NestJS · PostgreSQL · Prisma · React + Vite · Docker · GitHub Actions · release-please · Caddy

## Structure du dépôt

```
apps/
  identite/       service Identité
  gestion/        service Gestion
    src/stock/
    src/tresorerie/
  web/            interface React
packages/
  types/          types partagés (DTO)
docs/
  cahier-des-charges.md
```

## Lancer en local

*À compléter avec le squelette.*

## Documentation

- [Cahier des charges](docs/cahier-des-charges.md) : règles de gestion, user stories, modèle de données, choix techniques.
- Documentation des API : OpenAPI, générée par chaque service.

## Contexte

Projet réalisé dans le cadre de l'UE *Projet d'intégration de développement* — EAFC Namur-Cadets, 2026-2027.

## Licence

[MIT](LICENSE)
