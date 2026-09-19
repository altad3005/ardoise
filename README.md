# Ardoise

## Description
Application web de gestion d'un bar associatif : saisie des ventes, suivi du stock et trésorerie.

## Fonctionnalités
- À définir...

## Architecture
Deux services indépendants :
- **caisse** — produits, prix, encodage des ventes. Optimisé pour la disponibilité
  et la latence pendant le service.
- **gestion** — stock, approvisionnements, inventaires, trésorerie, rapports.
