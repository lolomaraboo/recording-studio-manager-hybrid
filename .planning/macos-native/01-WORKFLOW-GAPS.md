# Analyse d'écarts — Workflow studio vs application actuelle

**Date :** 2026-06-11
**Contexte :** Validation du workflow type avant le portage macOS. Exigences confirmées avec Lolo : acomptes variables selon client, planification du staff essentielle, tous types de réservation (app multi-studios → tout prévoir), cycle de révisions structuré.

## Workflow type couvert

Demande → Devis → Acceptation/Contrat/Acompte → Réservation → Préparation → Session → Production → Livraison/Validation → Facturation → Gestion. Les 10 étapes existent dans l'app ; les écarts ci-dessous portent sur la profondeur de certaines étapes.

## ✅ Déjà couvert (vérifié dans le schéma)

| Exigence | Support actuel |
|---|---|
| Acomptes variables | `sessions.depositAmount/depositPaid/paymentStatus` + `invoices.depositAmount/depositPaidAt/remainingBalance` + Stripe PI dédié. Nullable = pas d'acompte. Le flux acompte → solde existe. |
| Workflow devis | FSM 7 états (`draft`→`sent`→`accepted`→…→`converted_to_project`), expiration, conversion en projet |
| Retours client sur tracks | `trackComments` |
| Versions de production | 4 URLs fixes sur `tracks` (demo/roughMix/finalMix/master) |

Amélioration mineure possible : politique d'acompte par défaut par client (`clients.defaultDepositPercent`) pour distinguer habitués/nouveaux automatiquement.

## ❌ Écarts confirmés

### GAP-1 — Planification du staff sur les sessions (exigence : essentielle)
`sessions` n'a **aucun** champ ingé/staff. `organizationMembers` (master) existe mais aucune assignation.

**À ajouter (tenant) :**
- Table `sessionStaff` : `sessionId`, `userId` (réf. master), `role` ("engineer" | "assistant" | "producer"), `status` ("assigned" | "confirmed" | "declined")
- Détection de conflits : un membre ne peut pas être sur 2 sessions qui se chevauchent (même logique que les salles)
- Vue calendrier filtrable par membre

### GAP-2 — Types de réservation (récurrence, lockout, location sèche)
`sessions` ne connaît que le créneau simple `startTime`/`endTime` (multi-jours techniquement possible mais sans sémantique).

**À ajouter sur `sessions` :**
- `bookingType` : "hourly" | "daily" | "lockout" | "dry_hire" (location sèche sans ingé) — impacte la tarification
- Récurrence : `seriesId UUID` + `recurrenceRule` (RRULE iCal) sur la session mère ; les occurrences sont des lignes réelles (modifiables/annulables individuellement, sync simple)
- Location de matériel seul : `dry_hire` avec lignes d'équipement loué (table `sessionEquipment` : `sessionId`, `equipmentId`, tarif)

### GAP-3 — Cycle de révisions structuré (V1 → retours → V2…)
Les 4 URLs fixes de `tracks` ne modélisent pas un cycle : pas d'historique de versions, pas de statut d'approbation, pas de compteur de révisions incluses au devis.

**À ajouter :**
- Table `trackRevisions` : `trackId`, `versionNumber`, `stage` ("mix" | "master"), `fileUrl`, `status` ("submitted" | "changes_requested" | "approved"), `clientFeedback`, `submittedAt`, `respondedAt`
- `projects.includedRevisions` (reporté depuis le devis) + compteur ; au-delà → révisions facturables
- Côté portail client web : bouton Approuver / Demander des modifications (lié à `trackComments`)
- Les 4 URLs existantes restent comme raccourcis vers la dernière version approuvée de chaque stage

## Intégration au plan macOS

Ces écarts sont des évolutions **backend + schéma** (profitent au web ET au Mac). Ils s'insèrent dans les phases du plan d'architecture :

| Gap | Phase | Raison |
|---|---|---|
| GAP-1 staff | **M0** (schéma) + M3 (UI calendrier Mac) | Le schéma sync doit inclure `sessionStaff` dès le départ |
| GAP-2 bookingType + récurrence | **M0** (schéma) + M3 (UI) | Idem — colonnes additives sur `sessions` |
| GAP-3 révisions | **M0** (schéma) + M4 (UI projets/tracks) | `trackRevisions` dans le périmètre sync V1 |

Conformément au pattern du projet : nouveau tenant de dev avec le schéma complet (sync + gaps), pas de migration réparatrice.

## Points restés ouverts (à trancher plus tard)

1. Relances automatiques de factures impayées (job serveur — indépendant du Mac)
2. Disponibilités/indisponibilités déclarées du staff (congés) — V2 du GAP-1
3. Tarification différenciée par `bookingType` dans `serviceCatalog`
