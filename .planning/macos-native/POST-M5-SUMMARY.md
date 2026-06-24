# Post-M5 — Temps réel, calendrier, staff, révisions, factures, chatbot — SUMMARY

> **Mise à jour (même jour) — vague « il manque plein de trucs » :** ajout de
> **Devis** (création avec numérotation serveur `DEV-YYYY-NNNN` via
> `/api/sync/create-quote`, transitions de statut FSM, lignes), **Équipement**
> (inventaire CRUD, disponibilité), **Talents** (musiciens/intervenants CRUD),
> **Tableau de bord** (KPI CA encaissé/en attente, sessions à 7 jours,
> Swift Charts facturation par mois, listes prochaines sessions / factures à
> encaisser — 100 % offline) et **Recherche globale ⇧⌘F** (palette instantanée
> sur tout le cache local, navigation vers la section). Sidebar réorganisée en
> groupes (Activité / Ventes / Ressources). Au passage, `sync-upgrade.sql`
> gagne une section « catch-up » pour les tenants anciens (colonnes quotes
> FSM manquantes + colonnes legacy NOT NULL assouplies — découvert sur
> tenant_25). Sans écran dédié pour l'instant : contrats, dépenses,
> time-tracking, notifications, partages audio (données déjà synchronisées,
> écrans à ajouter à la demande).
>
> **Vague « tracks et le reste » — parité fonctionnelle quasi complète (17
> sections)** : section **Tracks** dédiée (liste globale + recherche, détail
> complet : métadonnées musicales/ISRC/compositeur, versions, crédits →
> talents, cycle de révisions, paroles, changement de statut, création),
> **Salles** (CRUD + tarifs), **Services** (catalogue CRUD),
> **Contrats** (liste, statuts, liens client/projet), **Dépenses** (CRUD,
> total, lien projet), **Équipe & Temps** (membres + entrées de temps).
> Recherche ⇧⌘F étendue aux tracks. Fiche client += contrats ; fiche projet
> += dépenses. Restent web-only : notifications push, partages/fichiers
> audio (stockage S3), invitations d'équipe, time-tracking actif (timer).
>
> **Vague S — Notifications natives + timer barre des menus** : la table
> `notifications` rejoint la sync (upgrade + whitelist) ; les nouvelles
> notifications déclenchent des **bannières macOS natives**
> (UNUserNotificationCenter, autorisation demandée au premier passage,
> amorçage silencieux au lancement pour éviter l'avalanche) + **cloche** dans
> la barre d'outils (badge non-lus, popover, clic → navigation vers
> client/projet/facture/session lié, marquage lu synchronisé). Et
> **MenuBarExtra** : icône onde dans la barre des menus macOS avec statut de
> sync, prochaine session, et **timer de time-tracking** (démarrage par type
> de tâche, chrono visible en barre des menus, arrêt → `time_entries`
> offline-first visible dans Équipe & Temps et côté web).
>
> **Time tracking façon Clockify + correction du bug de fond.** Le timer
> écrivait dans `time_entries` mais la **sync échouait silencieusement** : la
> table exige `task_type_id` (NOT NULL FK), `hourly_rate_snapshot` (NOT NULL)
> et une contrainte CHECK `check_session_or_project_or_track` (lien obligatoire
> vers track/session/projet). `recordEntry` fournit désormais les trois. La
> section **Temps** (TimeTrackingView) propose une barre Clockify : sélection
> en **deux étapes projet → track** (gérable avec beaucoup de tracks), bouton
> **+** pour créer une track dans le projet (la track porte son `project_id`,
> ce qui satisfait la contrainte), type de tâche porteur du tarif, chrono live,
> entrées groupées par jour avec total et **montant facturable** (durée ×
> tarif). Types de tâche par défaut seedables (Enregistrement/Mix/Mastering/
> Édition/Pause). Validé : entrées affichées avec montants (210 € / 3h).
>
> **Décloisonnement (navigation croisée)** : `AppModel.open(section, entity:)`
> + sections « données liées » cliquables dans chaque fiche. Client → ses
> projets/sessions/devis/factures ; Projet → client, sessions, tracks, talents
> crédités (via track_credits), devis d'origine ; Session (clic) → fiche avec
> liens client/projet/salle + staff + matériel réservé ; Équipement → sessions
> qui l'utilisent ; Talent → projets crédités ; Devis/Facture → client et
> projet. La recherche ⇧⌘F sélectionne directement l'entité trouvée.
> Composants réutilisables : `RelatedSection`, `EntityLink` (RelatedViews.swift).
>
> **Assistant multi-présentation** (parité app web) : conversation unique
> partagée (`ChatStore`) entre 4 modes — pleine page (sidebar), **panneau
> latéral droit** (`.inspector`, ⇧⌘A), **fenêtre séparée** (`Window` scene,
> ⌥⌘A), et **bulle flottante** en bas à droite quand l'assistant est masqué
> (style web). Menu ✨ dans la barre d'outils pour basculer.

