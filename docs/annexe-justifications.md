# Ardoise — Annexe : décisions et justifications

> Complément au cahier des charges (`cahier-des-charges.md`, dans le même dossier `docs/` du dépôt). Le cahier dit **ce que fait** l'application et **comment elle est construite** ; cette annexe dit **pourquoi** ces choix ont été faits. Elle sert de support à la défense orale.
>
> Dernière vérification des versions et des compatibilités : **1er octobre 2026** (relevé des paquets et de leurs dépendances de pair sur le registre npm ; tableau dans le cahier, 10.6). Décision sur la place de l'ardoise : **27 septembre 2026** (§3).

## 1. NestJS plutôt que Spring Boot

Spring Boot est conseillé par le cours. NestJS a été retenu car il repose sur les mêmes concepts, dans un langage déjà maîtrisé : le temps du projet va à l'architecture plutôt qu'à l'apprentissage d'un langage.

**Version et outillage.** NestJS 12 est sorti fin août 2026. Le CLI demande CommonJS ou ESM ; les projets **ESM** sont générés avec **Vitest** (tests), **oxlint** (analyse statique) et **Rspack** (empaquetage), et le framework accepte les schémas *Standard Schema* (Zod, Valibot, ArkType) dans `@Body()`, `@Query()` et `@Param()`. Partir en CommonJS reviendrait à démarrer un projet neuf sur l'ancien modèle, avec des outils que le CLI ne génère plus par défaut.

| Concept | Spring Boot | NestJS |
|---|---|---|
| Composants et injection de dépendances | `@Service`, `@Autowired` | `@Injectable`, injection par constructeur |
| Contrôleurs REST | `@RestController` | `@Controller` |
| Validation des entrées | Bean Validation (`@Valid`) | Schéma Zod (*Standard Schema*) sur `@Body()` |
| Sécurité et droits | Spring Security (filtres) | Guards |
| Accès aux données | JPA / Hibernate | Prisma |
| Migrations de schéma | Flyway | Prisma Migrate |
| Tests | JUnit, Mockito | Vitest |
| Analyse statique | Checkstyle, SpotBugs | oxlint |
| Empaquetage | Maven / Gradle | Rspack |

**Le compilateur, et ce qu'il impose.** NestJS repose sur les décorateurs et sur `emitDecoratorMetadata` : c'est en lisant la métadonnée `design:paramtypes` que son conteneur d'injection sait quoi passer à un constructeur. TypeScript 7, réécrit en natif, génère bien cette métadonnée, mais **ne publie plus d'API programmatique de compilation** — or `nest build` appelle `createProgram()` et `program.emit()` avec ses propres transformateurs, et le plugin CLI de Swagger lit l'arbre syntaxique. Le projet reste donc sur **TypeScript 6**, version dont dépend le CLI de NestJS lui-même. TypeScript 7 sera utilisé, s'il y a lieu, comme vérificateur de types en parallèle du build, et le passage complet attendra un constructeur compatible dans le CLI.

## 2. Deux services plutôt que trois

La première version du cahier prévoyait trois services : Identité, Stock et Trésorerie. Le découpage a été ramené à deux — **Identités et organisations**, et **Gestion**, ce dernier contenant les modules Bar, Trésorerie et Répertoire — et le principe a été validé par le chargé de cours le 24/09/2026.

| Argument | Détail |
|---|---|
| Consigne du cours | Au moins deux services indépendants, exécutables sur deux machines distinctes : respectée. |
| Pratique d'entreprise | Pour un projet de cette taille, la recommandation courante est le **monolithe modulaire** (*MonolithFirst*) : on ne découpe en services que lorsqu'un besoin réel apparaît. Trois services pour un développeur seul relèvent de la sur-ingénierie. |
| Cohérence des données | Un achat et une clôture de soirée touchent le stock **et** l'argent. Dans un seul service, c'est une transaction ; dans deux, c'est une cohérence à terme, avec outbox, idempotence et compensations à écrire et à tester. |
| Séparation utile | La séparation conservée est celle qui a une vraie raison d'être : l'identité porte le risque de sécurité et ne partage jamais de transaction avec le métier. |
| Frontières préservées | Les trois modules restent nettement séparés : règles de calcul différentes (4 décimales contre centimes entiers), utilisateurs différents, un schéma PostgreSQL chacun, aucune table partagée, façades publiques explicites, dépendances acycliques vérifiées automatiquement (cahier 9.7). |
| Maîtrise du risque | Premier projet distribué, mené seul, échéance fixe : moins de pièces mobiles, moins de modes de panne. |

**Le point faible à assumer** : le service Gestion est un point de défaillance unique. Si son conteneur tombe, la caisse et la trésorerie tombent ensemble ; avec trois services, la caisse aurait survécu à une panne de la trésorerie.

