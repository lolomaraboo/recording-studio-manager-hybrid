# RSM — Divergences App Web ↔ App macOS

> Audit comparatif des deux clients (web `packages/client` React/tRPC vs macOS `apps/macos` SwiftUI), sur backend partagé.
> Objectif : cartographier les écarts **avant** d'entamer tout travail de mise à niveau.
> Date : 2026-07-03.

---

## Résumé en une phrase

Les deux apps partagent le socle métier (clients, sessions, projets, tracks, devis, factures, salles, équipement, talents, services, dépenses, temps, analytics, assistant IA). **Le macOS a pris de l'avance sur toute la partie finance/workflow interne** (multi-devises, forfaits, avoirs, coupons, inventaire, livrables, splits, prospects, tâches, documents, hors-ligne, intégrations Mac). **Le web garde l'avance sur tout ce qui est tourné vers le client externe** (paiements Stripe, portail client, réservation en ligne, authentification complète) et sur deux détails de facturation (TVA par ligne, contrats éditables).

Autrement dit : il ne « manque pas beaucoup de choses » au macOS — la vraie question est **dans quel sens on veut aligner**.

---

## A. Présent côté WEB, absent (ou lecture seule) côté macOS

Ce sont les candidats si on veut enrichir le natif.

| Domaine | Web | macOS | Écart | Effort portage → macOS |
|---|---|---|---|---|
| Paiements Stripe (Checkout facture) | ✅ | ❌ | Encaissement en ligne | Élevé (clé Stripe, webhooks) |
| Portail client (login, factures, projets, paiements, profil) | ✅ | ❌ | Espace client externe | Élevé — par nature web |
| Réservation en ligne (salle + calendrier + acompte 30 %) | ✅ | ❌ | Prise de RDV self-service | Élevé — par nature web |
| Auth complète (register, OAuth, magic link) | ✅ | ⚠️ login seul | macOS = login + dev headers | Moyen |
| Contrats : création / édition | ✅ CRUD | ⚠️ lecture seule | macOS affiche mais ne crée pas | Faible/Moyen |
| **TVA par ligne** (taux différent par article) | ✅ | ⚠️ taux unique 20 % | Divergence réelle de facturation | Moyen |
| Gestion d'équipe (inviter, rôles) | ✅ | ⚠️ lecture seule | macOS renvoie vers le web | Moyen |
| Super-admin (services système, DB, logs) | ✅ | ❌ | Outillage interne | N/A (pas pertinent en natif) |
| Centre de notifications | ✅ | ⚠️ cloche seule | — | Faible |
| Dashboard à widgets déplaçables | ✅ | ⚠️ fixe | Cosmétique | Faible |
| Signature électronique des contrats | ✅ (prévu) | ❌ | — | Élevé |

---

## B. Présent côté macOS, absent côté WEB

