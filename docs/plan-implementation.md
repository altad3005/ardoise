# Ardoise — Plan d'implémentation

> UE Projet d'intégration de développement — EAFC Namur-Cadets — 2026-2027
> Auteur : Alex Tadino — Chargé de cours : Yolan Fery
> Version : **1.0** — novembre 2026
> Complément au cahier des charges (`cahier-des-charges.md`) : le cahier dit **quoi** construire, ce plan dit **avec quels outils** et **dans quel ordre**. Les justifications des choix structurants sont dans `annexe-justifications.md`.

### Historique des versions

| Version | Date | Changements |
|---|---|---|
| 1.0 | 12/11/2026 | Choix techniques et planning extraits du cahier des charges (anciennes sections 10 et 11, version 1.15). |

---

## 1. Choix techniques

### 1.1 Synthèse

| Couche | Choix | Justification |
|---|---|---|
| Langage et exécution | **TypeScript 6** (épinglé), **Node.js 26 LTS**, modules **ESM** | Un seul langage de bout en bout, types partagés entre services et interface. Node 26 devient la LTS active le 28/10/2026, le jour où Node 24 passe en maintenance ; Vitest 5 n'accepte d'ailleurs que Node 22.12, 24 ou ≥ 26. **TypeScript 7 est écarté pour l'instant** : il ne publie pas d'API programmatique de compilation, dont `nest build` et le plugin Swagger ont besoin (1.6). |
| Framework applicatif | **NestJS 12**, en **modules ESM** | Architecture modulaire, injection de dépendances, guards, validation déclarative, OpenAPI généré. Ses modules portent les frontières Bar / Trésorerie / Répertoire (annexe §1). La version 12 (août 2026) génère des projets ESM avec Vitest et oxlint, compilés par `tsc` : partir en CommonJS reviendrait à démarrer sur l'ancien modèle. |
| Base de données | **PostgreSQL**, une base par service | Base relationnelle robuste ; ses transactions ACID rendent atomique une opération qui touche le stock et la trésorerie (cahier des charges, 9.4). SQL conseillé par le cours. |
| Accès aux données et migrations | **Prisma 7** (Prisma Migrate), version épinglée | Schéma déclaratif, migrations SQL générées, versionnées et relues ; client typé ; multi-schéma pour séparer `bar`, `tresorerie` et `repertoire`. Isolé derrière des repositories (ENF-36). Prisma 8 reste en *release candidate* et sa CLI n'offre ni `migrate` ni `generate` : inadapté à un projet noté sur les migrations (annexe §4). **Les deux paquets sont épinglés explicitement** : au 01/10/2026, `prisma@latest` renvoie une RC de la 8 alors que `@prisma/client@latest` renvoie la 7 (1.6). |
| Validation des entrées | **Zod**, via les schémas *Standard Schema* acceptés par `@Body()`, `@Query()` et `@Param()` | Un schéma unique dans le paquet partagé valide côté serveur et côté interface. `@nestjs/swagger` 12 sait les refléter dans l'OpenAPI, moyennant un convertisseur (`zod-openapi`). |
| Interface | **React 19 + Vite 8**, **TanStack Query 5**, **TanStack Router 1** | Framework conseillé par le cours ; Vite pour la rapidité de développement ; TanStack Query pour le cache et les appels API ; TanStack Router pour ses routes typées, cohérentes avec un client d'API généré. |
| Client d'API | **Généré depuis l'OpenAPI** (`openapi-typescript` ou `orval`) | Les types et les appels ne sont pas réécrits à la main : une rupture de contrat entre le serveur et l'interface devient une erreur de compilation. |
| Authentification | **Service Identité maison**, JWT signés par clé asymétrique, Argon2id | Les règles propres au projet (fondateur, code d'adhésion, rôles par association) s'intègrent mal dans un fournisseur générique ; la vérification locale des jetons évite une dépendance d'exécution. |
| Tests | **Vitest 5** (unitaires), **Supertest** (API) | Vitest est le choix par défaut des projets ESM générés par le CLI NestJS 12 ; natif ESM, rapide, API compatible avec celle de Jest. |
| Organisation du code | **Monorepo** pnpm workspaces | Un seul dépôt GitHub (exigence du cours) : `apps/identite/`, `apps/gestion/` (modules `bar`, `tresorerie` et `repertoire`), `apps/web/` et un paquet de types partagés. |
| Conteneurs | **Docker**, images publiées sur GitHub Container Registry | Trois images versionnées : `identite`, `gestion`, `web`. L'exigence du cours (au moins deux images, deux services indépendants) est respectée. |
| CI/CD | **GitHub Actions** + **release-please** | Outils conseillés par le cours ; versionnement sémantique et changelog générés depuis les Conventional Commits. |
| Hébergement | **VPS** + **docker compose**, **Caddy** (fournisseur et domaine à déterminer) | Suffisant pour le volume visé ; Caddy fournit le point d'entrée unique et HTTPS automatique. |

### 1.2 Décisions structurantes

Quatre choix s'écartent de la voie la plus attendue et sont argumentés dans l'**annexe des justifications** :

| Décision | Résumé | Détail |
|---|---|---|
| NestJS plutôt que Spring Boot | Mêmes concepts (injection de dépendances, contrôleurs, guards, migrations versionnées) dans un langage déjà maîtrisé ; le temps du projet va à l'architecture, pas à l'apprentissage d'un langage. | Annexe §1, avec la table de correspondance Spring ↔ NestJS |
| Deux services plutôt que trois | On sépare ce qui doit l'être (l'identité, qui porte le risque de sécurité) et on garde ensemble ce qui partage des transactions (stock et argent). Monolithe modulaire, frontières prêtes pour une extraction. | Annexe §2 |
| L'ardoise appartient au module Bar | Modélisée d'abord comme une créance de la trésorerie, elle obligeait chaque vente à écrire dans deux domaines. Déplacée au comptoir, elle supprime la seule transaction transverse du chemin critique de la caisse, et fait apparaître le module Répertoire. | Annexe §3 |
| Appels directs plutôt qu'événements entre modules | Un événement publié dans le même service risque d'être traité hors de la transaction qui l'a produit : un achat pourrait exister sans sa dépense. | Annexe §3 |