**Ce qui rend l'extraction réellement possible.** Le choix est réversible dans le sens qui compte : chaque module a son schéma, sa façade publique et aucune jointure vers les autres. Extraire la Trésorerie consiste à remplacer un appel de fonction par un appel réseau derrière une façade qui existe déjà, et à sortir un schéma par `pg_dump`. Ce qui reste à écrire ce jour-là — outbox, idempotence, échecs partiels — est exactement le travail que le monolithe modulaire permet de ne pas faire maintenant.

## 3. Où vit l'ardoise, et pourquoi c'est la décision qui compte

**La décision.** L'ardoise a d'abord été modélisée comme une `CREANCE_DETTE` de la Trésorerie, créée par la vente. Le 27/09/2026, elle a été déplacée dans le module **Bar**. Le nombre de services n'a pas changé ; ce qui a changé est plus important.

**Le raisonnement.** Une vente à l'ardoise est l'opération la plus fréquente de l'application, celle qui se fait à trois heures du matin avec du monde au comptoir. Tant que l'ardoise vivait dans la Trésorerie, cette vente devait écrire dans deux domaines à la fois : c'était la seule transaction transverse **sur le chemin critique de la caisse**, et c'est elle qui rendait toute séparation du stock et de l'argent coûteuse. Or l'ardoise est un objet de comptoir : on la consulte au comptoir, on l'alimente au comptoir, on la règle au comptoir. Elle n'avait pas de raison d'être ailleurs.

**Ce que le déplacement produit.**

| Avant | Après |
|---|---|
| Vente à l'ardoise : écriture dans Bar **et** Trésorerie | Transaction entièrement locale au Bar |
| Annulation, répartition entre plusieurs personnes, passage en perte : idem | Idem, toutes locales |
| La Trésorerie tenait une créance qui ne correspondait à aucun mouvement d'argent | La Trésorerie ne voit que l'argent qui bouge : achat, clôture de soirée, règlement d'ardoise |
| Trois appels transverses, dont un sur le chemin critique | Trois appels transverses, **aucun sur le chemin critique** |

Le résultat n'est pas qu'une simplification technique : il rend le modèle plus juste. Une ardoise n'est pas un mouvement d'argent, c'est un droit à recevoir ; l'argent ne bouge qu'une fois dans sa vie, à son règlement. Le bilan d'une soirée distingue désormais clairement la **recette** (ce qui a été vendu) et l'**argent rentré** (ce qui a été payé) — la distinction même que l'écart de caisse cherche à mesurer.

**Ce que ça coûte.** Le résultat d'un projet suit l'argent réellement rentré : une soirée dont 50 € sont partis à l'ardoise affiche 50 € de moins jusqu'à leur règlement. C'est une comptabilité de caisse, cohérente avec la façon dont une association tient ses comptes, mais c'est un choix à savoir expliquer. La recette totale, ardoises comprises, reste affichée à côté (cahier RG-TRE-25, RG-SOI-20).

**Le Répertoire, conséquence du déplacement.** Séparer les ardoises des créances faisait apparaître un risque : « Thomas » aurait existé deux fois, une fois comme consommateur du bar, une fois comme bénévole de la trésorerie, sans lien entre les deux. Un troisième module, **Répertoire**, tient donc la liste unique des personnes et des magasins, et les deux autres y pointent. C'est ce qui permet de voir, sur un seul écran, les 12 € d'ardoise de Thomas à côté des 30 € de courses que l'association lui doit.

**Pas d'événements asynchrones internes.** Publier un événement à l'intérieur d'un même service ferait courir le risque qu'il soit traité en dehors de la transaction qui l'a produit : un achat pourrait exister sans sa dépense. L'appel direct dans la transaction écarte ce risque, au prix d'un couplage assumé entre modules.

**Dépendance sans cycle.** Bar appelle Trésorerie ; Bar et Trésorerie appellent Répertoire ; rien ne remonte. Ce qui touche plusieurs modules — la clôture d'exercice, la situation nette — passe par un service d'application placé au-dessus. Sans cette règle, les modules se référenceraient mutuellement (`forwardRef` dans NestJS), et l'extraction future deviendrait impossible.

**L'alternative écartée : trois services et un bus de messages.** Une fois l'ardoise déplacée, il devient techniquement possible de séparer Bar et Trésorerie en deux services communiquant par faits publiés (outbox, broker, consommateurs idempotents). Ce n'est pas retenu pour la version 1.0, pour deux raisons. La première est le coût réel : un conteneur de plus à exploiter, une outbox et un relais par émetteur, trois bases au lieu de deux, des projections locales à maintenir, et des tests d'intégration asynchrones — le tout en remplacement de temps consacré aux fonctionnalités, sur un projet mené seul avec une échéance fixe. La seconde est fonctionnelle : le trésorier devrait affecter après coup chaque achat reçu du bar, c'est-à-dire refaire à la main le rapprochement entre deux outils que l'application est précisément censée supprimer (cahier 1.2 et objectif O1).

## 4. Prisma 7, et la propagation de la transaction