Ce sont les candidats si on veut mettre le **web** au niveau (c'est ici que se trouve le plus gros du travail récent).

| Domaine | macOS | Web | Écart | Effort portage → web |
|---|---|---|---|---|
| **Multi-devises** (devise par client, héritée devis/factures, affichage par devise, PDF) | ✅ | ❌ EUR figé | Facturation internationale | Moyen |
| **Taux de change** (manuels + auto via API) + rapports convertis | ✅ | ❌ | — | Moyen |
| **Forfaits / heures prépayées** + déduction à la facturation | ✅ | ❌ | Modèle économique studio | Moyen |
| **Avoirs (notes de crédit)** | ✅ | ❌ | Comptabilité | Faible |
| **Coupons / codes promo** | ✅ | ❌ | Commercial | Faible |
| **Consommables / inventaire** (stock, seuil d'alerte) | ✅ | ❌ | Gestion stock | Faible |
| **Livrables** (masters/exports, statut livraison) | ✅ | ❌ | Suivi de prod | Faible |
| **Splits / crédits de royalties** sur tracks (% par contributeur, éditeur) | ✅ | ❌ | Droits musicaux | Moyen |
| **Prospects / leads** (pipeline, conversion en client) | ✅ | ❌ | CRM avant-vente | Faible/Moyen |
| **Tâches** (to-do liées projet/session/client) | ✅ | ⚠️ TaskTypes seul | Pilotage | Faible |
| **Documents** (bibliothèque de fichiers/liens) | ✅ | ❌ | — | Faible |
| **Disponibilités / indispos** (staff & talents) | ✅ | ❌ | Planning | Faible |
| Assistant IA — **écriture étendue** (créer dépenses, contrats, services, livrables, temps, MAJ statuts) | ✅ ~60 outils | ⚠️ ~8 actions | Le web IA crée seulement facture/client/session/salle/équipement/devis/projet/musicien | Faible (backend partagé, à exposer) |
| Export PDF de facture | ✅ (Core Graphics) | ⚠️ bouton TODO | À finir côté web | Faible |
| Conversion devis → facture qui **transporte la devise** | ✅ | ❌ | — | Faible |

---

## C. Fonctions natives macOS (non pertinentes pour le web)

Pas des « écarts » à combler : ce sont les atouts propres au natif.

- Mode **hors-ligne** avec synchronisation delta (pull/push, résolution de conflits).
- **Dictaphone** : enregistrement micro + transcription à la volée (Apple Speech, fr-FR).
- Transcription de **fichiers audio** importés (Voice Memos, pièces jointes Notes.app).
- Import **Contacts** macOS, lecture **Calendrier** + **Rappels** (EventKit).
- **Lecteur audio** multi-présentation (barre / panneau / fenêtre) avec commentaires horodatés.

---

## D. Divergences de comportement (même fonction, logique différente)

| Sujet | Web | macOS | Recommandation |
|---|---|---|---|
| Devise | EUR figé | Multi-devises complet | Porter le modèle macOS vers le web |
| TVA | Par ligne d'article | Taux unique par défaut | Porter le per-ligne vers macOS |
| Contrats | CRUD complet | Lecture seule | Ajouter création/édition macOS |
| Équipe | Gestion complète | Lecture seule | OK en l'état (invite = web) |
| Numérotation devis/factures/avoirs | Serveur | Serveur (identique) | Aligné ✅ |

---

## Recommandation de priorisation

**Si l'objectif est UNE expérience cohérente quel que soit le client utilisé :**

1. **Multi-devises sur le web** (P1) — c'est l'écart le plus visible côté facturation et le plus demandé à l'international. Le backend est déjà prêt (colonnes `currency` sur clients/devis/factures/dépenses, taux de change). Il « suffit » d'exposer devise à la création client + héritage + affichage.
2. **TVA par ligne sur macOS** (P1) — divergence comptable réelle, à corriger dans l'autre sens.
3. **Exposer les outils d'écriture de l'assistant + finir le PDF facture côté web** (P2) — quasi gratuit, backend partagé.
4. **Sections finance manquantes côté web** : avoirs, coupons, inventaire, livrables, forfaits (P2/P3) — chacune est petite isolément.
5. **Contrats éditables + prospects/tâches/documents/disponibilités côté web** (P3).
6. Le reste (paiements/portail/réservation) reste **web-only par nature** ; on ne les porte pas en natif.

**Si l'objectif est juste de finir le natif :** il ne reste presque rien d'essentiel (TVA par ligne + création de contrats). Le natif est déjà le client le plus complet.

---

## Note de méthode

Audit réalisé par exploration statique du code (pages web `packages/client/src/pages`, vues macOS `apps/macos/RSMStudio/Sources`) + vérification par recherche de mots-clés (`forfait`, `coupon`, `deliverable`, `splitPercent`, `currency`…). Certains détails d'implémentation peuvent mériter une vérification fine avant chiffrage définitif d'un lot.