**Date :** 2026-06-11
**Statut :** ✅ TERMINÉ — tout validé en conditions réelles sur l'app packagée

## Serveur

| Ajout | Détail |
|---|---|
| **Temps réel** | `LISTEN rsm_sync` par tenant (lazy, `getTenantSql`) → SSE `GET /api/sync/events` (Macs) + Socket.IO `sync:dirty` (web). Chaîne complète : écriture SQL → trigger pg_notify → SSE → sync app en ~2 s. |
| **Conflits de salle** | Au push, une session qui chevauche une autre session active de la même salle passe en `status='conflict'` (plan §4.4) ; tous les appareils la voient via pull. |
| **`POST /api/sync/create-invoice`** | Création de facture **online-only** avec numérotation serveur séquentielle `FAC-YYYY-NNNN` + lignes, atomique. |
| **`GET /api/sync/members`** | Membres de l'organisation (master DB : owner + organization_members) pour l'assignation staff. |
| **Fix sync-upgrade.sql** | Les 9 tables non synchronisées (ai_*, client_portal_*, notifications, …) reçoivent aussi `sync_uuid`/`sync_version` — schema.ts les déclare partout, leurs inserts Drizzle cassaient sinon (découvert via le chatbot). |

## App Mac

| Ajout | Détail |
|---|---|
| **🤖 Assistant IA** (écran d'accueil) | `ChatView` branchée sur le tRPC `ai.chat` existant (RAG Qdrant + actions métier). Conversation multi-tours (sessionId), suggestions, bulles, resync auto après réponse (l'IA peut modifier des données). Testé : « Combien de clients ai-je ? » → appel `get_all_clients` → réponse correcte avec les 3 clients. |
| **Temps réel** | `SyncEventsListener` (SSE, reconnexion backoff). Le poll 60 s devient un filet de sécurité. Validé : modif SQL visible dans l'app en ~3 s sans action. |
| **Calendrier semaine** | Grille 7 jours × 8h-22h, blocs colorés par salle, lockouts multi-jours tronqués par jour, badge ⚠ sur les conflits, navigation ◀ Aujourd'hui ▶. |
| **Staff** | Menu contextuel « Staff… » sur une session → assignés (rôle, retrait) + assignation membre/rôle. Cache membres rafraîchi à chaque (re)connexion. |
| **Révisions de tracks** | Dans le détail projet : disclosure par track → liste V1, V2… (stage, statut, feedback), boutons Approuver / Retours, « Nouvelle version » avec numérotation auto et marquage facturable au-delà de `included_revisions`. |
| **Création de facture** | Sheet client + lignes dynamiques + totaux TVA ; appelle `create-invoice` (numéro serveur) puis pull. Message clair si hors ligne. |

## Validation

- `swift build` + `swift test` 7/7 ; `pnpm check` exit 0 ; vitest sync 4/4
- App repackagée (`make-app.sh` corrigé : assemblage+signature dans /tmp car Documents/iCloud ré-ajoute des xattrs refusés par codesign) et relancée
- Temps réel et chatbot vérifiés en réel sur l'app packagée

## Volontairement non fait

1. **Developer ID + notarisation + Sparkle** : nécessite ton compte Apple Developer (99 $/an). La signature ad-hoc actuelle suffit pour ce Mac et le clic-droit > Ouvrir ailleurs. Quand tu auras le compte : `codesign -s "Developer ID Application: …"` + `notarytool` + appcast Sparkle.
2. **Migration FK serial → uuid** : changement lourd touchant 30 routeurs web + le portail. À planifier comme un milestone dédié avec migration progressive — pas à la fin d'un marathon. Conséquence actuelle (acceptable) : les références entre objets créés hors ligne attendent une première sync.
3. **Boutons Approuver/Retours côté portail client web** : le studio gère les retours dans l'app Mac ; l'exposition au client final dans le portail web est une itération web à part.
