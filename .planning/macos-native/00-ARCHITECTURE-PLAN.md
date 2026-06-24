# Plan d'architecture — Application macOS native (SwiftUI)

**Date :** 2026-06-11
**Statut :** Proposition — à valider avant implémentation

## 1. Décisions actées

| Décision | Choix |
|---|---|
| Technologie UI | SwiftUI natif (pas Electron, pas Tauri) |
| Utilisateurs | Les studios clients du SaaS (multi-tenant conservé) |
| Frontend web | **Conservé** — coexistence permanente web + app macOS (décision 2026-06-11) |
| Backend | **Conservé** (obligatoire : multi-tenant + multi-postes) |
| Multi-postes | Oui — plusieurs Macs par studio |
| Hors-ligne | Critique → architecture **local-first avec synchronisation** |

**Positionnement :** le web reste l'accès universel (navigateur), l'app macOS devient l'expérience premium offline. Le serveur Express/tRPC et les bases PostgreSQL par tenant restent l'unique source de vérité ; les deux frontends convergent dessus. Conséquence M0 : les routeurs tRPC existants doivent renseigner `uuid`/`version`/`updated_at` à chaque écriture pour que les modifications web soient visibles des Macs.

**Restent en web (ne pas porter en SwiftUI) :**
- **Portail client** (`client-portal/*`) : les clients finals des studios ne vont pas installer une app Mac. Le portail web reste tel quel.
- **SuperAdmin** : usage interne ponctuel, le web suffit.
- **Gestion d'abonnement SaaS** (`subscriptions`, Stripe) : l'app ouvre le portail de facturation Stripe dans le navigateur — pas d'IAP Apple.

## 2. Vue d'ensemble

```
┌─────────────── Mac du studio (×N postes) ───────────────┐
│  App SwiftUI                                            │
│  ├── UI (features modulaires)                           │
│  ├── Store local SQLite (GRDB) ← source de vérité UI    │
│  └── SyncEngine (push/pull + temps réel)                │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS (API sync) + WebSocket
┌───────────────────────▼─────────────────────────────────┐
│  Backend existant (Express, conservé)                   │
│  ├── Nouvelle API REST de sync (/api/sync/*)            │
│  ├── tRPC existant (conservé pour portail web)          │
│  ├── Socket.IO (déjà en place) → notifications de sync  │
│  └── PostgreSQL : rsm_master + tenant_N                 │
└─────────────────────────────────────────────────────────┘
```

## 3. Stack côté Mac

| Composant | Choix | Justification |
|---|---|---|
| Cible | macOS 14+ (Sonoma) | SwiftUI mature (NavigationSplitView, Observation) |
| Persistance | **GRDB.swift** (SQLite) | Contrôle total du schéma sync (uuid, version, tombstones) — SwiftData trop opaque pour du sync custom |
| Réseau | URLSession + async/await | Natif, suffisant |
| Temps réel | socket.io-client-swift | Le backend utilise déjà Socket.IO |
| Auth | JWT access/refresh dans le **Keychain** | Standard |
| Diagrammes/graphes | Swift Charts | Pour Analytics/Reports |
| Distribution | Developer ID + notarisation + **Sparkle** (MAJ auto) | Hors App Store = pas de review, mises à jour rapides |

Structure Xcode : un projet + packages SPM locaux — `RSMModels`, `RSMDatabase` (GRDB), `RSMSync`, `RSMAPI`, puis un module UI par feature.

## 4. Synchronisation (le cœur du chantier)

### 4.1 Pourquoi pas tRPC depuis Swift
tRPC est TypeScript-natif ; pas de client Swift sérieux. On ajoute au serveur une **API REST de sync dédiée** (`/api/sync/*`), petite et stable. Le tRPC existant reste pour le portail web.

### 4.2 Protocole (delta sync par curseur)
- `POST /api/sync/pull` : `{ cursor }` → toutes les lignes modifiées depuis le curseur (par table), incluant les suppressions (tombstones), + nouveau curseur.
- `POST /api/sync/push` : lot de mutations locales `{ table, op, uuid, payload, baseVersion }` → le serveur applique, renvoie conflits éventuels.
- Socket.IO émet `sync:dirty` aux autres Macs du tenant → ils déclenchent un pull. Sinon pull périodique (60 s) + au foreground.

