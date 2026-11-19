# Ardoise — Cahier des charges simplifié

> Version courte du [cahier des charges](cahier-des-charges.md) — novembre 2026.
> Les choix techniques et le planning sont dans le [plan d'implémentation simplifié](plan-implementation-simplifie.md).

## Contexte et objectifs

Ardoise réunit la caisse, le stock et la trésorerie d'un bar associatif dans une seule application web. Elle s'adresse aux associations tenues par des bénévoles (unités scoutes, cercles, clubs), qui jonglent aujourd'hui entre plusieurs tableurs.

Le problème : une même opération est saisie plusieurs fois, et rien ne relie les boissons vendues à l'argent encaissé. On ne sait donc pas simplement combien une soirée a rapporté, ce que vaut le stock, ni qui doit quoi à qui.

Objectifs :

1. Saisir chaque opération réelle (achat, vente, comptage) une seule fois ; ses effets sur le stock et l'argent sont calculés automatiquement.
2. Connaître à tout moment le stock, le résultat de chaque soirée et de chaque projet.
3. Servir plusieurs associations, chacune ne voyant que ses propres données.

## Utilisateurs

Toute personne peut créer un compte, créer une association ou en rejoindre une avec un code d'adhésion. Un même compte peut avoir des rôles différents dans plusieurs associations.

| Rôle | Ce qu'il fait |
| --- | --- |
| Administrateur | Tous les droits, plus la gestion des membres, des rôles et du paramétrage |
| Gestionnaire de stock | Catalogue, achats, inventaires ; ouvre et clôture les soirées |
| Trésorier | Comptes, projets, mouvements, créances et dettes |
| Serveur | Encaisse au comptoir pendant une soirée ouverte |
| Lecteur | Consulte tout, sans rien modifier |

## Fonctionnalités

Six domaines, priorisés en MoSCoW dans le backlog GitHub (une user story par issue).

| Domaine | Contenu |
| --- | --- |
| Caisse et soirées | Ouverture avec fixation des prix, encaissement multi-serveurs sur smartphone, annulation, clôture avec comptage des espèces |
| Ardoises | Consommations mises au nom d'une personne, partageables, réglées plus tard |
| Catalogue et stock | Catalogue commun et propre, achats par ticket, coût moyen pondéré, inventaires et écarts, alertes de réapprovisionnement |
| Trésorerie | Comptes, projets, frais avancés, créances et dettes, résultat par projet, situation nette |
| Répertoire | Une seule liste de personnes et de magasins, avec le solde global de chacun |
| Comptes et associations | Inscription, création d'association, adhésion par code, rôles |

## Hors périmètre

- Paiements électroniques et impression de tickets
- Fonctionnement hors ligne de la caisse
- Comptabilité légale, TVA et export comptable
- Import automatique des relevés bancaires
- Application mobile native (l'interface web reste utilisable sur smartphone)
