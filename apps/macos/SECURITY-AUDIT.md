# Audit de sécurité — RSM Studio (app macOS native)

**Date :** 2026-06-11
**Périmètre :** `apps/macos/RSMStudio` (Sources RSMCore + RSMStudio, 28 fichiers Swift), `scripts/make-app.sh`, bundle `dist/`, et le contrat serveur `packages/server/src/routes/sync.ts` pour valider les hypothèses d'authentification.

---

## Synthèse

L'app est saine dans ses fondamentaux : cookies de session en Keychain (jamais en UserDefaults), SQL local 100 % paramétré via GRDB, aucun secret hardcodé, aucun credential loggé, et le bypass dev (`x-test-user-id`) est correctement neutralisé côté serveur en production (`NODE_ENV === 'development'` requis). Les risques principaux concernent la **donnée au repos** (SQLite non chiffré) et la **posture de distribution** (signature ad-hoc, pas de sandbox ni notarisation).

| Sévérité | Nombre |
|---|---|
| Élevée | 2 |
| Moyenne | 3 |
| Faible | 3 |
| Info | 3 |

---

## Findings

### E1 — Base SQLite locale non chiffrée (ÉLEVÉ)

`LocalStore.swift` crée `~/Library/Application Support/RSMStudio/rsm.sqlite` sans chiffrement. Elle contient l'intégralité du cache tenant : clients (PII), factures, devis, tarifs horaires, notes. Tout processus ou utilisateur ayant accès au compte peut la lire avec `sqlite3`.

**Recommandation :** chiffrer avec SQLCipher (supporté nativement par GRDB via `Configuration.prepareDatabase { db in try db.usePassphrase(...) }`, passphrase stockée dans le Keychain). À minima : permissions `0600` sur le fichier et documentation exigeant FileVault.

### E2 — Signature ad-hoc, pas de Hardened Runtime, pas de sandbox, pas de notarisation (ÉLEVÉ)

`make-app.sh` signe avec `codesign --force --deep -s -` (ad-hoc). Le bundle n'a ni entitlements, ni App Sandbox, ni Hardened Runtime, ni notarisation. Conséquences : Gatekeeper contourné par « clic droit > Ouvrir » (habitue les utilisateurs à un geste dangereux), binaire substituable sans détection, aucune protection runtime (injection de dylib possible).

**Recommandation :** avant toute distribution hors de votre Mac — certificat Developer ID, `--options runtime` (Hardened Runtime), App Sandbox avec entitlements minimaux (`com.apple.security.network.client`), notarisation (`notarytool`). Déjà noté dans M5-SUMMARY ; à traiter comme bloquant de distribution.

### M1 — Keychain : accessibilité et atomicité non spécifiées (MOYEN)

`Keychain.swift` ne définit ni `kSecAttrAccessible` (défaut : `WhenUnlocked`, acceptable mais implicite) ni `kSecUseDataProtectionKeychain` (sur macOS, l'item part dans le keychain « file-based » legacy, accessible à d'autres apps via prompt). Le pattern delete-puis-add n'est pas atomique.

**Recommandation :** ajouter `kSecUseDataProtectionKeychain: true` et `kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` ; utiliser `SecItemUpdate` en fallback de `SecItemAdd` plutôt que delete+add.

### M2 — Restauration de cookies : expiration forcée et attributs perdus (MOYEN)

`AuthService.restoreCookies` recrée chaque cookie avec une expiration arbitraire de 7 jours et sans attributs `secure`/`httpOnly` d'origine. Un cookie serveur expiré est ainsi réinjecté localement (le serveur le rejettera, mais l'app croit la session valide jusqu'au 401), et le cookie recréé sans flag `secure` serait envoyé sur du HTTP si l'URL le permet.

**Recommandation :** persister aussi `expiresDate` et `isSecure` du cookie d'origine ; positionner `.secure` quand `baseURL` est en https.

### M3 — URL serveur libre, HTTP en clair possible hors bundle (MOYEN)

`SettingsView` accepte n'importe quelle URL (`http://` distant inclus). Dans le bundle, ATS protège (seule exception : `NSAllowsLocalNetworking`), mais lancée via `swift run` sans bundle, ATS ne s'applique pas → login (email + mot de passe) et cookie partiraient en clair vers un serveur distant en HTTP.

**Recommandation :** valider l'URL dans `SettingsView`/`ServerConfig` : refuser `http://` sauf pour localhost/127.0.0.1/réseau privé. Défense indépendante du mécanisme ATS.

### F1 — Lecture d'URL audio arbitraires issues des données serveur (FAIBLE)

`AppModel.loadPlayerAudio` construit `URL(string:)` depuis les champs `*_url` des tracks synchronisées et les charge dans `AudioEngine`/`WaveformGenerator`. Une donnée tenant malveillante (`file://...`) ferait lire un fichier local. Impact limité (lecture audio, pas d'exfiltration).

**Recommandation :** n'accepter que les schémas `https`/`http`.

### F2 — Corps de réponse serveur affiché brut dans l'UI (FAIBLE)

`APIError.http(code, body)` injecte le corps HTTP complet dans le message d'erreur utilisateur — fuite potentielle de détails internes (stack traces serveur).

**Recommandation :** tronquer/normaliser le message en production.

### F3 — Bundle obsolète dans dist/ (FAIBLE)

`dist/` contient `RSM Studio 2.app` (copie ancienne). Risque de lancer/distribuer un binaire périmé.

**Recommandation :** supprimer, et ajouter `dist/` au `.gitignore` si ce n'est pas déjà fait.

### I1 — `created_by` contrôlé par le client (INFO)

L'app envoie `created_by: config.userId` dans les payloads (`time_entries`). Côté serveur, la colonne passe le whitelist `information_schema` : un client authentifié peut attribuer une écriture à un autre membre de la même organisation. Portée limitée au tenant.

**Recommandation (côté serveur) :** forcer `created_by = req.syncUserId` dans `/api/sync/push`, ou l'ajouter à `PROTECTED_COLUMNS`.

### I2 — Pas de certificate pinning (INFO)

Standard pour un SaaS ; acceptable. À considérer seulement si le modèle de menace inclut des proxys TLS hostiles.

### I3 — GRDB vendored (INFO)

`vendor/GRDB.swift` figé localement : prévoir un suivi des versions (correctifs sécurité SQLite/GRDB).

---

## Points validés ✓

- Mot de passe jamais persisté ; saisi en `SecureField`, envoyé une fois au login, seul le cookie de session est conservé (Keychain).
- Aucun secret/credential hardcodé ; aucun `print`/`NSLog` de données sensibles.
- SQL local entièrement paramétré (GRDB `arguments:`) — pas d'injection.
- ATS du bundle : exception limitée à `NSAllowsLocalNetworking` (HTTPS exigé pour tout serveur distant).
- Bypass dev `x-test-user-id` inopérant contre un serveur en production (gated `NODE_ENV`).
- Côté serveur sync : whitelist de tables (`SYNCED_TABLES`), whitelist de colonnes, `PROTECTED_COLUMNS`, validation UUID, requêtes paramétrées.

## Priorités suggérées

1. **Avant distribution :** E2 (Developer ID + Hardened Runtime + sandbox + notarisation).
2. **Court terme :** E1 (SQLCipher), M3 (validation https), M1 (Keychain).
3. **Confort :** M2, F1–F3, I1 (fix serveur en 1 ligne).
