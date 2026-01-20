# Phase 25: Gestion Relations Client-Entreprise - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Implémenter l'UI complète pour gérer les relations many-to-many entre clients individuels et entreprises via la table `companyMembers`. Les studios doivent pouvoir lier des contacts individuels (ex: "Alexandre Grand - Ingénieur du son") aux entreprises clientes (ex: "Sound Production SARL") avec rôles et contact principal.

**Scope limité à :**
- Lier des clients EXISTANTS (pas de création de nouveaux clients dans ce flux)
- Gestion bidirectionnelle : entreprise → membres ET individuel → entreprises
- CRUD complet : ajouter, modifier rôle, retirer, marquer contact principal

</domain>

<decisions>
## Implementation Decisions

### UI - Placement et Layout

**Section dans "Informations" tab (symétrique) :**
- **Vue entreprise** : Section "Membres" après les coordonnées (téléphone, adresse, etc.)
- **Vue individuelle** : Section "Entreprises" après les coordonnées (placement identique)
- Pattern symétrique pour cohérence UX

**Indicateur cliquable :**
- Affichage : Compteur + aperçu nom/rôle
- Règle d'affichage :
  - Si ≤ 3 membres → Afficher tous ("3 membres : Alex (Ingénieur), Sophie (Prod), Marc (Manager)")
  - Si > 3 membres → Truncate ("5 membres : Alex (Ingénieur), Sophie (Prod)...")
- Clic ouvre modal avec liste complète

### UX - Interactions

**Ajouter un membre (vue entreprise) :**
1. Bouton "+ Ajouter" dans le modal
2. Dropdown searchable de tous les clients individuels
3. Après sélection → Champ rôle (texte libre avec autocomplétion basée sur rôles existants)
4. Checkbox "Contact principal" (isPrimary)
5. Validation ajoute le membre

**Ajouter une entreprise (vue individuelle) :**
- Pattern symétrique : indicateur → modal → dropdown searchable des entreprises + rôle

**Modifier un rôle :**
- Clic sur le texte du rôle dans le modal → inline editing
- Enter pour sauvegarder

**Retirer un membre/entreprise :**
- Icône poubelle sur chaque ligne
- Confirmation avant suppression définitive

### Content - Informations Affichées

**Dans le modal (liste complète) :**
- Nom du membre/entreprise
- Rôle (éditable inline)
- Badge si contact principal (isPrimary)
- Icône poubelle pour retirer
- **Format minimal** : Pas de téléphone/email/sessions/receivables

**Dans l'indicateur (aperçu) :**
- Format : "X membres : Nom (Rôle), Nom (Rôle)..."
- Tous les membres si ≤ 3, sinon truncate avec "..."

### Claude's Discretion

- Design exact du modal (largeur, hauteur, style)
- Animations de transition (apparition modal, inline edit)
- Messages de confirmation ("Retirer Alexandre de Sound Production ?")
- Gestion des erreurs API (membre déjà ajouté, rôle vide, etc.)
- Ordre d'affichage des membres (alphabétique ? contact principal en premier ?)

</decisions>

<specifics>
## Specific Ideas

- **Autocomplétion rôle** : Suggérer rôles existants dans la DB (éviter "Ingénieur du son" vs "Ingénieur Son" vs "Sound Engineer")
- **Pattern symétrique** : Même UX depuis vue entreprise et vue individuelle (cohérence)
- **Minimal content** : Épuré, juste nom + rôle + badge, pas surcharger avec stats business
- **Inline editing** : Modification rapide du rôle sans modal secondaire (UX fluide)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-gestion-relations-client-entreprise*
*Context gathered: 2026-01-20*
