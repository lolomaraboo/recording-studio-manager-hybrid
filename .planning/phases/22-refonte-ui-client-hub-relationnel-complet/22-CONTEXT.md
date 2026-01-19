# Phase 22: Refonte UI Client - Hub Relationnel Complet - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganiser les pages client (création, modification, détail) pour mieux afficher les 22 nouveaux champs musicaux (Phase 18.4) + ajouter accès aux données relationnelles (projets, tracks, finances).

**Scope fixe:** Améliorer l'organisation UI et l'accès aux données existantes. Pas de nouvelles capacités business - juste une meilleure présentation des données.

</domain>

<decisions>
## Implementation Decisions

### UI - Structure ClientDetail

**Onglets horizontaux au même niveau:**
- [Informations] [Projets] [Tracks] [Sessions] [Finances]
- Pas de sous-onglets imbriqués
- Pas de sections collapsibles verticales
- **Notes toujours visibles:** Section fixe en bas de page (après scroll), visible quelque soit l'onglet actif

**Justification:** Navigation rapide, facile à scanner, Notes accessibles partout sans switcher d'onglet.

### UI - Composant ClientForm (Création/Modification)

**Wizard multi-étapes avec navigation flexible:**
- **3 étapes:** (1) Base (nom, email, type, phone, address), (2) Enrichi (vCard contacts, custom fields), (3) Musique (22 champs Phase 18.4)
- **Stepper toujours cliquable:** Possibilité de sauter directement à Étape 3 même si Étape 1/2 non remplies
- Pas de validation stricte étape par étape - navigation libre entre les 3
- **Réutilisable:** Même composant pour création (`/clients/new`) ET modification (mode édition ClientDetail)

**Justification:** Organiser ~50 champs en sections logiques, permettre saut rapide aux champs musicaux si client déjà créé.

### Content - Onglet Projets

**4 modes d'affichage avec toggle boutons:**
1. **Cards avec stats (défaut):** Titre, Statut badge, X tracks, Y heures enregistrées, Budget/Dépensé - Cards cliquables vers projet
2. **Liste compacte:** Titre | Statut | Date | Lien - Moins d'infos, plus dense
3. **Table enrichie:** Toutes colonnes - Titre | Statut | Tracks | Sessions | Budget | Genre | Date | Actions
4. **Kanban par statut:** Colonnes [Planifié] [En cours] [Mixing] [Mastering] [Livré]

**Customisation:**
- Colonnes/champs sélectionnables par vue (toggle visibility)
- Drag & drop pour réordonner colonnes/champs
- Préférences sauvegardées en DB (compte utilisateur), synchronisées cross-device

### Content - Onglet Tracks

**3 modes d'affichage avec toggle boutons:**
1. **Liste avec audio player inline:** Titre | Projet | Durée | Statut | Mini audio player (play/pause) inline
2. **Cards visuelles avec artwork:** Artwork/Cover | Titre | Artistes | Durée | Player + waveform | Projet parent
3. **Table simple (metadata):** Titre | Projet | Artistes | Durée | Statut | Version | Lien "Voir" (pas de player)

**Customisation:**
- Colonnes/champs sélectionnables par vue
- Drag & drop pour réordonner
- Préférences sauvegardées en DB, synchronisées cross-device

### Content - Onglet Sessions

**4 modes d'affichage avec toggle boutons:**
1. **Table (mode actuel):** Session | Salle | Date | Statut | Actions
2. **Cards compactes:** Titre session, Salle, Date/heure, Statut badge, Durée
3. **Timeline/Calendar view:** Vue chronologique par date (past/upcoming)
4. **Kanban par statut:** Colonnes [Programmée] [En cours] [Terminée] [Annulée]

**Customisation:**
- Colonnes/champs sélectionnables par vue
- Drag & drop pour réordonner
- Préférences sauvegardées en DB, synchronisées cross-device

### Content - Onglet Finances

**Structure:** 3 sections verticales
1. **Stats en haut:** Cards - Total payé, En attente, Quotes ouverts, Projection revenus (metrics financières consolidées)
2. **Table Factures:** Liste des factures avec 4 modes d'affichage
3. **Table Quotes:** Liste des devis avec 4 modes d'affichage

**4 modes d'affichage pour Factures et Quotes (toggle boutons):**
1. **Table (mode actuel):** Numéro | Date | Montant | Statut | Actions
2. **Cards avec montant prominant:** Numéro facture gros, Montant XXX€, Statut badge, Date, Client
3. **Timeline financière:** Vue chronologique par date d'émission
4. **Kanban par statut:** Colonnes [Brouillon] [Envoyé] [Payé] [En retard] [Annulé]

**Customisation:**
- Colonnes/champs sélectionnables par vue
- Drag & drop pour réordonner
- Préférences sauvegardées en DB, synchronisées cross-device

### Behavior - Navigation

**Navigation dans même onglet + breadcrumb:**
- Clic sur projet/track/facture → quitte page client, navigate vers page projet/track/facture
- **Breadcrumb** pour retour: `Clients > Emma Dubois > Projets > Horizons Lointains`
- Pas de nouvel onglet navigateur (target=_blank)
- Pas de modal/drawer overlay

**Justification:** Navigation standard SPA, breadcrumb clair pour context et retour facile.

### Behavior - Empty States

**Empty state illustré + CTA:**
- Si onglet vide (ex: client sans projets): Icône/illustration + message + bouton CTA
- Exemple Projets: Illustration folder vide + "Aucun projet pour ce client" + bouton [Créer un projet]
- Bouton CTA ouvre formulaire création avec client pré-rempli
- Pas juste texte gris - visuellement accueillant et actionnable

**Justification:** Encourage action immédiate, UX moderne, réduit friction pour créer premiers projets/tracks/sessions.

### Claude's Discretion

**Implémentation technique laissée à Claude:**
- Loading states (skeleton, spinner, quelle approche?)
- Exact spacing et typography des cards/tables
- Comportement exact du drag & drop (librairie, animations)
- Colonnes par défaut affichées avant customisation (choix logiques standards)
- Ordre de tri par défaut (date récente, nom alphabétique - choisir le plus logique)
- Format exact du breadcrumb (séparateur, icônes, styling)
- Actions rapides sur items (edit icon, delete icon - standards shadcn/ui)
- Icônes illustrations pour empty states (Lucide icons standards)
- Structure DB pour sauvegarder préférences utilisateur (JSON column, table séparée - choisir le plus performant)

</decisions>

<specifics>
## Specific Ideas

**Customisation universelle:**
- "Il faudrait qu'on puisse choisir sur chaque vue ce qu'on veut et drag & drop pour se faire du sur mesure" - Customisation avancée sur TOUS les onglets (Projets, Tracks, Sessions, Finances)
- Préférences synchronisées cross-device (DB storage, pas localStorage)
- Toggle boutons comme sur page Clients existante (Table/Grid/Kanban pattern)

**Navigation:**
- Même onglet navigation (pas nouvel onglet, pas modal overlay)
- Breadcrumb pour retour facile

**Organisation wizard:**
- Stepper toujours cliquable pour sauter directement à Étape 3 (Musique) si Base/Enrichi déjà renseignés

**Empty states:**
- Illustrés + CTA (pas juste texte gris)
- Bouton CTA pré-remplit client dans formulaire création

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

Toutes les décisions concernent l'organisation UI et l'affichage des données existantes. Aucune nouvelle capability business n'a été proposée pendant la discussion.

</deferred>

---

*Phase: 22-refonte-ui-client-hub-relationnel-complet*
*Context gathered: 2026-01-18*
