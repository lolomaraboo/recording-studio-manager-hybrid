# M1 — App macOS native (squelette + sync) — SUMMARY

**Date :** 2026-06-11
**Statut :** ✅ TERMINÉ — app compilée, testée et validée visuellement sur la machine de dev

## Livré

`apps/macos/RSMStudio/` — projet Swift Package (ouvrable directement dans Xcode : `open Package.swift`).

| Module | Fichiers | Rôle |
|---|---|---|
| RSMCore | `LocalStore.swift` | Cache SQLite (GRDB) : `rsm_rows` (documents JSON snake_case), `rsm_pending` (file de mutations offline), `rsm_meta` (curseur). Écritures locales = cache + mise en file. |
| RSMCore | `APIClient.swift` | Client REST `/api/sync/pull` + `/push` (auth dev par en-têtes ; Keychain prêt pour les tokens) |
| RSMCore | `SyncEngine.swift` | Actor : push file → pull delta ; conflits = serveur gagne ; sync périodique 60 s |
| RSMCore | `Models.swift`, `Keychain.swift` | Modèles typés (Client, StudioSession, Room) sur les rows JSON ; wrapper Keychain |
| RSMStudio | `RSMStudioApp.swift`, `ContentView.swift` | App SwiftUI, NavigationSplitView, ⇧⌘R sync, barre d'état sync |
| RSMStudio | `ClientsView.swift` | Liste + recherche + détail + création + suppression (offline-first) |
| RSMStudio | `SessionsView.swift`, `SettingsView.swift` | Sessions lecture seule (badges bookingType M0) ; réglages serveur/org, reset cache |
| Tests | `LocalStoreTests` (5), `SyncEngineIntegrationTests` (2) | Unitaires + E2E live |

**Dépendance :** GRDB 6.29.3 **vendored** dans `apps/macos/vendor/` (tarball de release, 9 Mo — le clone git de 600 Mo était inutilisable ; bonus : build hors-ligne).

## Validation

- `swift build` : ✅ (8,8 s)
- `swift test` : **7/7** dont E2E live contre le serveur + tenant_25 :
  insert local → push → un 2e « appareil » (2e store) reçoit le client par pull → update croisé → **conflit détecté, serveur gagne** → delete → tombstone reçu. File offline persistante vérifiée (serveur injoignable).
- App lancée : les 3 clients de démo insérés en SQL côté serveur sont apparus dans l'UI (capture : `m1-screenshot.png`). Curseur sync persistant.

## Lancer l'app

```bash
cd apps/macos/RSMStudio && swift run          # ou: open Package.swift (Xcode)
# Serveur requis: ./start.sh — Réglages dans l'app: URL/org/user (défaut localhost:3001, org 25)
```

## Reporté

- M2 : login par compte (cookie/token en Keychain) au lieu des en-têtes dev ; fiche client complète (vCard) ; édition
- M1+ : bridge `LISTEN rsm_sync` → Socket.IO → push temps réel vers l'app (actuellement poll 60 s + ⇧⌘R)
- M5 : bundle .app, icône, Sparkle, notarisation (aujourd'hui : binaire `swift run` sans bundle)
- Avertissements Sendable (`[String: Any]` dans types Sendable) — bénins en mode Swift 5, à nettoyer au passage Swift 6
