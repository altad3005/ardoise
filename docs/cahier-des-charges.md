# Ardoise — Cahier des charges

> UE Projet d'intégration de développement — EAFC Namur-Cadets — 2026-2027
> Auteur : Alex Tadino — Chargé de cours : Yolan Fery
> Version : **1.10** — octobre 2026
> Justifications des choix structurants et versions de l'outillage : `annexe-justifications.md`.
> Architecture à deux services : **Identités et organisations**, et **Gestion**, ce dernier contenant les modules **Bar**, **Trésorerie** et **Répertoire**. Le principe des deux services a été validé par le chargé de cours le 24/09/2026 ; le déplacement de l'ardoise dans le module Bar date du 27/09/2026. Voir 9.2, 9.4 et l'annexe §3.

### Historique des versions

| Version | Date | Changements |
|---|---|---|
| 1.0 | 19/09/2026 | Première version complète, présentée avec trois services. |
| 1.1 | 24/09/2026 | Architecture ramenée à deux services (Identité + Gestion). |
| 1.2 | 24/09/2026 | Validation du chargé de cours ; correction du calcul des espèces, ardoises créées à la vente, dépendance à sens unique, règles de concurrence. |
| 1.3 | 24/09/2026 | Outillage mis à jour : NestJS 12 en ESM, Vitest, oxlint, Node 24 LTS. |
| 1.4 | 25/09/2026 | Tiers unifiés dans la Trésorerie, contrat Identité ↔ Gestion, frontière entre modules vérifiable, Prisma 7 épinglé, validation par Zod. |
| 1.5 | 27/09/2026 | Renvois RG réalignés, formule du résultat par projet corrigée, créances d'ouverture, consigne par compensation, sorties d'espèces, exigences d'accessibilité et de style, JWKS. |
| 1.6 | 27/09/2026 | Maquettes exportées dans `docs/maquettes/`, justification du multi-associations, exercice libre et règle de rattachement, jalons alignés sur la remise du 03/01 et la défense orale. |
| 1.7 | 27/09/2026 | **L'ardoise devient un objet du module Bar** : plus aucune transaction transverse sur le chemin critique de la caisse. Module **Répertoire** pour les tiers partagés. Module Stock renommé **Bar**. Lien Gestion → Identité renforcé (résolution des membres côté serveur). Trois schémas PostgreSQL. |
| 1.8 | 01/10/2026 | Versions et compatibilités revérifiées (10.6) : Node 26 LTS, TypeScript 6 épinglé (la 7 casse `nest build`), Prisma 7.10.0 épinglée sur les deux paquets, Vite 8 / Vitest 5 / React 19 / Tailwind 4. |
| 1.9 | 01/10/2026 | Nommage du code en anglais (10.7) : services, modules, schémas PostgreSQL, routes, rôles et façades. Le document garde les termes métier français. |
| 1.10 | 01/10/2026 | Correction après création du squelette : le modèle NestJS 12 compile avec `tsc`, pas avec Rspack (10.1, 10.6). |

---

## 1. Présentation du projet

### 1.1 Contexte

De nombreuses associations (unités scoutes, cercles étudiants, clubs sportifs, comités des fêtes, maisons de jeunes) tiennent un bar et financent leurs activités par des événements : soirées, brunchs, ventes, tournois. Leur gestion est assurée par des bénévoles, qui se relaient d'une année à l'autre, avec des outils génériques : tableurs, carnets, caisse en espèces.

### 1.2 Problématique

