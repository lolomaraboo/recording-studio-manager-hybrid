# Phase 20: Affichage Contacts Multiples Entreprises - Context

**Gathered:** 2026-01-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Afficher les contacts multiples stockés dans `client_contacts` pour les entreprises/groupes dans les trois vues clients (Table/Grid/Kanban). Actuellement, seules les informations du client principal (table `clients`) sont visibles - les contacts associés (4-6 contacts par entreprise) sont invisibles dans les listes.

**Scope élargi:** Ajouter également des icônes "copier dans le presse-papier" pour TOUS les emails et téléphones affichés dans l'application (pas limité aux contacts multiples).

</domain>

<decisions>
## Implementation Decisions

### UI - Table View (Dense, Scanner)
- Afficher badge avec nombre de contacts uniquement
- Ex: Badge "4 contacts" à côté du nom de l'entreprise
- Minimal pour maintenir la densité de la vue Table
- Cohérent avec les badges existants (VIP, Type)

### UI - Grid View (Cartes Visuelles)
- Afficher badge avec nombre de contacts (comme Table)
- Ex: Badge "4 contacts" sur la carte
- Pas de liste de noms - garder les cartes compactes
- Cohérence avec Table view

### UI - Kanban View (Contexte Complet)
- **Layout vertical:** Entreprise en haut, Contacts en bas
- Section entreprise: Nom, logo, adresse, notes (comme actuellement)
- Section contacts: Liste complète de tous les contacts
- Plus mobile-friendly que split horizontal

### Content - Informations Contact (Kanban)
- **Nom complet** (prénom + nom)
- **Titre/Rôle** (ex: PDG, Directrice Artistique)
- **Email** (avec icône copier + mailto: link)
- **Téléphone** (avec icône copier + tel: link)
- Vue très complète pour workflow détaillé

### Content - Contact Principal
- Identifier avec icône ⭐ avant le nom
- Ex: "⭐ Philippe Moreau (PDG)"
- Visuel, subtil, rapide à identifier (is_primary = true)

### UX - Badge Click (Table/Grid)
- Comportement actuel conservé
- Cliquer sur le badge OU n'importe où sur la ligne/carte → Page détail du client
- Pas de tooltip/popover/expand - simplicité

### UX - Contact Actions (Kanban)
- **Email cliquable:** mailto: link (ouvre client email)
- **Téléphone cliquable:** tel: link (lance appel sur mobile)
- **Icône copier:** Petit icône à côté de chaque email/téléphone pour copier dans presse-papier

### UX - Icônes Copier Générales (Scope Élargi)
- Ajouter icônes "copier dans presse-papier" pour **TOUS** les emails et téléphones affichés dans l'application
- Pas limité aux contacts multiples - fonctionnalité générale
- Partout où un email ou téléphone est visible (page détail client, liste clients individuel, etc.)
- Interaction: Clic sur icône → copie dans presse-papier + feedback visuel (toast "Copié!")

### Claude's Discretion
- Style exact du badge "X contacts" (couleur, taille - cohérent avec badges existants)
- Spacing et padding de la section contacts dans Kanban
- Design de l'icône copier (taille, position exacte, icône utilisée)
- Animation/feedback visuel pour la copie (toast, tooltip temporaire, etc.)
- Ordre d'affichage des contacts non-principaux (alphabétique? ordre création?)

</decisions>

<specifics>
## Specific Ideas

**Exemples concrets créés pour testing:**
- **Mélodie Productions SAS** (entreprise) - 4 contacts: Philippe Moreau (PDG), Sophie Laurent (Dir. Artistique), Marc Dubois (Booking), Isabelle Bernard (CFO)
- **Midnight Groove Collective** (groupe musical) - 6 musiciens: Thomas Bellamy (Chanteur), Julie Mercier (Guitare), Antoine Rousseau (Basse), Marie Durand (Batterie), Lucas Fontaine (Claviers), Sarah Morel (Saxo)

**Workflow attendu:**
- User voit "4 contacts" dans Table/Grid → rapide scanning
- User passe en Kanban → voit tous les détails des 4 contacts
- User clique email → ouvre client email OU copie avec icône
- User identifie rapidement contact principal avec ⭐

</specifics>

<deferred>
## Deferred Ideas

Aucune - Discussion restée dans le scope (avec élargissement accepté pour icônes copier générales).

</deferred>

---

*Phase: 20-affichage-contacts-multiples-entreprises*
*Context gathered: 2026-01-16*