### 4.3 Modifications de schéma requises (côté tenant)
Pour chaque table synchronisée, ajouter :
- `uuid UUID UNIQUE` — identité globale (les ids `serial` actuels ne marchent pas offline : deux Macs créeraient le même id)
- `updated_at` (déjà présent sur la plupart des tables), `deleted_at` (soft delete / tombstone)
- `version INTEGER` — incrémenté à chaque écriture serveur, base de la détection de conflit

Conformément au pattern dev du projet : **nouveau tenant** avec le schéma enrichi, pas de réparation de migrations.

### 4.4 Conflits et règles métier
- Stratégie générale : **last-write-wins par ligne** (suffisant pour un studio : faible concurrence d'écriture sur une même fiche).
- **Numérotation des factures/devis : toujours côté serveur.** Offline, une facture est créée en `draft` avec uuid ; le numéro définitif est attribué à la première sync. L'UI l'affiche clairement (« Brouillon — non synchronisé »).
- **Réservations de salles (sessions)** : conflit de créneau possible offline. Le serveur valide à la sync ; en cas de chevauchement, la session passe en état `conflict` et l'app la signale.
- Paiements Stripe, envoi d'emails, IA : **online uniquement** (actions, pas des données).

### 4.5 Fichiers audio
Les fichiers (AudioFiles, Shares) ne passent pas par la sync SQLite : upload/download direct via le backend, métadonnées synchronisées, cache local LRU.

## 5. Périmètre fonctionnel

Cartographie des 30 routeurs / ~33 tables tenant. Proposition de découpage :

### V1 — MVP (cœur métier quotidien)
| Module | Tables principales |
|---|---|
| Auth + choix d'organisation | users, organizations (master) |
| Clients (vCard, types individual/company) | clients, clientNotes, clientContacts, companyMembers |
| Calendrier + Sessions | sessions, rooms |
| Salles | rooms |
| Projets & Tracks | projects, tracks, trackComments, trackCredits |
| Devis & Factures (avec TVA) | quotes, quoteItems, invoices, invoiceItems, vatRates, payments |
| Tableau de bord | agrégats locaux |

### V2
Équipement, Talents/Musiciens, Contrats, Dépenses, Catalogue de services, Time-tracking, Notifications, Recherche globale (locale, instantanée — gros avantage natif).

### V3
Analytics/Reports (Swift Charts), Chat IA (online only), Partages/AudioFiles, Team/Invitations, Préférences avancées.

## 6. Phases de réalisation

| Phase | Contenu | Livrable |
|---|---|---|
| M0 | API sync côté serveur + schéma tenant enrichi (uuid/version/deleted_at) + tables workflow (sessionStaff, trackRevisions, bookingType/récurrence — voir 01-WORKFLOW-GAPS.md) + nouveau tenant de dev | Endpoints pull/push testés (Vitest) |
| M1 | Squelette app : projet Xcode, GRDB, auth Keychain, SyncEngine pull/push, NavigationSplitView | App vide qui synchronise les clients |
| M2 | Module Clients complet (liste, détail, création, import vCard natif via Contacts.framework) | Premier module utilisable |
| M3 | Calendrier + Sessions + Salles (EventKit optionnel plus tard) | Planning offline |
| M4 | Projets/Tracks, puis Devis/Factures (PDF natif via PDFKit) | MVP complet |
| M5 | Polish natif : menu bar, raccourcis ⌘, Spotlight, notifications, Sparkle, notarisation | Distribution beta |

M0 est le prérequis de tout : tant que l'API sync n'existe pas, l'app Mac n'a rien à consommer.

## 7. Risques et points ouverts

1. **Effort de réécriture UI** : ~50 écrans web → SwiftUI. Même en MVP, c'est le poste de coût dominant. Le périmètre V1 ci-dessus est à valider.
2. **Migration des ids serial → uuid** : touche le serveur existant ; à faire proprement en M0 (colonnes additives, pas de breaking change pour le portail web).
3. **Coexistence permanente web + Mac** : les deux écrivent dans les mêmes tenants. La sync doit être additive et compatible, et les écritures tRPC doivent émettre `sync:dirty` via Socket.IO pour rafraîchir les Macs en temps réel.
4. **App Store ou non** : recommandation Developer ID + Sparkle (modèle SaaS avec abonnement Stripe existant → éviter la commission et les règles IAP d'Apple).
5. **Choix non tranché** : GRDB vs SwiftData. Recommandation ferme pour GRDB tant que la sync est custom.