Trois activités y sont suivies séparément : le **stock** (achats, réserve), les **ventes au comptoir** (rarement enregistrées à l'unité) et la **trésorerie** (comptes, caisse, frais avancés, sommes dues).

Cette séparation entraîne des saisies multiples d'une même opération et aucun lien entre les boissons sorties et l'argent encaissé. Quatre questions restent alors sans réponse simple : combien a rapporté cette soirée ? Que vaut le stock aujourd'hui ? Pourquoi la caisse ne tombe-t-elle pas juste ? Qui doit de l'argent à qui ?

### 1.3 Solution proposée

**Ardoise** est une application web multi-associations qui réunit, dans un même outil, la caisse du comptoir, la gestion du stock et la trésorerie par projets. Chaque opération réelle (un ticket d'achat, une vente, un comptage) n'est saisie qu'une seule fois ; ses conséquences sur le stock et sur l'argent sont calculées automatiquement.

### 1.4 Objectifs

- **O1** — Une seule saisie par opération réelle.
- **O2** — Connaître à tout moment le stock théorique de chaque produit et l'écart avec le dernier comptage.
- **O3** — Connaître la recette, le coût et le résultat de chaque soirée et de chaque projet.
- **O4** — Garantir la cohérence des soldes (comptes, stock, créances, dettes) sans contrôle manuel.
- **O5** — Tracer chaque opération : qui, quand, quoi.
- **O6** — Servir plusieurs associations sur la même plateforme, chacune ne voyant que ses propres données. Ce n'est pas une généralisation gratuite : l'application est destinée à être utilisée par d'autres unités scoutes et cercles étudiants que celui qui en est à l'origine, sans qu'ils aient à installer ni héberger quoi que ce soit. Le multi-associations est donc une contrainte de départ, pas une extension future (voir annexe, § 5).

---

## 2. Périmètre

### 2.1 Fonctionnalités couvertes

| Domaine | Contenu |
|---|---|
| Comptes et associations | Création de compte, création d'une association, adhésion par code, membres et rôles |
| Catalogue | Catalogue commun de produits courants, produits propres à chaque association, articles de vente (à l'unité ou au verre), conditionnements d'achat |
| Stock | Achats, reports d'ouverture, ventes, sorties (offert, casse, perte), inventaires, stock théorique, écarts, alertes de réapprovisionnement |
| Caisse et soirées | Ouverture de soirée, saisie des ventes par serveur, ventes à l'ardoise et règlement des ardoises, annulation, clôture avec comptage des espèces |
| Trésorerie | Comptes, projets, mouvements, frais avancés, créances et dettes, consignes, résultats par projet, situation nette |
| Exercices | Clôture d'un exercice et report sur le suivant |

### 2.2 Hors périmètre

- Traitement des paiements électroniques (carte, application de paiement) et enregistrement du moyen de paiement des ventes
- Impression de tickets
- Vérification de l'adresse e-mail à l'inscription
- Changement rapide de serveur sur un appareil partagé (code court)
- Fonctionnement hors ligne de la caisse
- Export comptable et pièces justificatives numérisées
- Import automatique des relevés bancaires
- Comptabilité légale (plan comptable, comptes annuels) et gestion de la TVA
- Facturation des associations utilisatrices
- Application mobile native (l'interface web reste utilisable sur tablette et smartphone)

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Association** | Organisation utilisatrice de la plateforme. Toutes ses données lui sont propres. |
| **Membre** | Utilisateur appartenant à une association, avec un ou plusieurs rôles. |
| **Fondateur** | Membre ayant créé l'association ; statut protégé (RG-ORG-07 à 10, 13). |
| **Exercice** | Période de gestion (généralement une année) au terme de laquelle les soldes sont reportés. |
| **Produit** | Bien acheté et stocké, exprimé dans une unité de stock (bouteille, canette, brique…). |
| **Conditionnement** | Forme sous laquelle un produit est acheté (bac de 24, pack de 6…), convertie en unités de stock. |
| **Article** | Ce qui est vendu au comptoir ; consomme une quantité définie d'un produit (ex. un verre = 1/20 de bouteille). |
| **Mouvement de stock** | Entrée ou sortie de stock d'un produit ; le stock est la somme de ces mouvements. |
| **Sortie** | Mouvement de stock sans vente : offert, casse, perte. |
| **Inventaire** | Comptage physique du stock, qui produit un ajustement égal à l'écart constaté. |
| **Coût moyen pondéré (CMP)** | Coût unitaire d'un produit, recalculé à chaque entrée en stock. |
| **Soirée** | Période d'ouverture d'une caisse, pendant laquelle les ventes sont enregistrées. |
| **Fond de caisse** | Espèces présentes dans la caisse à l'ouverture d'une soirée. |
| **Ardoise** | Consommation servie sans être payée, mise au nom d'une personne qui règlera plus tard. C'est de l'argent **dû à** l'association : une créance pour elle, une dette pour la personne. Elle est tenue au comptoir, par le module Bar, et ne devient un mouvement d'argent qu'à son règlement. |
| **Compte** | Réserve d'argent de l'association : compte bancaire ou caisse en espèces. |
| **Projet** | Axe d'imputation des recettes et dépenses (un événement, une activité, un poste). |
| **Refacturation interne** | Transfert de coût d'un projet vers un autre, sans mouvement d'argent. |
| **Frais avancés** | Dépense payée par un bénévole avec son propre argent, qui crée une dette de l'association envers lui. À ne pas confondre avec l'ardoise, où c'est une personne qui doit à l'association. |
| **Créance / dette** | Somme à recevoir d'un tiers (créance, un actif) / à payer à un tiers (dette, un passif). Le point de vue est toujours celui de l'association. |
| **Tiers** | Personne ou magasin avec qui l'association a des comptes à régler, inscrit une fois dans son **répertoire** et réutilisé partout : consommateur qui a une ardoise, bénévole qui avance des frais, magasin chez qui une consigne est déposée. |
| **Encours des ardoises** | Somme des ardoises non réglées et non passées en perte, à un instant donné. |
| **Consigne** | Montant payé pour des vidanges (bouteilles, casiers), récupérable auprès du magasin. |
| **Situation nette** | Valeur totale de l'association : comptes + stock + ardoises non réglées + créances − dettes. |

---

## 4. Acteurs et rôles

### 4.1 Comptes et associations

- Toute personne peut créer un compte utilisateur.
- Tout utilisateur peut **créer une association** ; il en devient administrateur et fondateur.
- Tout utilisateur peut **rejoindre** une association grâce à son code d'adhésion.
- Un même compte peut être membre de plusieurs associations, avec des rôles différents dans chacune.
- Aucun rôle ne donne accès aux données de toutes les associations.

### 4.2 Rôles au sein d'une association

| Rôle | Mission |
|---|---|
| **Administrateur** | Dispose de tous les autres rôles ; gère en plus les membres, les rôles, le code d'adhésion et le paramétrage de l'association. |
| **Gestionnaire de stock** | Tient le catalogue, encode les achats et les sorties, réalise les inventaires ; ouvre, encaisse et clôture les soirées. |
| **Trésorier** | Tient les comptes, les projets, les mouvements, les créances et les dettes. |
| **Serveur** | Encaisse au comptoir pendant une soirée ouverte. |
| **Lecteur** | Consulte l'ensemble des données de l'association sans pouvoir les modifier. |

Le **fondateur** n'est pas un rôle mais un statut porté par un administrateur.

### 4.3 Matrice des droits

| Fonction | Administrateur | Gestionnaire de stock | Trésorier | Serveur | Lecteur |
|---|:-:|:-:|:-:|:-:|:-:|
| Paramétrer l'association | ✅ | | | | |
| Gérer les membres, les rôles et le code d'adhésion | ✅ | | | | |
| Ouvrir une soirée | ✅ | ✅ | | | |
| Composer la carte d'une soirée et fixer ses prix | ✅ | ✅ | | | |
| Encaisser pendant une soirée ouverte | ✅ | ✅ | | ✅ | |
| Clôturer une soirée | ✅ | ✅ | | | |
| Gérer le catalogue | ✅ | ✅ | | | 👁 |
| Encoder un achat ou une sortie | ✅ | ✅ | | | 👁 |
| Réaliser un inventaire | ✅ | ✅ | | | 👁 |
| Consulter le stock, les écarts et les alertes | ✅ | ✅ | 👁 | | 👁 |
| Consulter le bilan d'une soirée clôturée | ✅ | ✅ | 👁 | | 👁 |
| Gérer comptes, projets et mouvements | ✅ | | ✅ | | 👁 |
| Gérer créances et dettes | ✅ | | ✅ | | 👁 |
| Consulter résultats et situation nette | ✅ | | ✅ | | 👁 |

✅ lecture et écriture · 👁 lecture seule

---

## 5. Règles de gestion

Chaque règle est numérotée pour être référencée dans les user stories, le code et les tests.

### 5.1 Associations, membres et rôles (RG-ORG)

| N° | Règle |
|---|---|
| RG-ORG-01 | Tout utilisateur authentifié peut créer une association. Il en devient administrateur et fondateur. |
| RG-ORG-02 | Un utilisateur peut être membre de plusieurs associations ; ses rôles sont propres à chaque association. |
| RG-ORG-03 | Chaque association possède un code d'adhésion, généré aléatoirement, visible uniquement par ses administrateurs. |
| RG-ORG-04 | Un administrateur peut régénérer le code d'adhésion ; l'ancien code cesse immédiatement d'être valable. |
| RG-ORG-05 | Un utilisateur qui rejoint une association avec un code valide y entre **sans aucun rôle** : il ne voit aucune donnée tant qu'un administrateur ne lui a pas attribué de rôle. |
| RG-ORG-06 | Un administrateur attribue ou retire les rôles Gestionnaire de stock, Trésorier, Serveur et Lecteur, et exclut un membre. |
| RG-ORG-07 | Seul le **fondateur** attribue ou retire le rôle Administrateur. |
| RG-ORG-08 | Le fondateur ne peut ni être exclu, ni perdre le rôle Administrateur, du fait d'un autre administrateur. |
| RG-ORG-09 | Le fondateur peut transférer son statut à un autre administrateur de l'association. |
| RG-ORG-10 | Le fondateur ne peut pas quitter l'association sans avoir transféré son statut. |
| RG-ORG-11 | Une association compte toujours au moins un administrateur : toute opération qui retirerait le dernier est refusée. |
| RG-ORG-12 | Tout membre peut quitter l'association de lui-même, à l'exception du fondateur (RG-ORG-10). |
| RG-ORG-13 | Seul le fondateur peut supprimer l'association. La suppression exige une confirmation explicite et efface définitivement toutes ses données, dans les deux services (section 9.4). |
| RG-ORG-14 | Les droits d'un membre sont l'union des droits de ses rôles ; le rôle Administrateur inclut tous les autres. |
| RG-ORG-15 | Un utilisateur n'accède qu'aux données des associations dont il est membre. L'association concernée par une requête est vérifiée côté serveur à partir de l'identité de l'utilisateur, jamais sur la seule foi d'une valeur fournie par le client. |
| RG-ORG-16 | Chaque opération est enregistrée avec son auteur et sa date. |

### 5.2 Répertoire des tiers (RG-REP)

| N° | Règle |
|---|---|
| RG-REP-01 | Une association tient un **répertoire** unique de **tiers** : les personnes et les magasins avec lesquels elle a des comptes à régler. Toute ardoise, créance, dette ou référence de magasin désigne un tiers de ce répertoire ; aucun nom n'est saisi librement sur une opération. |
| RG-REP-02 | Un tiers est de type **personne** ou **magasin**. |
| RG-REP-03 | Un tiers créé à partir d'un membre conserve son identifiant d'utilisateur et une copie de son nom au moment de la création ; un tiers peut aussi être créé à partir d'un nom saisi, pour une personne ou un magasin sans compte sur la plateforme. |
| RG-REP-04 | Avant de créer un tiers, l'application recherche les tiers existants et propose les **noms approchants**, pour éviter d'en créer un second pour la même personne. La fusion de deux tiers n'est pas prévue dans la version 1.0. |
| RG-REP-05 | Un même tiers peut porter **en même temps** des ardoises, tenues par le module Bar, et des créances ou dettes, tenues par la trésorerie : un bénévole qui a avancé des courses et qui a aussi une ardoise. L'écran « Qui doit quoi » réunit les deux pour chaque tiers, et c'est le répertoire partagé qui rend ce rapprochement possible. |
| RG-REP-06 | Un tiers ayant déjà servi n'est jamais supprimé, seulement désactivé. |
| RG-REP-07 | Le répertoire est propre à l'association : un tiers n'est jamais visible d'une autre association, même s'il s'agit de la même personne. |

### 5.3 Catalogue (RG-CAT)

| N° | Règle |
|---|---|
| RG-CAT-01 | La plateforme fournit un **catalogue commun** de produits courants (bières, softs, alcools, vins), disponible pour toutes les associations. |
| RG-CAT-02 | Le catalogue commun est livré et maintenu avec l'application (données d'initialisation versionnées) ; aucune association ne peut le modifier. |
| RG-CAT-03 | Une association peut créer ses propres produits, visibles uniquement par elle. |
| RG-CAT-04 | Une association choisit les produits qu'elle utilise, communs ou propres. Seuls ceux-ci apparaissent dans ses achats, son stock et ses inventaires. |
| RG-CAT-05 | L'activation ou la création d'un produit crée automatiquement l'article de vente correspondant, d'une unité de stock ; il ne reste qu'à fixer son prix. Cet article peut ensuite être modifié, désactivé ou complété par d'autres articles du même produit. |
| RG-CAT-06 | Le stock, le coût, le seuil de réapprovisionnement et les prix de vente sont toujours propres à l'association, y compris pour un produit du catalogue commun. |
| RG-CAT-07 | Un produit a une **unité de stock** et un ou plusieurs **conditionnements d'achat** exprimés dans cette unité (ex. bac de 24, pack de 6). |
| RG-CAT-08 | Un article consomme une quantité d'**un seul** produit, exprimée en unité de stock, éventuellement fractionnaire (ex. « Verre de pastis » = 1/20 de bouteille). |
| RG-CAT-09 | Un même produit peut alimenter plusieurs articles (ex. « Verre de vin » et « Bouteille de vin »). |
| RG-CAT-10 | Un article a un **prix de vente de base**, qui peut être remplacé par un prix spécifique pour une soirée donnée. |
| RG-CAT-11 | Un produit ou un article ayant déjà servi n'est jamais supprimé, seulement désactivé. |
| RG-CAT-12 | Un article peut être **sans stock** : il ne consomme aucun produit et ne génère aucun mouvement de stock (entrée de soirée, ticket de brunch, place d'activité, participation). Sa vente est une recette au même titre qu'une autre. |
| RG-CAT-13 | Chaque association compose la **carte de sa caisse** : la liste des articles affichés à l'écran de vente, dans l'ordre choisi. Les autres articles restent accessibles par une recherche, sans encombrer l'écran. |

### 5.4 Stock (RG-STK)

| N° | Règle |
|---|---|
| RG-STK-01 | Le stock d'un produit n'est jamais saisi directement : il est la **somme de ses mouvements**. |
| RG-STK-02 | Types de mouvement : report d'ouverture, achat, vente, sortie (offert, casse, perte), ajustement d'inventaire. |
| RG-STK-03 | Un mouvement enregistré n'est ni modifié ni supprimé ; une erreur se corrige par un mouvement inverse lié au mouvement corrigé. |
| RG-STK-04 | Un achat s'encode par ticket : date, magasin, référence du ticket, mode de règlement (compte ou frais avancés), et une ligne par produit (conditionnement, nombre de conditionnements, montant payé). La quantité en unités est calculée. |
| RG-STK-05 | La consigne d'un ticket est encodée séparément du montant des produits ; elle n'entre ni dans le stock ni dans son coût. |
| RG-STK-06 | Le coût unitaire d'un produit est le **coût moyen pondéré**, recalculé à chaque entrée : (stock × coût actuel + quantité entrée × prix unitaire d'entrée) ÷ (stock + quantité entrée). Il est conservé en décimal exact à 4 décimales (RG-TRE-29), jamais arrondi au centime entre deux calculs. |
| RG-STK-07 | Toute sortie (vente, offert, casse, perte, ajustement négatif) est valorisée au coût moyen pondéré du produit au moment de la sortie. |
| RG-STK-08 | Si le stock d'un produit est nul ou négatif au moment d'une entrée, la formule de RG-STK-06 n'est pas applicable : le coût moyen devient simplement le prix unitaire de l'entrée. |
| RG-STK-09 | Le stock peut être fractionnaire (bouteille entamée) ; l'inventaire accepte des quantités décimales. |
| RG-STK-10 | Une vente n'est **jamais bloquée** par un stock théorique insuffisant. Un stock négatif est signalé au gestionnaire de stock. |
| RG-STK-11 | Un inventaire enregistre la quantité réellement comptée de chaque produit ; l'application crée un ajustement égal à (quantité comptée − stock théorique) et conserve l'écart pour analyse. |
| RG-STK-12 | Un produit non compté lors d'un inventaire n'est pas ajusté (inventaire partiel autorisé). |
| RG-STK-13 | Un inventaire ne peut pas être réalisé tant qu'une soirée est ouverte : les ventes en cours fausseraient le comptage. |
| RG-STK-14 | Une association qui démarre saisit un **inventaire d'ouverture** : quantité et coût unitaire de chaque produit déjà en cave. Il est enregistré en mouvements de report et ne constitue pas une dépense. |
| RG-STK-15 | Un report d'ouverture **sans coût unitaire est refusé**. Les mouvements étant immuables et le coût moyen recalculé à chaque entrée, un report à zéro fausserait durablement le coût du produit. Si le prix d'achat réel est inconnu, une estimation est saisie et signalée comme telle dans la note du mouvement. |
| RG-STK-16 | Une sortie peut être encodée pendant une soirée depuis la caisse, ou hors soirée par un gestionnaire de stock. Le motif est obligatoire. |
| RG-STK-17 | Une alerte de réapprovisionnement est levée lorsque le stock théorique d'un produit passe sous son seuil. |
| RG-STK-18 | À l'ouverture d'un exercice, le stock restant est repris par un mouvement de report, valorisé au coût moyen pondéré de clôture. Un report n'est pas une dépense de l'exercice. |

### 5.5 Soirées et caisse (RG-SOI)

| N° | Règle |
|---|---|
| RG-SOI-01 | Toute vente a lieu dans une **soirée ouverte**. Une soirée a un nom, une date et, facultativement, un projet. |
| RG-SOI-02 | Une soirée peut être créée et ouverte en quelques secondes, avec des valeurs par défaut (nom, date, projet, compte caisse, carte et prix préremplis). |
| RG-SOI-03 | Une soirée sans projet est imputée au **projet par défaut** de l'association. |
| RG-SOI-04 | Seuls un gestionnaire de stock ou un administrateur ouvrent une soirée. L'ouverture comprend **obligatoirement** une étape de fixation des prix : l'application présente la carte avec les prix de base de chaque article, que l'ouvreur confirme ou modifie. Les prix ainsi fixés sont ceux de la soirée. Tout article vendable pendant la soirée a donc un prix explicitement fixé, à l'ouverture ou lors de son ajout (RG-SOI-13). |
| RG-SOI-05 | Cette étape est préremplie : confirmer sans rien changer suffit, ce qui garde l'ouverture d'un bar ordinaire quasi immédiate (RG-SOI-02). |
| RG-SOI-06 | Les prix et la composition de la carte de la soirée restent modifiables tant que la soirée est ouverte, par un gestionnaire de stock ou un administrateur uniquement. Un serveur ne peut ni ouvrir une soirée, ni choisir les articles, ni fixer un prix : il encaisse. |
| RG-SOI-07 | Le prix appliqué à une vente est figé au moment de la vente : modifier un prix en cours de soirée ne change aucune vente déjà validée. |
| RG-SOI-08 | À l'ouverture, le **compte caisse** qui recevra les espèces est choisi (celui par défaut est présélectionné) et le **fond de caisse** est saisi. |
| RG-SOI-09 | Plusieurs serveurs peuvent encaisser simultanément sur une même soirée, depuis des appareils différents. Plusieurs soirées peuvent être ouvertes en même temps, à condition que **chacune utilise un compte caisse différent** : deux soirées ouvertes sur la même caisse rendraient les deux comptages et les deux écarts faux. |
| RG-SOI-10 | L'application signale toute soirée ouverte depuis plus de 24 heures et demande confirmation avant d'en ouvrir une nouvelle. Aucune soirée n'est jamais clôturée automatiquement : une clôture suppose un comptage des espèces par une personne. |
| RG-SOI-11 | Une vente est composée dans une **commande en cours**, visible par le serveur (articles, quantités, total), puis validée en une fois. Une commande non validée n'a aucun effet. |
| RG-SOI-12 | L'écran de vente ne propose que les articles de la carte de la soirée, chacun avec le prix fixé pour cette soirée (RG-SOI-04). Un article absent de la carte ne peut pas être vendu tant qu'il n'y a pas été ajouté. |
| RG-SOI-13 | Un gestionnaire de stock ou un administrateur peut **ajouter un article à la carte en cours de soirée** ; il en fixe alors le prix, prérempli avec le prix de base de l'article. Un serveur ne peut pas procéder à cet ajout. |
| RG-SOI-14 | Le serveur ne voit que sa commande en cours et sa dernière vente validée. Il n'a accès ni au total de la soirée, ni aux ventes des autres serveurs. |
| RG-SOI-15 | Chaque vente enregistre le serveur qui l'a validée, l'heure, les articles, les quantités, le prix appliqué et son **statut de paiement** (payée ou à l'ardoise). |
| RG-SOI-16 | Le moyen de paiement d'une vente payée (espèces, virement, autre) n'est pas enregistré ; seule la distinction entre vente payée et vente à l'ardoise l'est. |
| RG-SOI-17 | Un serveur peut annuler **sa propre dernière vente** tant que la soirée est ouverte. Un gestionnaire de stock peut annuler n'importe quelle vente d'une soirée ouverte. Une vente annulée reste visible comme telle. |
| RG-SOI-18 | Depuis la caisse, un serveur peut encoder une sortie (offert, casse, perte), avec motif obligatoire. |
| RG-SOI-19 | Seul un gestionnaire de stock clôture la soirée, en saisissant les espèces comptées. Aucune vente ni annulation n'est possible ensuite. |
| RG-SOI-20 | À la clôture sont calculés : la **recette totale** (toutes les ventes, payées ou à l'ardoise), le **total mis à l'ardoise**, les **espèces provenant des ventes** (espèces comptées − fond de caisse − règlements d'ardoises encaissés en espèces + sorties d'espèces encodées), le montant **attendu par virement** (ventes payées − espèces provenant des ventes) et le **coût du stock consommé** (ventes et sorties de la soirée). |
| RG-SOI-21 | Une **sortie d'espèces** de la caisse pendant la soirée (payer une livraison, rembourser quelqu'un) est encodée comme telle, avec son motif, par un gestionnaire de stock. Elle devient une dépense sur le compte caisse en trésorerie et entre dans le calcul de RG-SOI-20. Sortir de l'argent sans l'encoder fausse l'écart de caisse. |
| RG-SOI-22 | Le trésorier rattache ensuite à la soirée les virements reçus. **Écart de caisse** = ventes payées − espèces provenant des ventes − virements rattachés. Ni les ventes à l'ardoise, ni les règlements d'ardoises encaissés ce soir-là n'entrent dans ce calcul. |
| RG-SOI-23 | Une soirée clôturée n'est plus modifiable. Une erreur constatée après clôture se corrige par un mouvement de stock et un mouvement de trésorerie. |

### 5.6 Ardoises (RG-ARD)

| N° | Règle |
|---|---|
| RG-ARD-01 | Toute vente est payée par défaut : le serveur valide la commande sans saisir aucun nom. Un bouton distinct permet de la mettre **à l'ardoise**, et c'est seulement dans ce cas qu'une personne doit être désignée. |
| RG-ARD-02 | Ce bouton est disponible dans toute soirée, qu'elle soit rattachée à un projet ou créée à la volée. |
| RG-ARD-03 | Une vente à l'ardoise produit exactement les mêmes mouvements de stock qu'une vente payée : la marchandise est sortie et son coût est imputé à la soirée. |
| RG-ARD-04 | La personne est choisie parmi les **tiers du répertoire** de l'association (RG-REP-01) : jamais un nom retapé. Si elle n'y figure pas encore, elle y est ajoutée depuis l'écran de vente, avec le contrôle des noms approchants (RG-REP-04). |
| RG-ARD-05 | Une vente à l'ardoise peut être **répartie entre plusieurs personnes** : le serveur en désigne une ou plusieurs, et le montant est divisé entre elles. |
| RG-ARD-06 | Par défaut, le montant est réparti à parts égales ; le serveur peut ajuster chaque part. La somme des parts doit égaler le montant de la vente, au centime près : les centimes restants d'une division inexacte sont attribués à la première part. |
| RG-ARD-07 | Chaque part crée une **ardoise** distincte, au nom de la personne concernée, rattachée à la vente, à la soirée et à son projet. Chacune se règle indépendamment des autres. |
| RG-ARD-08 | L'ardoise est un objet du **module Bar** : elle est créée au moment de la vente, dans la même transaction que la vente et ses mouvements de stock, sans qu'aucun autre module soit appelé. **Aucune écriture de trésorerie n'a lieu à la vente** : personne n'a payé, aucun compte n'a bougé. L'ardoise est l'unique source du solde d'une personne ; aucun compteur n'est tenu ailleurs. |
| RG-ARD-09 | Les ardoises d'une même personne s'additionnent : l'application présente à tout moment le solde dû par chaque personne. |
| RG-ARD-10 | L'annulation d'une vente à l'ardoise (RG-SOI-17) annule toutes les ardoises qu'elle a créées, dans la même transaction que l'annulation — une transaction entièrement locale au module Bar. Elle est refusée dès qu'une de ces ardoises a reçu un règlement, même partiel ; la correction passe alors par un remboursement. |
| RG-ARD-11 | Une association peut définir un plafond d'alerte par personne ; au-delà, le serveur est averti. Aucun plafond n'est défini par défaut, et la vente n'est jamais bloquée. |
| RG-ARD-12 | Le règlement est le **seul moment de la vie d'une ardoise où l'argent bouge**. Il peut être encaissé depuis la caisse pendant une soirée : le module Bar solde l'ardoise et la trésorerie enregistre une **rentrée** sur le compte encaisseur, imputée au projet de la soirée d'origine, dans la même transaction (section 9.4). Ce n'est ni une vente, ni une recette nouvelle du projet. |
| RG-ARD-13 | Contrairement à une vente (RG-SOI-16), un règlement d'ardoise encaissé au bar précise **espèces ou virement**. Seuls les règlements en espèces entrent dans le comptage de la caisse ; un règlement par virement est enregistré sur le compte bancaire et n'intervient pas dans l'écart de caisse. |
| RG-ARD-14 | Lorsqu'une personne a plusieurs ardoises et règle un montant qui ne les couvre pas toutes, le montant est imputé **de la plus ancienne à la plus récente**, sauf si l'encaisseur désigne explicitement une ardoise. |
| RG-ARD-15 | Le règlement d'une ardoise peut aussi être encodé hors soirée, par un trésorier, un gestionnaire de stock ou un administrateur, sur n'importe quel compte, depuis l'écran des ardoises. Il produit la même rentrée qu'un règlement encaissé au bar. |
| RG-ARD-16 | Au moment de mettre une consommation à l'ardoise, le serveur voit le solde déjà dû par la personne choisie. Il n'a pas accès à la liste complète des ardoises ; le gestionnaire de stock et le trésorier, oui. |
| RG-ARD-17 | Chaque vente à l'ardoise conserve le nom du serveur qui l'a encodée. |
| RG-ARD-18 | Une ardoise jugée irrécouvrable peut être **passée en perte** par un trésorier ou un administrateur, sans mouvement d'argent et **sans aucune écriture de trésorerie** : l'ardoise n'ayant jamais été comptée comme une rentrée, le résultat du projet est déjà juste ; seul l'encours des ardoises diminue, et avec lui la situation nette. La vente et son stock restent inchangés. |
| RG-ARD-19 | Le passage en perte est tracé (auteur, date, motif) et l'ardoise reste consultable avec ce statut ; elle n'est jamais supprimée. |
| RG-ARD-20 | L'**encours des ardoises** — somme des ardoises non soldées et non passées en perte — est tenu par le module Bar. La trésorerie le lit pour établir la situation nette (RG-TRE-26) ; elle n'en conserve aucune copie. |

### 5.7 Trésorerie (RG-TRE)

**Comptes et projets**

| N° | Règle |
|---|---|
| RG-TRE-01 | Une association déclare un ou plusieurs **comptes**, de type *banque* ou *caisse*, chacun avec un solde d'ouverture. |
| RG-TRE-02 | Une association qui démarre saisit aussi ses **créances et dettes d'ouverture** : sommes déjà dues ou à recevoir avant la mise en service. Elles portent un type *report* : elles entrent dans la situation nette (RG-TRE-26) mais **ne comptent ni comme rentrée ni comme dépense d'un projet** (RG-TRE-25). |
| RG-TRE-03 | Le solde d'un compte n'est jamais saisi : il vaut solde d'ouverture + entrées − sorties. |
| RG-TRE-04 | Une association déclare ses **projets**, chacun rattaché à une **catégorie de projet** qu'elle définit. |
| RG-TRE-05 | Le paramétrage désigne deux projets particuliers : le **projet par défaut** des soirées et le **projet stock**, qui porte les achats de marchandise. |

**Mouvements**

| N° | Règle |
|---|---|
| RG-TRE-06 | Types de mouvement : **dépense**, **rentrée**, **transfert** entre deux comptes, **refacturation interne** entre deux projets, **règlement** d'une créance ou d'une dette, **abandon** d'une créance ou d'une dette. |
| RG-TRE-07 | Un mouvement porte une date, un libellé, un montant strictement positif, un auteur et, facultativement, une référence de pièce. |
| RG-TRE-08 | Une dépense ou une rentrée est imputée à un projet et à un compte ; une dépense peut aussi être payée en **frais avancés** par un bénévole. |
| RG-TRE-09 | Un transfert modifie deux comptes et aucun projet. Une refacturation interne modifie deux projets et aucun compte. |
| RG-TRE-10 | Un mouvement enregistré n'est ni modifié ni supprimé ; une erreur se corrige par une contre-passation liée au mouvement corrigé. |
| RG-TRE-11 | Les achats de **marchandise destinée à la vente** (produits du catalogue) sont encodés **uniquement dans le stock** ; la trésorerie en reçoit les conséquences automatiquement et les impute au projet stock. |
| RG-TRE-12 | Tout autre achat (matériel, décoration, location, nourriture d'un événement, frais divers) est encodé **directement en trésorerie**, comme une dépense imputée au projet concerné. Il ne passe pas par le stock. |
| RG-TRE-13 | Un ticket mêlant marchandise et autres achats est scindé : la partie marchandise est encodée dans le stock, le reste en trésorerie, avec la même référence de pièce. |
| RG-TRE-14 | À la clôture d'une soirée, la trésorerie enregistre une **rentrée** des espèces provenant des ventes, sur le compte caisse, imputée au projet de la soirée. Les règlements d'ardoises encaissés pendant la soirée ont déjà été enregistrés un par un au moment de l'encaissement (RG-ARD-12) : la clôture ne les réenregistre pas, sinon l'argent d'une ardoise serait compté deux fois. |
| RG-TRE-15 | La clôture enregistre en outre une **refacturation interne** du coût du stock consommé, du projet stock vers le projet de la soirée. Les ardoises ne donnent lieu à aucune écriture de trésorerie, ni à la vente ni à la clôture : l'argent ne bouge qu'à leur règlement (RG-ARD-12). |

**Créances, dettes, frais avancés et consignes**

| N° | Règle |
|---|---|
| RG-TRE-16 | Une dépense payée en **frais avancés** ne modifie aucun compte ; elle crée une **dette** envers le **tiers** qui a avancé l'argent. |
| RG-TRE-17 | Une créance (à recevoir) ou une dette (à payer) désigne un **tiers**, un objet, un montant, une date attendue facultative et le projet d'origine. Les créances et dettes tenues ici sont celles qui ne viennent pas du comptoir : frais avancés par un bénévole, consignes chez un magasin, sommes dues ou à recevoir hors soirée, et reports d'ouverture. Les **ardoises** sont tenues par le module Bar (RG-ARD-08). |
| RG-TRE-18 | Le tiers d'une créance ou d'une dette vient du **répertoire** de l'association (RG-REP-01), partagé avec le module Bar : la trésorerie ne tient pas sa propre liste de personnes et de magasins. |
| RG-TRE-19 | Une créance ou une dette se solde par un ou plusieurs **règlements**, chacun lié à un compte. Elle est soldée lorsque la somme des règlements atteint son montant. Elle n'est jamais supprimée. |
| RG-TRE-20 | Le règlement d'une créance ou d'une dette tenue ici (frais avancés, consigne, créance hors soirée) n'est ni une dépense ni une rentrée de projet : la dépense ou la rentrée a déjà été comptée lors de l'opération d'origine. Le règlement d'une **ardoise**, lui, est bien une rentrée (RG-ARD-12), parce que la vente à l'ardoise n'en avait jamais produit. |
| RG-TRE-21 | La consigne d'un ticket d'achat crée une **créance** envers le magasin ; la récupération des vidanges la solde. |
| RG-TRE-22 | Une créance de consigne peut être soldée de deux façons : par un **règlement** sur un compte (le magasin rembourse), ou par **compensation sur un achat** — le cas courant, où les vidanges sont déduites du ticket suivant. La compensation solde la créance et diminue d'autant le montant réglé de l'achat, sans mouvement d'argent supplémentaire. |
| RG-TRE-23 | Une créance jugée irrécouvrable, ou une dette que le créancier abandonne, peut être soldée par un **abandon**, qui ne touche aucun compte : l'abandon d'une créance est une perte pour le projet d'origine, l'abandon d'une dette un gain. |
| RG-TRE-24 | Un virement reçu en paiement d'une soirée est une rentrée sur un compte bancaire, rattachée à la soirée et imputée à son projet. |

**Résultats et contrôles**

| N° | Règle |
|---|---|
| RG-TRE-25 | **Résultat d'un projet** = rentrées − dépenses − coûts refacturés **reçus** + coûts refacturés **transférés**. Exemple : une soirée qui encaisse 300 € et à laquelle le projet stock refacture 120 € de marchandise consommée affiche 300 − 120 = **180 €** ; le projet stock, qui a dépensé 405 € d'achats et transféré 120 €, affiche −405 + 120 = **−285 €**. Le résultat est aussi présenté hors refacturations internes. **Une vente à l'ardoise n'entre dans ce résultat qu'au fur et à mesure de ses règlements** (RG-ARD-12) : le résultat suit l'argent réellement rentré, et le bilan de la soirée (RG-SOI-20) montre à côté la recette totale, ardoises comprises. |
| RG-TRE-26 | **Situation nette** = Σ soldes des comptes + valeur du stock + encours des ardoises (RG-ARD-20) + créances non soldées − dettes non soldées. La valeur du stock et l'encours des ardoises sont lus auprès du module Bar (section 9.4). |
| RG-TRE-27 | **Invariant** : un achat de stock, un transfert entre comptes ou un règlement ne modifie jamais la situation nette. Le règlement d'une ardoise ne l'entame pas non plus : le compte encaisseur augmente exactement de ce dont l'encours des ardoises diminue. |
| RG-TRE-28 | Les **montants d'argent** (prix, dépenses, recettes, soldes, créances, dettes) sont stockés et calculés en **centimes entiers**. Aucun calcul monétaire n'utilise de nombre à virgule flottante. |
| RG-TRE-29 | Les **coûts unitaires** (coût moyen pondéré d'un produit, coût d'un article au verre) ne sont pas des montants d'argent mais des taux de calcul : ils sont stockés en décimal exact avec **4 décimales**. |
| RG-TRE-30 | L'arrondi au centime n'intervient qu'au moment d'écrire un montant d'argent ou de l'afficher. On arrondit toujours **la somme**, jamais chaque ligne : le coût du stock consommé d'une soirée est la somme exacte des coûts de ses sorties, arrondie une seule fois. |

### 5.8 Exercices (RG-EXE)

| N° | Règle |
|---|---|
| RG-EXE-01 | Les données d'une association sont organisées par **exercice**, dont elle choisit librement les dates de début et de fin. Aucun calendrier n'est imposé : ni l'année civile, ni l'année scolaire, ni l'année scoute. Un exercice n'est pas tenu de durer douze mois. |
| RG-EXE-02 | La clôture d'un exercice reporte sur le suivant les soldes des comptes, le stock, les créances et dettes non soldées et les **ardoises non soldées**. |
| RG-EXE-03 | Avant de clôturer, l'application liste les créances et dettes non soldées et les ardoises non soldées, et propose de les passer en perte (RG-ARD-18, RG-TRE-23). Le passage en perte n'est jamais automatique. |
| RG-EXE-04 | Un exercice clôturé est consultable mais n'est plus modifiable. |
| RG-EXE-05 | La clôture d'un exercice est refusée tant qu'une soirée reste ouverte, comme l'est un inventaire (RG-STK-13). |
| RG-EXE-06 | Les mouvements de stock portent l'exercice auquel ils se rattachent. La clôture d'un exercice est pilotée par un **service d'application** qui appelle successivement le module Trésorerie (clôture des comptes) puis le module Bar (mouvements de report, RG-STK-18), dans une seule transaction. Aucun module n'appelle l'autre pour cette opération (section 9.4). La clôture reporte aussi les **ardoises non soldées** sur l'exercice suivant (RG-EXE-02), après la proposition de passage en perte (RG-EXE-03). |
| RG-EXE-07 | Un mouvement, une soirée ou un achat se rattache à l'exercice **dont la période contient sa date**. Une saisie dont la date ne tombe dans aucun exercice ouvert est refusée : l'exercice doit être créé d'abord. |

---


## 6. User stories

Les user stories constituent le backlog du projet. Chacune référence les règles de gestion qu'elle met en œuvre. Priorités (méthode MoSCoW) : **M** = indispensable à la version 1.0, **S** = importante, **C** = souhaitable si le temps le permet.

### 6.1 Comptes et associations

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-01 | visiteur | créer un compte avec mon adresse e-mail et un mot de passe | utiliser la plateforme | — | M |
| US-02 | utilisateur | me connecter et me déconnecter | accéder à mes associations en sécurité | — | M |
| US-03 | utilisateur | réinitialiser mon mot de passe oublié par e-mail | récupérer l'accès à mon compte | — | M |
| US-04 | utilisateur | créer une association | gérer son bar et sa trésorerie | ORG-01 | M |
| US-05 | utilisateur | rejoindre une association avec un code d'adhésion | y être ajouté sans intervention technique | ORG-03, 05 | M |
| US-06 | utilisateur membre de plusieurs associations | choisir l'association sur laquelle je travaille | ne voir que ses données | ORG-02, 15 | M |
| US-07 | administrateur | voir, régénérer et partager le code d'adhésion | contrôler qui peut entrer | ORG-03, 04 | M |
| US-08 | administrateur | attribuer et retirer des rôles aux membres, exclure un membre | donner à chacun les bons accès | ORG-06 à 08, 11, 14 | M |
| US-09 | fondateur | transférer mon statut à un autre administrateur | pouvoir quitter l'association sans la bloquer | ORG-09, 10 | S |
| US-10 | fondateur | supprimer l'association | fermer définitivement un espace devenu inutile, dans les deux services | ORG-13 | M |
| US-11 | administrateur | paramétrer l'association (catégories de projets, projet par défaut, projet stock) | adapter l'outil à son fonctionnement | TRE-04, 05 | M |

### 6.2 Catalogue

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-12 | gestionnaire de stock | activer des produits du catalogue commun | ne pas recréer les produits courants | CAT-01, 04, 05 | M |
| US-13 | gestionnaire de stock | créer un produit propre à mon association | vendre des produits absents du catalogue commun | CAT-03, 05 | M |
| US-14 | gestionnaire de stock | définir les conditionnements d'achat d'un produit | encoder un achat dans l'unité du ticket | CAT-07 | M |
| US-15 | gestionnaire de stock | créer des articles de vente et leur prix de base | composer l'écran de la caisse | CAT-08, 09, 10 | M |
| US-16 | gestionnaire de stock | définir un prix spécifique pour une soirée | appliquer un tarif d'événement | CAT-10 | S |
| US-17 | gestionnaire de stock | créer un article sans stock (entrée, ticket, participation) | encaisser une recette qui ne consomme aucune marchandise | CAT-12 | M |
| US-18 | gestionnaire de stock | composer la carte de la caisse et son ordre d'affichage | garder un écran de vente simple et rapide | CAT-13 ; SOI-12 | M |
| US-19 | gestionnaire de stock | désactiver un produit ou un article | le retirer sans perdre l'historique | CAT-11 | S |

### 6.3 Stock

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-20 | gestionnaire de stock | encoder un ticket d'achat (produits, conditionnements, montant, consigne, mode de règlement) | mettre à jour le stock et la trésorerie en une seule saisie | STK-04, 05, 06 ; TRE-11, 13, 21 | M |
| US-21 | gestionnaire de stock | consulter le stock théorique, la valeur et le coût moyen de chaque produit | savoir ce qu'il y a en réserve | STK-01, 06 | M |
| US-22 | gestionnaire de stock | encoder une sortie hors soirée (offert, casse, perte) | garder un stock juste | STK-16 | M |
| US-23 | gestionnaire de stock | réaliser un inventaire, complet ou partiel | corriger le stock et mesurer les écarts | STK-11, 12, 13 | M |
| US-24 | gestionnaire de stock | saisir l'inventaire d'ouverture de l'association (quantités et coûts) | démarrer avec le stock déjà présent en cave | STK-14, 15 | M |
| US-25 | gestionnaire de stock | consulter l'historique des mouvements et des écarts d'un produit | comprendre d'où viennent les écarts | STK-03, 11 | S |
| US-26 | gestionnaire de stock | recevoir une alerte quand un produit passe sous son seuil | savoir quoi racheter | STK-17 | S |
| US-27 | gestionnaire de stock | corriger un achat erroné | rectifier sans effacer l'historique | STK-03 ; TRE-10 | S |

### 6.4 Soirées et caisse

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-28 | gestionnaire de stock | ouvrir une soirée (projet, compte caisse, fond de caisse) en confirmant la carte et les prix | démarrer le service rapidement, avec des prix explicitement fixés | SOI-01 à 08 | M |
| US-29 | serveur | composer une commande en touchant les articles et voir le total en cours | encaisser vite et sans erreur | SOI-11 | M |
| US-30 | serveur | valider la commande | l'enregistrer comme vente | SOI-15 ; STK-10 | M |
| US-31 | serveur | annuler ma dernière vente | corriger une erreur de saisie | SOI-17 | M |
| US-32 | serveur | encoder un offert, une casse ou une perte depuis la caisse | garder le stock juste pendant le service | SOI-18 | S |
| US-33 | gestionnaire de stock | annuler n'importe quelle vente d'une soirée ouverte | corriger l'erreur d'un serveur | SOI-17 | S |
| US-34 | gestionnaire de stock | clôturer la soirée en saisissant les espèces comptées | connaître la recette et la transmettre à la trésorerie | SOI-19, 20 ; TRE-14, 15 | M |
| US-35 | gestionnaire de stock ou trésorier | consulter le bilan d'une soirée (ventes par article, recette, ardoises, espèces, virements attendus, coût, écart) | savoir ce que la soirée a rapporté | SOI-20 à 22 | M |
| US-36 | serveur | mettre une consommation à l'ardoise au nom d'une personne | servir sans encaisser tout en gardant une trace de ce qui est dû | ARD-01 à 04, 16 | M |
| US-37 | serveur | répartir une ardoise entre plusieurs personnes | partager un bac ou une tournée sans calculer à la main | ARD-05 à 07 | M |
| US-38 | serveur | voir le solde déjà dû par la personne que je désigne, et être averti au-delà du plafond | prévenir la personne, sans accéder à l'ensemble des ardoises | ARD-09, 11, 16 | M |
| US-39 | serveur | encaisser le règlement d'une ardoise depuis la caisse | solder la dette d'une personne sans fausser le comptage | ARD-12 à 14 | M |

**Critères d'acceptation — US-30 (valider une vente)**
- La vente est refusée si la soirée n'est pas ouverte ou n'appartient pas à l'association de l'utilisateur.
- Le prix appliqué est le prix de soirée s'il existe, sinon le prix de base.
- Le stock de chaque produit consommé diminue de (quantité × quantité consommée par l'article).
- La vente est acceptée même si le stock théorique devient négatif ; le produit est alors signalé.
- Le serveur, l'heure, les prix appliqués et le statut de paiement sont enregistrés.
- Si la vente est mise à l'ardoise, une personne doit être désignée, et une créance du montant de la vente est créée dans la même opération.

**Critères d'acceptation — US-34 (clôturer une soirée)**
- Seul un gestionnaire de stock ou un administrateur peut clôturer.
- Après clôture, toute tentative de vente ou d'annulation est refusée.
- Recette théorique, espèces encaissées, montant attendu par virement et coût du stock consommé sont calculés et figés.
- Les écritures de trésorerie qui en découlent (rentrée des espèces provenant des ventes, refacturation du coût du stock) sont faites dans la même transaction que la clôture. Les créances d'ardoises, elles, ont été créées à la vente.

### 6.5 Trésorerie

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-40 | trésorier | déclarer les comptes (banque, caisse), leur solde d'ouverture et les créances et dettes déjà existantes | partir d'une situation exacte le premier jour | TRE-01 à 03 | M |
| US-41 | trésorier | créer des projets et des catégories de projets | imputer recettes et dépenses | TRE-04 | M |
| US-42 | trésorier | encoder une dépense ou une rentrée hors marchandise | suivre les frais et recettes des activités | TRE-06 à 08, 12 | M |
| US-43 | trésorier | encoder un transfert entre comptes (ex. dépôt d'espèces) | garder des soldes justes | TRE-09 | M |
| US-44 | trésorier | encoder une dépense payée en frais avancés | savoir à qui l'association doit de l'argent | TRE-16 | M |
| US-45 | trésorier | consulter et régler les créances et dettes | rembourser les bénévoles et récupérer les sommes dues | TRE-17 à 20 | M |
| US-46 | trésorier | rattacher un virement reçu à une soirée | connaître l'écart de caisse réel | SOI-22 ; TRE-24 | S |
| US-47 | trésorier | contre-passer un mouvement erroné | corriger sans effacer | TRE-10 | S |
| US-48 | trésorier | consulter le résultat de chaque projet et par catégorie | savoir ce que rapporte chaque activité | TRE-25 | M |
| US-49 | trésorier | consulter la situation nette et les soldes | connaître la santé financière de l'association | TRE-26, 27 | M |

### 6.6 Répertoire des tiers

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-53 | trésorier ou gestionnaire de stock | tenir le répertoire des personnes et des magasins, avec contrôle des noms approchants | ne pas créer deux fiches pour la même personne | REP-01 à 04, 06 | M |
| US-54 | trésorier | voir, pour une personne, ses ardoises et ses créances ou dettes réunies | savoir ce qu'elle doit en tout, et ce que l'association lui doit | REP-05 ; ARD-09 ; TRE-17 | M |

### 6.7 Exercices

| ID | En tant que… | je veux… | afin de… | RG | Prio |
|---|---|---|---|---|:-:|
| US-50 | administrateur | définir l'exercice en cours | organiser les données par année | EXE-01 | M |
| US-51 | administrateur | clôturer un exercice et ouvrir le suivant | repartir avec les soldes, le stock et les dettes reportés | EXE-02, 04, 05 ; STK-18 | C |
| US-52 | trésorier | passer une ardoise ou une créance en perte | clôturer l'exercice sans traîner des sommes qui ne rentreront jamais | ARD-18, 19 ; TRE-23 ; EXE-03 | S |

---

## 6bis. Écrans

Les maquettes sont dans le dossier **`docs/maquettes/`** du dépôt (fichiers HTML ouvrables directement, index dans `docs/maquettes/README.md`), en deux formats : ordinateur et tablette (1280 × 800) et téléphone (390 × 844).

| Écran | Rôle | Contenu | Maquettes |
|---|---|---|---|
| Caisse | Serveur, gestionnaire | Carte des articles, commande en cours, encaisser ou mettre à l'ardoise, annulation de la dernière vente, sortie (offert, casse, perte), règlement d'ardoise | `Caisse`, `CaisseMobile`, `CaisseMobilePanier` |
| Ardoise | Serveur | Choix d'une ou plusieurs personnes, solde déjà dû, répartition du montant, contrôle de la somme des parts | `Ardoise`, `ArdoiseMobile` |
| Règlement d'ardoise | Serveur | Personne, montant reçu, espèces ou virement, ardoises soldées | `ReglementMobile` |
| Ouverture de soirée | Gestionnaire | Projet, compte caisse, fond de caisse, puis confirmation de la carte et des prix | `Ouverture`, `OuvertureMobile` |
| Clôture de soirée | Gestionnaire | Espèces comptées, recette totale, ardoises, espèces des ventes, attendu par virement, coût du stock | `Cloture`, `ClotureMobile` |
| Stock | Gestionnaire, trésorier (lecture) | Stock théorique, coût unitaire, valeur, seuils et alertes, derniers écarts | `Stock`, `StockMobile` |
| Achat | Gestionnaire | Ticket (magasin, date, référence, règlement), lignes par produit et conditionnement, consigne, effets sur la trésorerie | `Achat`, `AchatMobile` |
| Inventaire | Gestionnaire | Comptage produit par produit, écart calculé, produits non comptés distingués | `Inventaire`, `InventaireMobile` |
| Trésorerie | Trésorier | Situation nette, soldes, résultat par projet, derniers mouvements | `Tresorerie`, `TresorerieMobile` |
| Qui doit quoi | Trésorier | Par tiers : ardoises du comptoir, frais avancés, consignes ; encaisser, détailler, passer en perte (RG-REP-05) | `Creances`, `CreancesMobile` |
| Membres | Administrateur | Membres, rôles, code d'adhésion | à maquetter |

Toutes ces vues sont responsives (ENF-04 à 07) : sur téléphone, les tableaux deviennent des listes de cartes, le menu latéral une barre basse, et les panneaux côte à côte des écrans successifs.

---

## 7. Exigences non fonctionnelles

### 7.1 Performance et ergonomie

| ID | Exigence |
|---|---|
| ENF-01 | La validation d'une vente répond en moins de 500 ms (95ᵉ percentile) dans des conditions normales de réseau. Cette valeur est **mesurée** par un test de charge minimal (une centaine de ventes enchaînées sur l'environnement déployé), dont le résultat est consigné. |
| ENF-02 | Une vente courante (1 à 3 articles) se saisit en 3 à 5 touches. |
| ENF-03 | L'écran de caisse est utilisable au doigt sur smartphone et sur tablette (zones tactiles de 44 × 44 px minimum). |
| ENF-04 | **Toute** l'application est responsive : chaque écran, de la caisse à la trésorerie, est utilisable sur téléphone, tablette et ordinateur. Une seule base de code, aucune version mobile séparée. |
| ENF-05 | Trois paliers de mise en page : téléphone (moins de 640 px), tablette (640 à 1024 px), ordinateur (au-delà). Aucun défilement horizontal à aucun palier ; les marges latérales ne descendent pas sous 16 px. |
| ENF-06 | Adaptations imposées sur téléphone : un tableau devient une liste de cartes, le menu latéral devient une barre de navigation basse, les panneaux côte à côte deviennent des écrans successifs, les actions principales restent visibles en bas de l'écran. |
| ENF-07 | Les cibles tactiles conservent 44 × 44 px minimum à tous les paliers, y compris dans les listes denses de la gestion. |
| ENF-08 | L'interface est en français ; les montants sont affichés en euros au format belge (1 234,56 €). |
| ENF-09 | Le balisage est **sémantique** : régions repérables (`header`, `nav`, `main`), vrais `button` et `a href`, tableaux avec `th` et `caption`, champs associés à leur `label`. Aucun comportement cliquable porté par un `div`. |
| ENF-10 | L'interface vise le niveau **WCAG 2.1 AA** : contraste du texte d'au moins 4,5:1 (3:1 au-delà de 24 px), navigation complète au clavier, focus visible, libellés accessibles sur les boutons à icône seule. Un contrôle automatisé d'accessibilité est exécuté en intégration continue. |
| ENF-11 | Les styles sont écrits avec **Tailwind CSS**, avec les couleurs, espacements et tailles de texte définis comme jetons de thème réutilisés partout ; aucune valeur de couleur ou d'espacement écrite en dur dans un composant. |

### 7.2 Disponibilité et fiabilité

| ID | Exigence |
|---|---|
| ENF-12 | Tout mouvement de stock verrouille les lignes `PRODUIT_ASSOCIATION` concernées (`SELECT … FOR UPDATE`), prises **dans l'ordre de leur `produitId`** pour éviter les interblocages entre deux ventes multi-produits. Deux ventes simultanées donnent ainsi le même résultat que deux ventes successives. |
| ENF-13 | Une opération qui touche le stock et la trésorerie est **atomique** : ses deux effets sont écrits dans la même transaction, ou aucun ne l'est (section 9.4). Aucun état intermédiaire n'est observable. |
| ENF-14 | L'indisponibilité du service Identité n'interrompt pas immédiatement une session : le jeton d'accès en cours reste vérifiable localement jusqu'à son expiration, soit 15 minutes au plus. Au-delà, le rafraîchissement échoue et la session prend fin — c'est la limite assumée de ce découplage. |
| ENF-15 | Chaque service expose un point de contrôle de santé (`/health`) utilisé par l'orchestration des conteneurs. |
| ENF-16 | Les bases de données sont sauvegardées quotidiennement ; une restauration est testée au moins une fois avant la livraison. |
| ENF-17 | Un jeu de **données de démonstration** peut être chargé en une commande dans l'environnement de développement (association, membres de chaque rôle, catalogue, soirée clôturée, ardoises dont une partagée, mouvements de trésorerie). Il n'est jamais chargé en production, qui ne contient que des données réelles. |

### 7.3 Sécurité

| ID | Exigence |
|---|---|
| ENF-18 | Tous les échanges passent en HTTPS. |
| ENF-19 | Les mots de passe sont hachés avec Argon2id ; ils ne sont jamais journalisés ni renvoyés. |
| ENF-20 | L'authentification repose sur un jeton d'accès de courte durée (15 min) et un jeton de rafraîchissement stocké en cookie `HttpOnly`, `Secure`, `SameSite`, renouvelé à chaque utilisation. |
| ENF-21 | Les jetons d'accès sont signés par une clé asymétrique ; le service Gestion ne détient que la clé publique. |
| ENF-22 | Chaque route vérifie le rôle du membre dans l'association concernée (matrice 4.3) ; l'isolation entre associations est couverte par des tests automatisés. |
| ENF-23 | Toutes les entrées sont validées côté serveur par un schéma (types, bornes, formats) ; les requêtes SQL sont paramétrées (via l'ORM). |
| ENF-24 | La connexion, la création de compte et l'adhésion par code sont limitées en fréquence (rate limiting), pour empêcher la force brute des mots de passe et des codes d'adhésion. |
| ENF-25 | Toute route d'un service qui n'est pas destinée au navigateur n'est pas exposée par le reverse proxy ; un éventuel appel du service Gestion vers le service Identité est authentifié par un secret de service. |
| ENF-26 | Aucun secret (clés, mots de passe de base de données) n'est versionné ; ils sont fournis par variables d'environnement. |
| ENF-27 | Les dépendances sont surveillées automatiquement (alertes de vulnérabilités). |
| ENF-28 | Les en-têtes de sécurité HTTP sont configurés (CSP, HSTS, X-Content-Type-Options) et CORS est limité à l'origine de l'interface. |

Une analyse de sécurité complète (menaces, risques, mesures) est produite en cours de projet, sur la base de l'OWASP Top 10.

### 7.4 Données personnelles

| ID | Exigence |
|---|---|
| ENF-29 | Seules les données nécessaires sont collectées : adresse e-mail, nom affiché, mot de passe haché. |
| ENF-30 | Un utilisateur peut supprimer son compte ; ses opérations passées restent attribuées à un auteur anonymisé. |
| ENF-31 | L'application publie des conditions d'utilisation et une politique de confidentialité, acceptées à la création du compte. Leur rédaction ne fait pas partie du cahier des charges. |

### 7.5 Maintenabilité et qualité

| ID | Exigence |
|---|---|
| ENF-32 | Le code respecte un style uniforme, vérifié automatiquement en intégration continue : **oxlint** pour l'analyse statique, **Prettier** pour le formatage. |
| ENF-33 | Les règles de gestion critiques sont couvertes par des tests unitaires qui citent le numéro de la règle testée. |
| ENF-34 | Toute évolution du schéma de base de données passe par une migration versionnée, relue avant application. |
| ENF-35 | Les calculs monétaires utilisent un type décimal exact de bout en bout (base de données, API, interface) ; aucun montant ni coût ne transite en nombre à virgule flottante. |
| ENF-36 | La logique métier ne dépend pas de l'ORM : l'accès aux données passe par des interfaces (repositories), de sorte que la base puisse être remplacée sans modifier la logique métier. |
| ENF-37 | Une **implémentation en mémoire** de chaque repository sert aux tests du domaine et des cas d'usage : ces tests s'exécutent sans base de données, ce qui démontre que la logique métier ne dépend pas de PostgreSQL (critère AA2). |
| ENF-38 | Le SQL brut, nécessaire au verrouillage de lignes (ENF-12) que l'API de requêtes de Prisma ne propose pas, est **confiné aux repositories** du dossier `infrastructure/` et nulle part ailleurs. |
| ENF-39 | Les repositories savent participer à une transaction ouverte par l'appelant : le client de transaction est propagé jusqu'à eux, sans être passé de main en main dans les signatures métier (section 10.3). |
| ENF-40 | Les façades publiques de chaque module (`public/`) sont documentées en **TSDoc** : rôle de chaque opération, paramètres, effets attendus. |
| ENF-41 | Les messages de commit suivent la convention *Conventional Commits*, qui alimente la génération des versions et du changelog. |
| ENF-42 | Chaque API est documentée au format OpenAPI, généré depuis le code. |

---

## 8. Modèle de données

Deux modèles : celui du service **Identité**, dans sa base, et celui du service **Gestion**, dans une base unique partagée par ses trois modules — **Répertoire**, **Bar** et **Trésorerie**.

**Règle de frontière entre les modules** : aucun module ne lit ni n'écrit les tables d'un autre, et aucune requête ne joint leurs tables. Les références croisées (`projetId` dans une soirée, `tiersId` dans une ardoise) restent de **simples identifiants, sans clé étrangère** : c'est ce qui permettra d'extraire un module dans un service séparé sans migration de schéma. L'existence d'un projet ou d'un tiers est vérifiée par un appel à la façade publique du module concerné, pas par une contrainte de la base.

Toutes les tables métier portent un `associationId`. Les montants d'argent sont des entiers en centimes ; les coûts unitaires sont des décimaux à 4 décimales (RG-TRE-29) ; les quantités de stock sont des décimaux à 3 décimales.

### 8.1 Service Identité

```mermaid
erDiagram
    UTILISATEUR ||--o{ ADHESION : "est membre via"
    ASSOCIATION ||--o{ ADHESION : "compte"
    ASSOCIATION ||--o| UTILISATEUR : "fondateur"

    UTILISATEUR {
        uuid id
        string email
        string nomAffiche
        string motDePasseHash
        datetime creeLe
    }
    ASSOCIATION {
        uuid id
        string nom
        string codeAdhesion
        uuid fondateurId
        datetime creeLe
    }
    ADHESION {
        uuid id
        uuid utilisateurId
        uuid associationId
        string roles
        datetime rejointLe
    }
```

`roles` ∈ {ADMINISTRATEUR, GESTIONNAIRE_STOCK, TRESORIER, SERVEUR, LECTEUR} ; une adhésion sans rôle est possible (RG-ORG-05).

### 8.2 Service Gestion — module Répertoire

```mermaid
erDiagram
    TIERS {
        uuid id
        uuid associationId
        string nom
        string type "PERSONNE / MAGASIN"
        uuid membreId "si le tiers est un membre"
        bool actif
        datetime creeLe
    }
```

Une seule table, et c'est le but : les personnes qui ont une ardoise, les bénévoles qui avancent des frais et les magasins chez qui une consigne est déposée sont **les mêmes tiers**, dans une seule liste (RG-REP-01). Le module Bar et le module Trésorerie y pointent tous les deux par `tiersId`, sans jamais en tenir de copie. Un tiers issu d'un membre conserve son `membreId` et une copie de son nom au moment de sa création : c'est ce qui permet d'afficher « Thomas » même si le service Identité est indisponible.

Sans ce module, « Thomas » existerait deux fois — une fois comme consommateur du bar, une fois comme bénévole de la trésorerie — et personne ne verrait ses 12 € d'ardoise à côté des 30 € de courses que l'association lui doit.

### 8.3 Service Gestion — module Bar

```mermaid
erDiagram
    PRODUIT ||--o{ CONDITIONNEMENT : "s'achète en"
    PRODUIT ||--o{ PRODUIT_ASSOCIATION : "utilisé par"
    PRODUIT ||--o{ ARTICLE : "alimente"
    ARTICLE ||--o{ PRIX_SOIREE : "prix spécifique"
    SOIREE ||--o{ PRIX_SOIREE : "tarif"
    SOIREE ||--o{ VENTE : "contient"
    VENTE ||--|{ LIGNE_VENTE : "contient"
    ARTICLE ||--o{ LIGNE_VENTE : "vendu dans"
    ACHAT ||--|{ LIGNE_ACHAT : "contient"
    INVENTAIRE ||--|{ LIGNE_INVENTAIRE : "contient"
    PRODUIT ||--o{ MOUVEMENT_STOCK : "historique"
    VENTE ||--o{ ARDOISE : "mise à l'ardoise en"
    ARDOISE ||--o{ REGLEMENT_ARDOISE : "soldée par"

    PRODUIT {
        uuid id
        uuid associationId "null = catalogue commun"
        string nom
        string categorie
        string uniteStock
    }
    CONDITIONNEMENT {
        uuid id
        uuid produitId
        string libelle
        decimal quantiteUnites
    }
    PRODUIT_ASSOCIATION {
        uuid associationId
        uuid produitId
        decimal seuilReappro
        decimal stockCourant
        decimal coutMoyenUnitaire "4 décimales"
        bool actif
    }
    ARTICLE {
        uuid id
        uuid associationId
        uuid produitId "vide si article sans stock"
        string nom
        decimal quantiteConsommee
        int prixBaseCentimes
        int ordreCarte
        bool surCarteParDefaut
        bool actif
    }
    PRIX_SOIREE {
        uuid soireeId
        uuid articleId
        int prixCentimes
    }
    ACHAT {
        uuid id
        uuid associationId
        uuid exerciceId
        date date
        uuid magasinTiersId "réf. Trésorerie"
        string refPiece
        string modeReglement "COMPTE / FRAIS_AVANCES"
        uuid compteId "si COMPTE"
        uuid tiersId "si FRAIS_AVANCES"
        int consigneCentimes
        uuid auteurId
    }
    LIGNE_ACHAT {
        uuid id
        uuid achatId
        uuid produitId
        uuid conditionnementId
        decimal nbConditionnements
        int montantCentimes
    }
    SOIREE {
        uuid id
        uuid associationId
        uuid exerciceId
        string nom
        date date
        uuid projetId "réf. Trésorerie"
        uuid compteCaisseId "réf. Trésorerie"
        uuid ouvreurId
        datetime ouverteLe
        int fondDeCaisseCentimes
        string statut
        int especesCompteesCentimes
        datetime clotureeLe
    }
    VENTE {
        uuid id
        uuid soireeId
        uuid serveurId
        datetime heure
        string statut "VALIDEE / ANNULEE"
        string statutPaiement "PAYEE / ARDOISE"
    }
    LIGNE_VENTE {
        uuid id
        uuid venteId
        uuid articleId
        int quantite
        int prixUnitaireCentimes
    }
    INVENTAIRE {
        uuid id
        uuid associationId
        date date
        uuid auteurId
    }
    LIGNE_INVENTAIRE {
        uuid inventaireId
        uuid produitId
        decimal quantiteComptee
        decimal stockTheorique
    }
    MOUVEMENT_STOCK {
        uuid id
        uuid associationId
        uuid exerciceId
        uuid produitId
        string type
        decimal quantite
        decimal coutUnitaire "4 décimales"
        string motif
        uuid sourceId
        uuid corrigeId
        uuid auteurId
        datetime date
    }
    PARAMETRAGE_BAR {
        uuid associationId
        int plafondArdoiseCentimes "0 = aucun plafond"
    }
    ARDOISE {
        uuid id
        uuid associationId
        uuid venteId
        uuid soireeId
        uuid projetId "réf. Trésorerie"
        uuid tiersId "réf. Répertoire"
        int montantCentimes
        string statut "OUVERTE / SOLDEE / PERDUE"
        uuid serveurId
        datetime creeLe
        uuid perteAuteurId
        datetime perteLe
        string perteMotif
    }
    REGLEMENT_ARDOISE {
        uuid id
        uuid ardoiseId
        int montantCentimes
        string moyen "ESPECES / VIREMENT"
        uuid compteId "réf. Trésorerie"
        uuid soireeId "si encaissé au bar"
        uuid mouvementId "la rentrée créée en Trésorerie"
        uuid auteurId
        datetime date
    }
```

- `MOUVEMENT_STOCK.type` ∈ {REPORT, ACHAT, VENTE, SORTIE, AJUSTEMENT, CORRECTION} ; `sourceId` pointe vers la ligne d'achat, de vente ou d'inventaire d'origine.
- `PRODUIT_ASSOCIATION.stockCourant` et `coutMoyenUnitaire` sont une **projection** mise à jour dans la même transaction que chaque mouvement ; elle peut à tout moment être recalculée à partir des mouvements (RG-STK-01).
- Le **magasin** d'un achat est un `TIERS` de type MAGASIN du module Répertoire (RG-REP-01), référencé par son identifiant. C'est le même tiers qui portera la créance de consigne côté Trésorerie.
- Chaque mouvement mémorise le coût unitaire applicable au moment où il est créé (RG-STK-07), ce qui rend la valorisation historique reproductible.
- Une `ARDOISE` par **part** : une vente partagée entre quatre personnes en crée quatre, chacune réglable séparément (RG-ARD-07). Le montant de la vente reste dans ses lignes ; l'ardoise ne duplique que le montant de la part.
- `ARDOISE.projetId` et `soireeId` sont recopiés à la création pour que le règlement, parfois encaissé des semaines plus tard, sache sur quel projet imputer la rentrée sans avoir à remonter la chaîne.
- `REGLEMENT_ARDOISE.mouvementId` garde le lien vers la rentrée écrite en Trésorerie dans la même transaction (section 9.4). C'est la seule trace croisée entre les deux modules, et elle va dans ce sens-là uniquement.
- Le plafond d'alerte par personne (RG-ARD-11) est un paramètre du **Bar**, pas de la trésorerie : c'est le serveur qu'il concerne.
- L'**encours des ardoises** (RG-ARD-20) est la somme des `montantCentimes` des ardoises `OUVERTE`, diminuée de leurs règlements. C'est ce nombre que la Trésorerie lit pour la situation nette.

### 8.4 Service Gestion — module Trésorerie

```mermaid
erDiagram
    CATEGORIE_PROJET ||--o{ PROJET : "regroupe"
    COMPTE ||--o{ MOUVEMENT : "source / destination"
    PROJET ||--o{ MOUVEMENT : "imputation / contrepartie"
    CREANCE_DETTE ||--o{ MOUVEMENT : "réglée par"
    EXERCICE ||--o{ MOUVEMENT : "contient"

    PARAMETRAGE {
        uuid associationId
        uuid projetParDefautId
        uuid projetStockId
        uuid compteCaisseParDefautId
    }
    EXERCICE {
        uuid id
        uuid associationId
        string libelle
        date debut
        date fin
        string statut
    }
    COMPTE {
        uuid id
        uuid associationId
        string nom
        string type "BANQUE / CAISSE"
        int soldeOuvertureCentimes
        bool actif
    }
    CATEGORIE_PROJET {
        uuid id
        uuid associationId
        string nom
    }
    PROJET {
        uuid id
        uuid associationId
        uuid categorieId
        string nom
        bool actif
    }
    MOUVEMENT {
        uuid id
        uuid associationId
        uuid exerciceId
        string type
        date date
        string libelle
        int montantCentimes
        uuid compteId
        uuid compteDestinationId
        uuid projetId
        uuid projetContrepartieId
        uuid creanceDetteId
        uuid soireeId
        string refPiece
        uuid contrePasseId
        uuid operationSourceId
        uuid auteurId
    }
    CREANCE_DETTE {
        uuid id
        uuid associationId
        string sens "A_RECEVOIR / A_PAYER"
        uuid tiersId "réf. Répertoire"
        string objet
        string origine "FRAIS_AVANCES / CONSIGNE / DIVERS / REPORT"
        int montantCentimes
        date dateAttendue
        uuid projetOrigineId
        uuid achatId "si consigne ou frais avancés"
        string statut "OUVERTE / SOLDEE / ABANDONNEE"
    }
```

- `MOUVEMENT.type` ∈ {DEPENSE, RENTREE, TRANSFERT, REFACTURATION, REGLEMENT, ABANDON} ; les champs utilisés dépendent du type (RG-TRE-06 à 08). Une contrainte vérifie la cohérence des champs renseignés avec le type.
- Le solde d'un compte, le résultat d'un projet et le solde restant d'une créance ou d'une dette sont **calculés**, jamais stockés comme donnée saisie.
- **Les ardoises ne sont pas ici.** Elles sont tenues par le module Bar (RG-ARD-08, section 8.3). `CREANCE_DETTE` ne porte que ce qui ne vient pas du comptoir : frais avancés par un bénévole, consignes chez un magasin, créances et dettes diverses, et reports d'ouverture (RG-TRE-02). C'est le champ `origine` qui les distingue, et `REPORT` est celui qui n'entre pas dans le résultat d'un projet (RG-TRE-25).
- Une créance ou une dette pointe vers un `tiersId` du Répertoire, **jamais vers une chaîne de caractères** : sans cela, « Thomas », « thomas » et « Tomas » deviendraient trois soldes différents.
- Le règlement d'une ardoise apparaît ici comme un mouvement de type **RENTREE** imputé au projet de la soirée (RG-ARD-12, RG-TRE-20), et non comme un REGLEMENT : la vente à l'ardoise n'avait produit aucune rentrée, donc c'est bien à cet instant que l'argent entre. Le type REGLEMENT reste réservé aux `CREANCE_DETTE` de ce module.

---

## 9. Architecture

### 9.1 Vue d'ensemble

```
                          Navigateur (React)
                                 │ HTTPS
                     ┌───────────▼────────────┐
                     │  Reverse proxy (Caddy) │  point d'entrée unique, TLS
                     └──────┬──────────┬──────┘
                     /api/identite   /api/gestion
              ┌─────────────▼──┐   ┌───▼──────────────────────────┐
              │   IDENTITÉS    │   │           GESTION            │
              │      ET        │   │  ┌─────┐      ┌──────────┐   │
              │ ORGANISATIONS  │◄──┤  │ Bar │─────►│Trésorerie│   │
              │                │   │  └──┬──┘      └────┬─────┘   │
              │                │   │     └──►┌────────┐◄┘         │
              │                │   │         │Répert. │           │
              └───────┬────────┘   └─────────┴───┬────┴───────────┘
                [ BD identité ]            [ BD gestion ]
```

**Deux services indépendants**, déployables sur des machines distinctes, chacun avec sa base : **Identités et organisations**, et **Gestion**, un monolithe modulaire contenant trois modules — **Bar**, **Trésorerie** et **Répertoire**. Aucun des deux services n'accède aux tables de l'autre. Gestion vérifie localement les jetons signés par Identité, et l'appelle pour deux choses : récupérer sa clé publique (9.3) et résoudre les membres d'une association (9.5).

### 9.2 Découpage

| | Service Identités et organisations | Service Gestion |
|---|---|---|
| Question traitée | Qui est l'utilisateur, et que peut-il faire dans quelle association ? | Que vaut le stock, qui doit quoi, et où est l'argent ? |
| Données possédées | Utilisateurs, associations, adhésions, rôles, codes d'adhésion | **Bar** : catalogue, stock, achats, soirées, ventes, caisse, **ardoises**, inventaires — **Trésorerie** : exercices, comptes, projets, mouvements, créances et dettes hors comptoir — **Répertoire** : personnes et magasins |
| Contrainte principale | Sécurité : c'est lui qui décide qui peut quoi | Cohérence : un achat et une clôture doivent toucher le stock et l'argent dans la même transaction |
| Base de données | La sienne | La sienne, un schéma par module |

Le découpage sépare ce qui doit l'être — l'identité porte le risque de sécurité et ne partage jamais de transaction avec le métier — et garde ensemble ce qui partage des transactions : un achat et une clôture de soirée modifient le stock **et** l'argent, et doivent réussir ou échouer ensemble.

**Les trois modules du service Gestion**

| Module | Ce qu'il possède | Ce qui l'en distingue |
|---|---|---|
| **Bar** | Ce qui se passe au comptoir et en réserve : catalogue, stock, achats côté marchandise, soirées, ventes, ardoises et leurs règlements, inventaires | Raisonne en quantités et en coûts unitaires à 4 décimales ; utilisé par les serveurs et les gestionnaires de stock, pendant le service |
| **Trésorerie** | L'argent : comptes, projets, mouvements, frais avancés, consignes, créances et dettes hors comptoir, exercices | Raisonne en centimes entiers ; utilisé par le trésorier, à froid |
| **Répertoire** | Les tiers : personnes et magasins | Une seule liste, partagée, pour que les ardoises d'une personne et ce que l'association lui doit se voient ensemble (RG-REP-05) |

**Pourquoi l'ardoise est dans le Bar et non dans la Trésorerie**, et pourquoi deux services et non trois : voir l'annexe §2 et §3.

### 9.3 Authentification et autorisation

1. L'utilisateur s'authentifie auprès du service **Identité**, puis choisit l'association sur laquelle il travaille.
2. Identité émet un **jeton d'accès** signé par une clé asymétrique, contenant l'identifiant de l'utilisateur, l'association choisie et ses rôles dans celle-ci, valable 15 minutes.
3. Le service **Gestion** récupère la clé publique d'Identité par son endpoint **JWKS**, qu'il met en cache et rafraîchit lorsqu'un jeton porte un identifiant de clé inconnu — ce qui permet à Identité de changer de clé sans coupure. La vérification d'un jeton, elle, est locale : Gestion n'appelle pas Identité à chaque requête. Il applique la matrice des droits (4.3) et filtre chaque requête sur l'association du jeton (RG-ORG-15).

Conséquence assumée : un retrait de rôle prend effet au plus tard à l'expiration du jeton d'accès en cours (15 minutes).

### 9.4 Communication entre les trois modules

Les trois modules partagent un processus et une base. Ils communiquent par **appel direct de la façade publique** de l'autre module, dans la **même transaction Prisma**.

**Le sens des dépendances est unique et sans cycle** : Bar appelle Trésorerie, Bar et Trésorerie appellent Répertoire, et rien ne remonte.

```
        ┌──────────────────────────────┐
        │  Service d'application       │  clôture d'exercice, situation nette
        └───────┬──────────────┬───────┘
                ▼              ▼
            ┌───────┐      ┌────────────┐
            │  Bar  │─────►│ Trésorerie │
            └───┬───┘      └──────┬─────┘
                │                 │
                ▼                 ▼
            ┌──────────────────────────┐
            │       Répertoire         │   (personnes et magasins)
            └──────────────────────────┘
```

**Ce que Bar demande à la Trésorerie.** Trois opérations seulement, et **aucune n'est sur le chemin critique de la caisse** :

| Opération dans Bar | Appel vers Trésorerie | Effet |
|---|---|---|
| Un achat de marchandise est encodé | `enregistrerAchat(...)` | Dépense sur le projet stock ; consigne en créance ; dette en cas de frais avancés (RG-TRE-11, 16, 21) |
| Une soirée est clôturée | `enregistrerClotureSoiree(...)` | Rentrée des espèces provenant des ventes ; refacturation du coût du stock consommé (RG-TRE-14 et 15) |
| Une ardoise est réglée | `enregistrerRentreeArdoise(...)` | Rentrée sur le compte encaisseur, imputée au projet de la soirée d'origine (RG-ARD-12, RG-TRE-20) |

**Ce que la vente ne fait plus.** Mettre une consommation à l'ardoise, la répartir entre quatre personnes, annuler une vente à l'ardoise ou passer une ardoise en perte sont désormais des opérations **entièrement locales au module Bar** (RG-ARD-08, 10, 18). Le geste le plus fréquent de l'application, celui qui se fait à trois heures du matin avec du monde au comptoir, ne traverse plus aucune frontière. C'est la conséquence la plus importante de la décision d'architecture (annexe §3).

**Ce que les deux modules demandent au Répertoire.** Résoudre un tiers, en créer un après contrôle des noms approchants, lister les tiers actifs (RG-REP-01 à 04). Ce module n'appelle personne.

**Atomicité.** Une opération n'est saisie qu'une fois (O1) et ses effets sont atomiques : si l'écriture de trésorerie échoue, l'achat ou la clôture entière est annulé. Ni file d'attente, ni événement interne, ni état intermédiaire à réconcilier (annexe §3).

**Ce qui touche plusieurs modules sans appartenir à aucun.** La clôture d'un exercice et la situation nette ne sont pilotées par aucun module : un **service d'application** placé au-dessus les appelle l'un après l'autre, dans une seule transaction pour la clôture (comptes côté Trésorerie, mouvements de report côté Bar, RG-EXE-06), en simple lecture pour la situation nette — qui additionne les soldes tenus par la Trésorerie, la valeur du stock et l'encours des ardoises tenus par le Bar (RG-TRE-26). Sans cette règle, Trésorerie et Bar se référenceraient mutuellement, ce que NestJS ne résout qu'avec `forwardRef`, et l'extraction future deviendrait impossible.

**Règles de frontière** (ce qui rend l'extraction future possible)
- Aucun module ne lit ni n'écrit les tables d'un autre, et aucune requête ne les joint.
- Tout passe par une façade publique étroite, nommée en termes métier, et documentée.
- Les références croisées sont de simples identifiants (section 8).
- Toutes ces opérations s'exécutent dans **une seule transaction**, propagée jusqu'aux repositories (section 10.3).
- Chaque module a son dossier, ses tests, et ses propres règles de calcul : quantités et coûts à 4 décimales côté Bar, centimes entiers côté Trésorerie (RG-TRE-28 et 29).

### 9.5 Ce que Gestion demande à Identité

Le service Gestion ne stocke aucun compte : il conserve des **identifiants** d'utilisateur (auteur d'un mouvement, serveur d'une vente) et, pour un tiers créé à partir d'un membre, une **copie de son nom** au moment de la création (RG-REP-03). Pour tout le reste, il interroge Identité.

| Besoin | Appel | Résilience |
|---|---|---|
| Vérifier un jeton | Aucun : vérification locale avec la clé publique obtenue par JWKS (9.3) | Fonctionne sans Identité |
| Afficher le nom d'un serveur ou d'un auteur | `POST /internal/utilisateurs/noms` — résolution **par lot** d'une liste d'identifiants, mise en cache quelques minutes | En cas d'échec, l'écran affiche les opérations sans le nom de leur auteur, jamais une page en erreur |
| Proposer les membres lors de la création d'un tiers (RG-ARD-04, RG-REP-03) | `GET /internal/associations/:id/membres`, mis en cache | En cas d'échec, seule la création d'un tiers **à partir d'un membre** est indisponible ; la création à partir d'un nom saisi reste possible, et les ardoises existantes s'affichent grâce à la copie du nom |
| Anonymiser l'auteur d'opérations passées (ENF-30) | Identité anonymise le compte ; Gestion garde l'identifiant, qui ne correspond plus à aucun nom affichable | Sans objet |

**Pourquoi côté serveur et non dans le navigateur.** Faire faire cette correspondance au navigateur reviendrait à déplacer une règle métier dans l'interface et à exposer la liste complète des membres à chaque écran, y compris à un serveur qui n'a pas à la voir (RG-ARD-16). Le cache et la dégradation décrits ci-dessus sont tenus par Gestion, en un seul endroit, et testables.

Aucun de ces appels n'est déclenché par une vente : **le chemin critique de la caisse ne dépend d'aucun appel réseau** en dehors de celui du navigateur vers Gestion.

**Suppression d'une association (RG-ORG-13).** C'est la seule opération qui exige un appel d'un service à l'autre :

1. Identité marque l'association supprimée et cesse d'émettre des jetons pour elle ; les jetons en cours expirent en 15 minutes au plus.
2. Identité appelle `DELETE /internal/associations/:id` sur Gestion, qui efface toutes les données de cette association.
3. Cet appel est authentifié par un secret de service (ENF-25, ENF-26) et **idempotent** : le rejouer n'a aucun effet supplémentaire.
4. Il est **rejoué jusqu'au succès**, ce qui suppose côté Identité une table de tâches en attente et un traitement périodique qui les reprend. C'est un **outbox minimal, assumé ici** : l'annexe §3 écarte les événements asynchrones *entre les modules de Gestion*, là où une transaction unique suffit ; entre deux services, aucune transaction commune n'existe, et le rejeu est la seule façon de ne pas laisser une association à moitié supprimée.

La route `/internal/**` n'est pas exposée par le reverse proxy.

### 9.6 Isolation des associations

Chaque enregistrement métier, dans chaque base, porte l'identifiant de l'association à laquelle il appartient. Toute requête est filtrée sur l'association du jeton, jamais sur une valeur fournie par le client (RG-ORG-15).

### 9.7 Rendre la frontière entre modules vérifiable

La règle « aucun module ne touche les tables de l'autre » ne doit pas reposer sur la seule discipline en revue de code. Trois mesures la rendent mécanique :

- **Trois schémas PostgreSQL** dans la base de Gestion — `bar`, `tresorerie` et `repertoire` — déclarés par le support multi-schéma de Prisma, documenté pour PostgreSQL en version 7. La frontière devient physique, et l'extraction future se fait par un `pg_dump` d'un schéma.
- **`dependency-cruiser` en intégration continue**, avec quatre règles : `tresorerie/**` n'importe jamais `bar/**` ; `bar/**` n'importe de `tresorerie` que `tresorerie/public/**` ; `repertoire/**` n'importe ni l'un ni l'autre ; seul `infrastructure/**` importe le client Prisma. oxlint ne couvre pas ce type de règle.
- **La même structure interne dans chaque module** :

| Dossier | Contenu |
|---|---|
| `domain/` | Fonctions pures : coût moyen pondéré, calculs de clôture, répartition d'une ardoise. Testées sans base (ENF-37), chaque test citant son numéro de règle (ENF-33). |
| `application/` | Cas d'usage, annotés `@Transactional()`. |
| `infrastructure/` | Repositories Prisma — le seul endroit qui connaît l'ORM (ENF-36, ENF-38). |
| `http/` | Contrôleurs. |
| `public/` | La façade exportée, seule porte d'entrée pour l'autre module. |

---

## 10. Choix techniques

### 10.1 Synthèse

| Couche | Choix | Justification |
|---|---|---|
| Langage et exécution | **TypeScript 6** (épinglé), **Node.js 26 LTS**, modules **ESM** | Un seul langage de bout en bout, types partagés entre services et interface. Node 26 devient la LTS active le 28/10/2026, le jour où Node 24 passe en maintenance ; Vitest 5 n'accepte d'ailleurs que Node 22.12, 24 ou ≥ 26. **TypeScript 7 est écarté pour l'instant** : il ne publie pas d'API programmatique de compilation, dont `nest build` et le plugin Swagger ont besoin (10.6). |
| Framework applicatif | **NestJS 12**, en **modules ESM** | Architecture modulaire, injection de dépendances, guards, validation déclarative, OpenAPI généré. Ses modules portent les frontières Bar / Trésorerie / Répertoire (annexe §1). La version 12 (août 2026) génère des projets ESM avec Vitest et oxlint, compilés par `tsc` : partir en CommonJS reviendrait à démarrer sur l'ancien modèle. |
| Base de données | **PostgreSQL**, une base par service | Base relationnelle robuste ; ses transactions ACID rendent atomique une opération qui touche le stock et la trésorerie (section 9.4). SQL conseillé par le cours. |
| Accès aux données et migrations | **Prisma 7** (Prisma Migrate), version épinglée | Schéma déclaratif, migrations SQL générées, versionnées et relues ; client typé ; multi-schéma pour séparer `bar`, `tresorerie` et `repertoire`. Isolé derrière des repositories (ENF-36). Prisma 8 reste en *release candidate* et sa CLI n'offre ni `migrate` ni `generate` : inadapté à un projet noté sur les migrations (annexe §4). **Les deux paquets sont épinglés explicitement** : au 01/10/2026, `prisma@latest` renvoie une RC de la 8 alors que `@prisma/client@latest` renvoie la 7 (10.6). |
| Validation des entrées | **Zod**, via les schémas *Standard Schema* acceptés par `@Body()`, `@Query()` et `@Param()` | Un schéma unique dans le paquet partagé valide côté serveur et côté interface. `@nestjs/swagger` 12 sait les refléter dans l'OpenAPI, moyennant un convertisseur (`zod-openapi`). |
| Interface | **React 19 + Vite 8**, **TanStack Query 5**, **TanStack Router 1** | Framework conseillé par le cours ; Vite pour la rapidité de développement ; TanStack Query pour le cache et les appels API ; TanStack Router pour ses routes typées, cohérentes avec un client d'API généré. |
| Client d'API | **Généré depuis l'OpenAPI** (`openapi-typescript` ou `orval`) | Les types et les appels ne sont pas réécrits à la main : une rupture de contrat entre le serveur et l'interface devient une erreur de compilation. |
| Authentification | **Service Identité maison**, JWT signés par clé asymétrique, Argon2id | Les règles propres au projet (fondateur, code d'adhésion, rôles par association) s'intègrent mal dans un fournisseur générique ; la vérification locale des jetons évite une dépendance d'exécution. |
| Tests | **Vitest 5** (unitaires), **Supertest** (API) | Vitest est le choix par défaut des projets ESM générés par le CLI NestJS 12 ; natif ESM, rapide, API compatible avec celle de Jest. |
| Organisation du code | **Monorepo** pnpm workspaces | Un seul dépôt GitHub (exigence du cours) : `apps/identite/`, `apps/gestion/` (modules `bar`, `tresorerie` et `repertoire`), `apps/web/` et un paquet de types partagés. |
| Conteneurs | **Docker**, images publiées sur GitHub Container Registry | Trois images versionnées : `identite`, `gestion`, `web`. L'exigence du cours (au moins deux images, deux services indépendants) est respectée. |
| CI/CD | **GitHub Actions** + **release-please** | Outils conseillés par le cours ; versionnement sémantique et changelog générés depuis les Conventional Commits. |
| Hébergement | **VPS** + **docker compose**, **Caddy** (fournisseur et domaine à déterminer) | Suffisant pour le volume visé ; Caddy fournit le point d'entrée unique et HTTPS automatique. |

### 10.2 Décisions structurantes

Quatre choix s'écartent de la voie la plus attendue et sont argumentés dans l'**annexe des justifications** :

| Décision | Résumé | Détail |
|---|---|---|
| NestJS plutôt que Spring Boot | Mêmes concepts (injection de dépendances, contrôleurs, guards, migrations versionnées) dans un langage déjà maîtrisé ; le temps du projet va à l'architecture, pas à l'apprentissage d'un langage. | Annexe §1, avec la table de correspondance Spring ↔ NestJS |
| Deux services plutôt que trois | On sépare ce qui doit l'être (l'identité, qui porte le risque de sécurité) et on garde ensemble ce qui partage des transactions (stock et argent). Monolithe modulaire, frontières prêtes pour une extraction. | Annexe §2 |
| L'ardoise appartient au module Bar | Modélisée d'abord comme une créance de la trésorerie, elle obligeait chaque vente à écrire dans deux domaines. Déplacée au comptoir, elle supprime la seule transaction transverse du chemin critique de la caisse, et fait apparaître le module Répertoire. | Annexe §3 |
| Appels directs plutôt qu'événements entre modules | Un événement publié dans le même service risque d'être traité hors de la transaction qui l'a produit : un achat pourrait exister sans sa dépense. | Annexe §3 |

### 10.3 Transactions à travers plusieurs modules

Un achat de marchandise ou une clôture de soirée écrit dans les tables de deux modules, en **une seule transaction**, alors que l'accès aux données passe par des repositories (ENF-36, ENF-39). Depuis que l'ardoise appartient au module Bar (annexe §3), plus aucune vente n'est concernée : seules les opérations à froid traversent une frontière.

- Le client de transaction est propagé par contexte d'exécution : `nestjs-cls`, son greffon `@nestjs-cls/transactional` et `@nestjs-cls/transactional-adapter-prisma` (version 2, compatible NestJS 12, ESM et Prisma 7 comme 8). Une méthode `@Transactional()` ouvre la transaction ; les repositories lisent le client courant via `TransactionHost`.
- **Ce choix est fait au squelette** : revenir dessus en cours de projet oblige à réécrire la couche d'accès aux données. L'alternative (passer le client en paramètre) est décrite en annexe §4.
- Un test vérifie qu'un échec côté Trésorerie annule bien l'écriture côté Bar.

### 10.4 Migrations de schéma

- Chaque service possède son schéma Prisma et son dossier de migrations. Dans le service Gestion, un seul fichier Prisma décrit les tables des trois modules, réparties en **trois schémas PostgreSQL** `bar`, `tresorerie` et `repertoire` (section 9.7), grâce au support multi-schéma documenté pour Prisma 7.
- En développement, une migration est générée à partir du schéma, **relue**, corrigée si nécessaire (renommages), puis versionnée dans Git.
- En production, les migrations en attente sont appliquées au démarrage du conteneur, avant l'application.
- Aucune migration de retour arrière n'est prévue : une erreur se corrige par une nouvelle migration.
- Un changement cassant sur une table remplie est découpé en étapes (ajout facultatif, remplissage, contrainte).
- Le catalogue commun (RG-CAT-02) est livré sous forme de migration de données.
- La CI applique toutes les migrations sur une base vide à chaque pull request.

### 10.5 Chaîne d'intégration et de déploiement

1. **Pull request** : lint, tests unitaires et d'API, application des migrations sur une base de test, construction des images.
2. **Fusion sur `main`** : release-please ouvre ou met à jour la pull request de version.
3. **Publication d'une version** : les images Docker sont construites, étiquetées avec leur numéro de version et publiées sur GitHub Container Registry.
4. **Déploiement** : le serveur récupère les images de la version publiée et redémarre les services via docker compose.

---

### 10.6 Versions retenues et pièges de compatibilité

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

### 10.7 Nommage dans le code

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

## 11. Planning et organisation

### 11.1 Méthode

- Projet mené **seul**, licence **MIT**, dépôt GitHub public.
- Itérations d'une semaine, alignées sur les séances de cours.
- Backlog : les user stories de la section 6, suivies dans un tableau GitHub Projects (À faire, En cours, En revue, Terminé).
- Une branche et une pull request par user story ; fusion uniquement si la CI est verte.
- **Définition de « terminé »** : code relu, tests écrits pour les règles concernées, migration relue, documentation OpenAPI à jour, déployé sur le serveur.

### 11.2 Jalons

| Période | Objectif | Contenu |
|---|---|---|
| Jusqu'au 24/09 | Cahier des charges | Cahier des charges validé ; dépôt GitHub et monorepo créés. |
| 24/09 – 08/10 | **Squelette déployé** | Deux services vides répondant `/health` (Identité, Gestion) et l'interface, une migration initiale par base, trois images Docker publiées par la CI, application accessible en ligne en HTTPS. |
| 08/10 – 15/10 | Identité | US-01 à 11 : comptes, mot de passe oublié, associations, adhésion, rôles. |
| 15/10 – 05/11 | Catalogue et achats | US-12 à 19, US-20, US-21, US-24. |
| 05/11 – 19/11 | Caisse et ardoises | US-28 à 39, US-53 ; ardoises locales au module Bar, clôture de soirée et appel transactionnel Bar → Trésorerie. |
| 19/11 – 03/12 | Trésorerie | US-40 à 45, US-48, US-49, US-54 ; façade publique du module Trésorerie et tests de l'invariant de situation nette. |
| 03/12 – 10/12 | Inventaires et compléments | US-22 à 27, 32, 33, 46, 47, 52 ; stories S restantes selon l'avancement. |
| 10/12 – 17/12 | Sécurité | Analyse de sécurité (OWASP Top 10), tests d'isolation entre associations, corrections. |
| 17/12 – 03/01 | Stabilisation et livraison | Revue technique, corrections, documentation, version 1.0. **Remise du projet le 03/01 à 23 h 59**, dépôt GitHub public et application accessible en ligne. |
| 03/01 – 14/01 | Défense orale | Préparation et présentation orale (séances des 07/01 et 14/01) : démonstration sur l'environnement déployé, justification des choix techniques (annexe). |

Le déploiement est mis en place **dès la deuxième itération**, avant toute fonctionnalité métier, pour que chaque fonctionnalité soit livrée en ligne au fil de l'eau.

### 11.3 Risques

| Risque | Impact | Mesure |
|---|---|---|
| Périmètre trop large pour le délai | Fonctionnalités inachevées | Priorisation MoSCoW ; les stories **C** et une partie des **S** sont abandonnées si nécessaire. |
| Frontière entre modules non respectée en codant (jointure directe, accès aux tables de l'autre module) | L'extraction future de la Trésorerie devient impossible | Interfaces publiques explicites, aucune clé étrangère entre modules, revue de chaque pull request sur ce point. |
| Fuite de données entre associations | Critique (sécurité) | Filtrage systématique, tests automatisés d'isolation (ENF-22). |
| Découverte tardive des problèmes de déploiement | Blocage en fin de projet | Squelette déployé dès la deuxième itération. |

---

## 12. Évolutions envisagées

- Extraction du module Trésorerie en service séparé, avec outbox, idempotence et traitement des échecs partiels — si le besoin apparaît (charge, équipe, déploiements séparés).
- Mode hors ligne de la caisse (application web progressive).
- Changement rapide de serveur par code court sur une tablette partagée.
- Export CSV des mouvements et récapitulatif annuel pour l'assemblée générale.
- Photo du ticket ou de la facture attachée à un achat ou une dépense.
- Budget prévisionnel par projet, comparé au réalisé.
- Import CSV des relevés bancaires.
- Import CSV de l'inventaire d'ouverture (saisi produit par produit dans la version 1.0).
- Articles composés de plusieurs produits (cocktails, recettes).
- Enregistrement du moyen de paiement des ventes.
- Tableaux de bord et statistiques de vente (produits les plus vendus, heures d'affluence).
