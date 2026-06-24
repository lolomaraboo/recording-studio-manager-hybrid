# M2 → M5 — SUMMARY

**Date :** 2026-06-11
**Statut :** ✅ TERMINÉS — app packagée `RSM Studio.app` validée avec données réelles

## M2 — Connexion par compte

- `AuthService.swift` : login via le tRPC existant (`POST /api/trpc/auth.login`), cookie `connect.sid` stocké par URLSession et **persisté dans le Keychain** (survit au relancement). Logout, restauration au démarrage, probe de validité de session.
- `LoginSheet` + section Compte dans Réglages (connecté en tant que / studio / déconnexion). Le mode dev (en-têtes de test) reste disponible.
- Changement d'organisation au login → reset automatique du cache local (autre tenant).
- Édition de fiche client (`ClientEditSheet`) : nom, artiste, email, téléphone, ville, notes, VIP.
- **Fix serveur important** : pull avec `cursor=0` = **snapshot complet** (les lignes créées avant l'upgrade sync n'ont pas d'entrée `sync_log` et n'auraient jamais été synchronisées).

## M3 — Sessions

- Liste groupée par jour (fr), avec nom du client et de la salle (lookup par id serveur), badges de statut (programmée/en cours/terminée/annulée/conflit) et type de réservation (Horaire/Journée/Lockout/Location sèche — colonnes M0).
- Création de session : client, salle, type, début, durée. Annulation et suppression par menu contextuel. Offline-first.
- **Limitation documentée** : une session ne peut référencer que des clients/salles déjà synchronisés (FK = id serial serveur). La migration des FK vers les uuid réglerait ça à terme.
- Staff : table `session_staff` synchronisée mais affichage/assignation reportés (les utilisateurs vivent en master DB, non synchronisée).

## M4 — Projets & Factures

- Projets : liste (type, client, badge statut de prod), détail avec tracks ordonnées (n°, BPM, tonalité, badge statut) et politique de révisions (`included_revisions` M0).
- Factures : liste (n°, client, total, badge), détail avec lignes et totaux TVA, **export PDF** (Core Graphics A4, NSSavePanel).
- Création de facture volontairement absente : la numérotation est serveur (plan §4.4).

## M5 — Packaging

- `apps/macos/scripts/make-app.sh` : build release → bundle `dist/RSM Studio.app` (Info.plist, icône générée par `make-icon.swift` — barres d'onde audio, icns complet) → `xattr -cr` → codesign **ad-hoc**.
- Distribution publique (plus tard) : certificat Developer ID + notarisation + Sparkle (nécessite une URL d'hébergement pour l'appcast).

## Validation

- `swift build` + `swift test` : 7/7 (E2E live inclus) après chaque milestone.
- App packagée lancée : sync complète vérifiée dans sa base locale — clients 3, rooms 2, sessions 3 (dont lockout), projects 1, tracks 3, invoices 1, invoice_items 2.
- Login testé par curl : cookie de session accepté par l'API sync sans en-têtes dev.

## Reste à faire (post-M5)

1. Calendrier visuel (grille semaine/mois), assignation staff, détection de conflits de salle côté serveur au push
2. Cycle de révisions tracks (UI sur `track_revisions`) + portail client (boutons Approuver/Modifier)
3. Création de devis/factures côté Mac (numérotation serveur à la sync, état "brouillon local")
4. Temps réel : bridge `LISTEN rsm_sync` → Socket.IO → l'app (aujourd'hui poll 60 s)
5. Distribution : Developer ID, notarisation, Sparkle
6. Migration FK serial → uuid pour lever la limitation des références offline