### 1.3 Transactions à travers plusieurs modules

Un achat de marchandise ou une clôture de soirée écrit dans les tables de deux modules, en **une seule transaction**, alors que l'accès aux données passe par des repositories (ENF-36, ENF-39). Depuis que l'ardoise appartient au module Bar (annexe §3), plus aucune vente n'est concernée : seules les opérations à froid traversent une frontière.

- Le client de transaction est propagé par contexte d'exécution : `nestjs-cls`, son greffon `@nestjs-cls/transactional` et `@nestjs-cls/transactional-adapter-prisma` (version 2, compatible NestJS 12, ESM et Prisma 7 comme 8). Une méthode `@Transactional()` ouvre la transaction ; les repositories lisent le client courant via `TransactionHost`.
- **Ce choix est fait au squelette** : revenir dessus en cours de projet oblige à réécrire la couche d'accès aux données. L'alternative (passer le client en paramètre) est décrite en annexe §4.
- Un test vérifie qu'un échec côté Trésorerie annule bien l'écriture côté Bar.

### 1.4 Migrations de schéma

- Chaque service possède son schéma Prisma et son dossier de migrations. Dans le service Gestion, un seul fichier Prisma décrit les tables des trois modules, réparties en **trois schémas PostgreSQL** `bar`, `tresorerie` et `repertoire` (cahier des charges, 9.7), grâce au support multi-schéma documenté pour Prisma 7.
- En développement, une migration est générée à partir du schéma, **relue**, corrigée si nécessaire (renommages), puis versionnée dans Git.
- En production, les migrations en attente sont appliquées au démarrage du conteneur, avant l'application.
- Aucune migration de retour arrière n'est prévue : une erreur se corrige par une nouvelle migration.
- Un changement cassant sur une table remplie est découpé en étapes (ajout facultatif, remplissage, contrainte).
- Le catalogue commun (RG-CAT-02) est livré sous forme de migration de données.
- La CI applique toutes les migrations sur une base vide à chaque pull request.

### 1.5 Chaîne d'intégration et de déploiement

1. **Pull request** : lint, tests unitaires et d'API, application des migrations sur une base de test, construction des images.
2. **Fusion sur `main`** : release-please ouvre ou met à jour la pull request de version.
3. **Publication d'une version** : les images Docker sont construites, étiquetées avec leur numéro de version et publiées sur GitHub Container Registry.
4. **Déploiement** : le serveur récupère les images de la version publiée et redémarre les services via docker compose.

---

### 1.6 Versions retenues et pièges de compatibilité

Versions vérifiées sur le registre npm le **01/10/2026**. Elles sont **épinglées** dans `package.json` : trois d'entre elles ont un `latest` qui ne correspond pas à ce que le projet doit installer.

