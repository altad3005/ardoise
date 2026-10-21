# Identité visuelle d'Ardoise

Ce dossier contient les fichiers de référence du logo. L'application ne les charge pas : les icônes de `apps/web/public/` et le composant `apps/web/src/ui/logo.tsx` en sont dérivés.

## Le logo

Le symbole est un « A » tracé à la craie. Sa barre transversale est un trait de pointage, comme ceux qu'on trace sur une ardoise de bar.

| Fichier | Contenu | Usage |
|---|---|---|
| `logo.svg` | « A » à la craie + « rdoise », en encre | fonds clairs |
| `logo-dark.svg` | « A » à la craie + « rdoise », en papier | fonds sombres |
| `logo-mark.svg` | tuile seule | icône d'application, avatar, à partir de 48 px |
| `logo-mark-small.svg` | tuile seule, tracés droits et épaissis | sous 48 px (favicon) |
| `logo-symbol.svg` | symbole sans tuile, version claire | fonds clairs |
| `logo-symbol-dark.svg` | symbole sans tuile, version sombre | fonds sombres |

Dans le logo complet, le symbole tient lieu de première lettre du nom : il prend la hauteur des capitales et la ligne de base de « rdoise », avec un trait épaissi pour tenir face au gras. « rdoise » est en Fraunces Bold (opsz 72), converti en tracés : le logo ne dépend d'aucune police installée.

## Couleurs

| Rôle | Valeur | Remarque |
|---|---|---|
| Encre | `#14130F` | fond de la tuile, texte sur fond clair |
| Papier | `#F7F5EF` | tracé du « A », texte sur fond sombre |
| Accent sur fond sombre | `#E08A3C` | barre transversale ; contraste 6,97:1 sur l'encre |
| Accent sur fond clair | `#9A4C0B` | barre transversale ; contraste 5,64:1 sur le papier |

Ne pas mettre `#E08A3C` sur fond clair : son contraste n'y est que de 2,45:1, sous le minimum de 3:1 exigé pour un élément graphique (WCAG 1.4.11).

Dans l'interface, le composant `apps/web/src/ui/logo.tsx` affiche le logo complet. Le « A » et « rdoise » prennent la couleur du texte, et la barre utilise le token `--color-accent` du thème, qui vaut déjà `#9A4C0B` en ambiance claire et `#E08A3C` sous `data-theme="service"`.

## Règles d'usage

- **Zone de protection** : garder autour du logo un espace vide au moins égal à la moitié de la hauteur du symbole.
- **Taille minimale** : 16 px de haut pour le symbole seul, 24 px pour le logo complet.
- **À ne pas faire** : déformer le logo, changer les couleurs hors du tableau ci-dessus, recomposer le nom dans une autre police, poser le symbole sans tuile sur une photo.

## Régénérer les fichiers dérivés

Les PNG et l'ICO de `apps/web/public/` sont générés à partir de `logo-mark.svg`, de `logo-mark-small.svg` et du symbole :

- `favicon.svg` et `favicon.ico` (16, 32, 48 px) : version petite taille ;
- `icon-192.png` et `icon-512.png` : tuile arrondie, fond transparent ;
- `apple-touch-icon.png` (180 px) et `icon-maskable-512.png` : plein cadre, symbole dans la zone sûre, car iOS et Android appliquent leur propre masque.
