# Phase 28 Context - Harmonisation UI Talents

## Objectif
Appliquer toutes les améliorations UX de la page /clients à la page /talents pour cohérence totale de l'application.

## Décisions Utilisateur (2026-01-22)

### 1. Modes d'affichage
**Décision :** A - Les 3 modes (Table + Grid + Kanban)
- Table : Vue dense, toutes les données en colonnes
- Grid : Cartes avec avatars, visuellement plus agréable
- Kanban : Colonnes par statut, maximum de détails
- Toggle buttons avec localStorage persistence

### 2. Formulaires Create/Edit
**Décision :** B - Pattern accordion comme /clients (ClientEditForm style)
- Refonte complète des dialogs actuels
- Accordions pour organiser champs logiquement
- Même pattern que ClientEditForm.tsx
- Phase plus complexe mais cohérence totale

### 3. Stats/KPIs
**Décision :** Copier pattern exact de /clients (4 cards)
- Total talents (équivalent "Total clients")
- Talents VIP/top performers (équivalent "Clients VIP")
- Revenue généré ou sessions totales (équivalent "Comptes à recevoir")
- Dernière session talent (équivalent "Dernière session")
- Même layout, même design, données adaptées

### 4. Colonnes triables
**Décision :** A - Tri sur toutes les colonnes principales
- Nom
- Type de talent (musicien/ingénieur/producteur)
- Specialty/Instrument
- Nombre de sessions
- Dernière session
- Email
- Plus flexible que /clients

### 5. Copy-to-clipboard
**Décision :** A - Email ET phone avec toast
- Bouton copie email avec toast "Email copié!"
- Bouton copie phone avec toast "Téléphone copié!"
- Visible dans les 3 vues (Table, Grid, Kanban)
- Réutiliser composant CopyButton de Clients.tsx

### 6. Avatars
**Décision :** A - Avatars complets (photos + initiales fallback)
- Photo de profil si uploadée
- Initiales colorées en fallback (ex: "JD" pour John Doe)
- Système upload photo (réutiliser pattern clients)
- Identification visuelle rapide

### 7. Badges colorés
**Décision :** A - Badges type de talent seulement
- Musicien (couleur A)
- Ingénieur (couleur B)
- Producteur (couleur C)
- Autres types selon TALENT_TYPES
- Cohérent avec /clients (qui badge le type)

### 8. Search amélioré
**Décision :** B - Server-side avec debounce 300ms
- Migrer du client-side actuel vers server-side
- Debounce 300ms comme /clients
- Cohérence pattern, scalabilité

### 9. Préférences utilisateur
**Décision :** A - Toutes les préférences sauvegardées
- Mode d'affichage (Table/Grid/Kanban)
- Ordre des colonnes (drag & drop)
- Colonnes visibles/cachées
- Tri actif (colonne + ordre)
- localStorage comme /clients

## État Actuel

### Clients.tsx (Référence)
- **Lignes :** 1307 lignes
- **Phases appliquées :** 19, 20, 22, 23, 24, 25, 26, 26.1, 27
- **Features :** 3 modes, tri, stats, avatars, copy-to-clipboard, preferences

### Talents.tsx (À améliorer)
- **Lignes :** 569 lignes
- **État :** Page basique avec table simple et filtres
- **Features manquantes :** Tout ce qui est dans Clients.tsx

## Schéma Différences

### Clients
- Table : `clients`
- Colonnes clés : `name`, `artistName`, `type`, `companyName`, `email`, `phone`

### Talents
- Table : `musicians`
- Colonnes clés : `name`, `stageName`, `talentType`, `specialty`, `email`, `phone`

## Patterns Réutilisables de Clients.tsx

1. **CopyButton component** (lines 43-58)
2. **ViewMode toggle** (Table/Grid/Kanban state)
3. **SortableTableHeader** (drag & drop columns)
4. **Stats cards** (4 cards layout)
5. **Avatar component** (avec initiales)
6. **Badge color mapping** (par type)
7. **localStorage preferences** (viewMode, columns, sort)
8. **Debounced search** (300ms delay)

## Composants Existants à Garder

- `TalentForm` dialog actuel → remplacer par TalentEditForm accordions
- `trpc.musicians.*` queries → adapter pour tri/filtres server-side

## Complexité Estimée

**Portée :** Refonte complète UI /talents (569 → ~1300 lignes estimées)

**Similaire à :** Phases 19 + 20 + 22 + 24 combinées pour /clients

**Difficulté :** Moyenne-Haute (copie pattern existant mais adaptation requise)