| Paquet | Version retenue | Remarque |
|---|---|---|
| Node.js | **26** (LTS active au 28/10/2026) | Node 24 passe en maintenance le 20/10/2026. Vitest 5 exige Node 22.12, 24 ou ≥ 26 ; `@prisma/client` 7 exige ≥ 20.19. |
| `typescript` | **~6.0.3** | ⚠️ `typescript@latest` = **7.0.2**. La 7 ne publie pas d'API programmatique de compilation : `nest build`, le plugin CLI de Swagger et typescript-eslint en dépendent et cessent de fonctionner. `@nestjs/cli` 12.0.8 dépend lui-même de `typescript ~6.0.2`, et `@nestjs/swagger` 12 accepte `^5.5 \|\| ^6`. TypeScript 7 peut servir **uniquement** à un `tsc --noEmit` de vérification rapide, en plus du build. |
| `@nestjs/core`, `@nestjs/common` | **12.1.2** | |
| `@nestjs/cli` | **12.0.8** | Compilation par `tsc` (constructeur par défaut du modèle généré). Rspack reste disponible en option, mais n'est pas utilisé. |
| `@nestjs/swagger` | **12.0.2** | Dépend de `@standard-schema/spec` : c'est ce qui permet d'exposer des schémas Zod dans l'OpenAPI. |
| `prisma` et `@prisma/client` | **7.10.0** toutes les deux | ⚠️ `prisma@latest` = **8.0.0-rc.19** alors que `@prisma/client@latest` = **7.10.0**. Installer sans épingler donne une CLI 8 en RC avec un client 7. |
| `zod` | **4.6.5** | Accepté directement par `@Body()`, `@Query()` et `@Param()` (*Standard Schema*). |
| `zod-openapi` | **6.0.2** | Peer `zod ^4` : cohérent. |
| `nestjs-cls` / `@nestjs-cls/transactional` / `@nestjs-cls/transactional-adapter-prisma` | **7.0.1 / 4.0.1 / 2.0.1** | Chaîne vérifiée : peers `@nestjs/core >= 10 < 13` (NestJS 12 ✔) et `prisma`, `@prisma/client > 4 < 9` (Prisma 7 ✔). |
| `vite` / `@vitejs/plugin-react` | **8.3.2 / 6.1.1** | |
| `vitest` / `supertest` | **5.0.3 / 7.3.0** | Vitest 5 accepte Vite 6.4, 7 et 8. |
| `react` | **19.3.0** | |
| `tailwindcss` / `@tailwindcss/vite` | **4.3.3** | Le plugin accepte Vite 5.2 à 8. |
| `@tanstack/react-query` | **5.104.0** | |
| `@tanstack/react-router` / `@tanstack/router-plugin` | **1.170.41 / 1.168.42** | Le plugin exige `react-router ^1.170.41` : les deux se mettent à jour ensemble. |
| `oxlint` | **1.86.0** | |
| `pnpm` | **12.8.1** | |
| `release-please` | **17.11.2** | |

**Une dépendance écartée.** `nestjs-zod`, souvent conseillé pour marier Zod et NestJS, a pour peer `@nestjs/common ^10 \|\| ^11` : il ne couvre pas NestJS 12. Il est inutile ici, puisque NestJS 12 accepte les schémas *Standard Schema* nativement et que `zod-openapi` suffit pour l'OpenAPI.

**Ce tableau est daté volontairement.** Il sera revérifié au moment de créer le squelette, et à nouveau avant la remise : Prisma 8 passera en version stable d'ici là, et le passage à TypeScript 7 dépendra de l'arrivée d'un constructeur compatible dans le CLI NestJS.

### 1.7 Nommage dans le code

Tout le code est écrit **en anglais** : dossiers, fichiers, classes, méthodes, schémas PostgreSQL, routes et valeurs d'énumération. Ce document conserve les termes métier français ; la table ci-dessous fait la correspondance.

| Dans ce document | Dans le code |
|---|---|
| Service Identités et organisations | `identity` (`apps/identity`, route `/api/identity`) |
| Service Gestion | `management` (`apps/management`, route `/api/management`) |
| Module Bar | `bar` |
| Module Trésorerie | `treasury` |
| Module Répertoire | `directory` |
| Schémas PostgreSQL `bar`, `tresorerie`, `repertoire` | `bar`, `treasury`, `directory` |
| Rôles Administrateur, Gestionnaire de stock, Trésorier, Serveur, Lecteur | `ADMINISTRATOR`, `STOCK_MANAGER`, `TREASURER`, `BARTENDER`, `VIEWER` |
| `enregistrerAchat`, `enregistrerClotureSoiree`, `enregistrerRentreeArdoise` | `recordPurchase`, `recordEveningClosing`, `recordTabPayment` |
| `/internal/utilisateurs/noms`, `/internal/associations/:id/membres` | `/internal/users/names`, `/internal/associations/:id/members` |
| Ardoise, soirée, tiers | `Tab`, `Evening`, `Party` |

Le rôle Serveur devient `BARTENDER` et non `SERVER`, pour ne pas le confondre avec un serveur informatique.

---

## 2. Planning et organisation

### 2.1 Méthode