**Prisma 7, épinglé.** Prisma 7 est la version stable recommandée en production — 7.10.0 au 01/10/2026. Prisma 8 est toujours en *release candidate* (8.0.0-rc.19) et **sa CLI ne lit pas `schema.prisma` : ni `generate`, ni `migrate dev`, ni `db push`**. Pour un projet dont les migrations versionnées sont un critère d'évaluation, c'est un risque inutile.

**Et l'épinglage n'est pas une précaution théorique.** Les deux paquets de Prisma n'ont pas le même `latest` : `prisma@latest` renvoie la RC de la 8, `@prisma/client@latest` renvoie la 7.10.0. Une installation sans version explicite donne donc une CLI de la 8 en RC avec un client de la 7 — c'est-à-dire une chaîne de migrations cassée, pour une raison difficile à deviner. Les deux paquets sont écrits en dur à `7.10.0` dans `package.json`.

**La propagation de la transaction** est le point technique le plus délicat du projet : un achat de marchandise ou une clôture de soirée écrit dans deux modules, en une seule transaction, alors que l'accès aux données passe par des repositories qui masquent l'ORM.

- Solution retenue : `nestjs-cls` avec son greffon `@nestjs-cls/transactional` et `@nestjs-cls/transactional-adapter-prisma` (version 2). Une méthode `@Transactional()` ouvre la transaction ; les repositories lisent le client courant via `TransactionHost` sans le recevoir en paramètre.
- Compatibilité revérifiée le 01/10/2026 sur les dépendances de pair déclarées : `nestjs-cls` 7.0.1 et `@nestjs-cls/transactional` 4.0.1 acceptent `@nestjs/core >= 10 < 13` (NestJS 12 convient), et `@nestjs-cls/transactional-adapter-prisma` 2.0.1 accepte `prisma` et `@prisma/client` en `> 4 < 9` (Prisma 7 comme 8). **Prisma 8 n'est donc pas bloqué par l'adaptateur** : c'est l'état de sa CLI qui motive le choix de la 7.
- Alternative si cette dépendance devait poser problème : passer explicitement le client de transaction dans chaque signature de repository, ou écrire son propre contexte avec `AsyncLocalStorage` (une cinquantaine de lignes). Plus verbeux, sans dépendance supplémentaire.
- **Ce choix est fait au squelette** : revenir dessus en cours de projet oblige à réécrire la couche d'accès aux données. Un test vérifie qu'un échec côté Trésorerie annule bien l'écriture côté Bar.

## 5. Pourquoi le multi-associations

Le multi-associations coûte cher : seize règles de gestion, un statut de fondateur, un code d'adhésion, et une isolation à vérifier sur chaque requête. Il serait plus rapide de livrer une application mono-association.

Il est pourtant une contrainte de départ, et non une extension future, pour une raison simple : **l'application est destinée à servir d'autres unités scoutes et d'autres cercles étudiants que celui qui en est à l'origine**. Ces associations n'ont ni serveur, ni personne pour administrer une installation. Une application mono-association imposerait un déploiement et une base de données par groupe, donc un travail d'exploitation que personne ne ferait ; elles resteraient sur leur tableur.

Deux conséquences techniques suivent de ce choix, et elles sont les mêmes que celles d'un produit réel :

- L'isolation des données n'est pas une option de configuration mais un invariant vérifié côté serveur, à partir de l'identité portée par le jeton et jamais d'une valeur envoyée par le client (cahier 9.6).
- Le catalogue de produits est **commun et versionné**, séparé des données de chaque association : une nouvelle association est utilisable immédiatement, sans ressaisir cinquante produits courants.

Le revers est assumé : une faille d'isolation exposerait les données de toutes les associations, là où une installation par groupe limiterait les dégâts. C'est pourquoi l'isolation fait l'objet de tests dédiés plutôt que d'une simple relecture.

## 6. Sources

- NestJS v12 — [annonce et contenu de la version](https://trilon.io/blog/nestjs-12-is-coming) · [feuille de route ESM](https://www.infoq.com/news/2026/04/nestjs-12-roadmap-esm/)
- Oxlint — [documentation du linter](https://oxc.rs/docs/guide/usage/linter)
- Prisma — [statut des versions](https://www.prisma.io/docs/prisma-orm/release-status)
- `@nestjs-cls/transactional-adapter-prisma` — [dépendances du paquet](https://github.com/Papooch/nestjs-cls/blob/main/packages/transactional-adapters/transactional-adapter-prisma/package.json) · [support de NestJS 12](https://github.com/Papooch/nestjs-cls/pull/629)
- `@nestjs/swagger` 12 — [prise en charge des schémas Standard Schema](https://newreleases.io/project/github/nestjs/swagger/release/12.0.0)
- Node.js — [calendrier officiel des versions](https://github.com/nodejs/Release/blob/main/schedule.json) · [tableau des fins de support](https://endoflife.date/nodejs)
- TypeScript 7 et NestJS — [ce qui fonctionne et ce qui casse](https://fernforge.github.io/devnotes/nestjs-typescript-7/)
- Versions et dépendances de pair : relevées sur le registre npm (`registry.npmjs.org`) le 01/10/2026.