- Projet mené **seul**, licence **MIT**, dépôt GitHub public.
- Itérations d'une semaine, alignées sur les séances de cours.
- Backlog : les user stories du cahier des charges (section 6), suivies dans un tableau GitHub Projects (À faire, En cours, En revue, Terminé).
- Une branche et une pull request par user story ; fusion uniquement si la CI est verte.
- **Définition de « terminé »** : code relu, tests écrits pour les règles concernées, migration relue, documentation OpenAPI à jour, déployé sur le serveur.

### 2.2 Jalons

| Période | Objectif | Contenu |
|---|---|---|
| Jusqu'au 24/09 | Cahier des charges | Cahier des charges validé ; dépôt GitHub et monorepo créés. |
| 24/09 – 08/10 | **Squelette déployé** | Deux services vides répondant `/health` (Identité, Gestion) et l'interface, une migration initiale par base, trois images Docker publiées par la CI, application accessible en ligne en HTTPS. |
| 08/10 – 22/10 | Catalogue | US-12 à 15, 17, 18 ; contexte d'association de démonstration dans le service Gestion. |
| 22/10 – 12/11 | Caisse | US-40, 41 et 11 (comptes, projets, paramétrage : le minimum de trésorerie qu'exige une soirée), puis US-28 à 31, 34, 35 ; clôture de soirée et appel transactionnel Bar → Trésorerie. |
| 12/11 – 19/11 | Ardoises | US-53, US-36 à 39 ; répertoire des tiers, ardoises locales au module Bar. |
| 19/11 – 26/11 | Achats et stock | US-20 à 24. |
| 26/11 – 03/12 | Trésorerie | US-42 à 45, 48 à 50, 54 ; façade publique du module Trésorerie et tests de l'invariant de situation nette. |
| 03/12 – 10/12 | Comptes et associations | US-01 à 08, 10 ; le jeton JWT d'Identité remplace le contexte de démonstration. |
| Selon l'avancement | Compléments | Stories S et C restantes : US-09, 16, 19, 25 à 27, 32, 33, 46, 47, 51, 52. |
| 10/12 – 17/12 | Sécurité | Analyse de sécurité (OWASP Top 10), tests d'isolation entre associations, corrections. |
| 17/12 – 03/01 | Stabilisation et livraison | Revue technique, corrections, documentation, version 1.0. **Remise du projet le 03/01 à 23 h 59**, dépôt GitHub public et application accessible en ligne. |
| 03/01 – 14/01 | Défense orale | Préparation et présentation orale (séances des 07/01 et 14/01) : démonstration sur l'environnement déployé, justification des choix techniques (annexe). |

Le déploiement est mis en place **dès la deuxième itération**, avant toute fonctionnalité métier, pour que chaque fonctionnalité soit livrée en ligne au fil de l'eau.

**Ordre des jalons.** Ce qu'attend d'abord le client, ce sont les fonctionnalités de son bar : les comptes et les associations viennent donc en dernier. Les fonctionnalités métier n'ont pas besoin d'un compte, seulement d'un contexte « quelle association, quels rôles » (cahier des charges, 9.3). Jusqu'au jalon *Comptes et associations*, le service Gestion fournit ce contexte pour une **association de démonstration** dotée de tous les rôles ; chaque route déclare déjà les rôles qu'elle exige et filtre sur l'association du contexte. Le jeton émis par Identité remplace ensuite la source de ce contexte, sans modifier les routes. Au sein des jalons, l'ordre suit les dépendances entre règles : une soirée exige un projet et un compte caisse (RG-SOI-01, 03, 08), une ardoise un tiers du répertoire (RG-ARD-04), et la caisse peut précéder le stock puisqu'une vente est acceptée même si le stock devient négatif.

### 2.3 Risques

| Risque | Impact | Mesure |
|---|---|---|
| Périmètre trop large pour le délai | Fonctionnalités inachevées | Priorisation MoSCoW ; les stories **C** et une partie des **S** sont abandonnées si nécessaire. |
| Frontière entre modules non respectée en codant (jointure directe, accès aux tables de l'autre module) | L'extraction future de la Trésorerie devient impossible | Interfaces publiques explicites, aucune clé étrangère entre modules, revue de chaque pull request sur ce point. |
| Fuite de données entre associations | Critique (sécurité) | Filtrage systématique, tests automatisés d'isolation (ENF-22). |
| Découverte tardive des problèmes de déploiement | Blocage en fin de projet | Squelette déployé dès la deuxième itération. |
| Authentification réelle branchée tardivement | Contrôles de rôles ou filtrage par association oubliés sur des routes déjà écrites | Contexte d'association et rôles exigés déclarés sur chaque route dès le premier jalon ; tests d'isolation au jalon Sécurité. |
| Application en ligne sans comptes jusqu'en décembre | Données de démonstration modifiables par n'importe qui | Données sans valeur réelle ; accès protégé par un mot de passe au niveau du reverse proxy si nécessaire. |
