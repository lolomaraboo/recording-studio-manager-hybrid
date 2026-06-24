# Audit de sécurité — Version web RSM (v2, audit complet refait)

**Date :** 2026-06-11 (remplace le rapport du matin même)
**Périmètre :** `packages/server` (Express, tRPC 11, express-session/Redis, routes sync/upload/oauth/webhooks, portail client) et `packages/client` (React 19, Vite). Dépendances (pnpm audit) et infra (nginx, docker-compose) incluses.
**Complément :** `apps/macos/SECURITY-AUDIT.md` pour l'app native.

---

## ⚠️ FINDING N°0 — Le working tree est incohérent par rapport à HEAD (BLOQUANT)

Avant toute considération de sécurité classique : **~12 000 lignes de diff non commitées** entre le working tree et HEAD (`ed00429`, 2026-01-22). Le `index.ts` actuel du working tree est une version **régressée/simplifiée** (166 lignes vs ~340 dans HEAD) qui a perdu :

- le montage de **`/api/sync`** et **`/api/oauth`** (fichiers `routes/sync.ts` et `routes/oauth.ts` présents mais **jamais montés** → la sync macOS répondrait 404) ;
- **Socket.IO** + son middleware d'auth, le SSE notifications, `trust proxy`, le typage de session, l'init RAG/Qdrant ;
- côté client, les pages du portail (`Bookings.tsx`, `ClientInvoices.tsx`, etc.) destructurent `sessionToken` depuis un contexte qui **ne l'expose plus** → deux générations de code mélangées, `pnpm check` probablement KO.

Conséquence : selon ce qui sera commité/déployé, les findings ci-dessous s'appliquent différemment (marqués **[WT]** working tree, **[HEAD]** version commitée, **[2]** les deux). **Reco : trancher la version canonique, committer, puis re-vérifier les findings marqués.**

---

## Synthèse

| Sévérité | Nombre |
|---|---|
| Bloquant (cohérence du code) | 1 |
| Élevé | 6 |
| Moyen | 7 |
| Faible/Info | 6 |

Points positifs confirmés : bcrypt pour tous les mots de passe, isolation tenant par base physique (org issue de la session, jamais du client), Drizzle paramétré, whitelists table+colonne sur l'API sync, signature Stripe vérifiée avec raw body et secret obligatoire, nginx avec HSTS/CSP/X-Frame-Options, plus de `dangerouslySetInnerHTML`, plus de headers `x-test-*` dans `main.tsx` [WT], plus de token en `localStorage` [WT].

---

## ÉLEVÉ

### E1 — [WT] Toutes les routes d'upload sont non authentifiées (régression)
`routes/upload.ts` : `POST /audio` (100 Mo), `DELETE /audio/:publicId(*)` et `POST /logo` n'ont **aucune** vérification de session. Le rapport précédent notait l'audio seul non protégé ; dans le working tree, les gardes des routes image ont disparu aussi. Le DELETE par `publicId` arbitraire permet à **n'importe qui de supprimer n'importe quel asset Cloudinary** du compte.
**Reco :** middleware `requireSession` sur tout le router + vérifier que le `publicId` appartient au tenant ; rate-limit.

### E2 — [2] Secret de session avec fallback faible
`index.ts` : `secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production'`. De plus, le `.env` local contient des placeholders (`SESSION_SECRET=chan...`, `JWT_SECRET=chan...`). Si jamais déployé tel quel → forge de cookie de session, usurpation de n'importe quel compte.
**Reco :** `throw` au démarrage si `NODE_ENV==='production'` et secret absent/placeholder. Idem `GOOGLE_CLIENT_SECRET` (fallback `""` dans `oauth.ts`).

### E3 — [HEAD] Cookie `secure: false` codé en dur + logs des bodies tRPC
La version commitée a toujours `secure: false` (ISSUE-011) **et** le middleware debug qui `console.log(req.body)` sur chaque requête `/api/trpc` → **mots de passe en clair dans les logs** (`auth.login`). Le working tree corrige les deux (`secure: NODE_ENV==='production'`, plus de log) — mais ce correctif n'est **pas commité**.
**Reco :** committer la config cookie du WT (en y rajoutant `sameSite: 'lax'` et `trust proxy`, perdus dans la régression) ; supprimer définitivement le log debug de HEAD.

### E4 — [2] Tokens du portail client stockés en clair en DB
`routers/client-portal-auth.ts` : magic links, tokens de session (7 j) et tokens de reset sont stockés **en clair** et comparés par égalité (`eq(table.token, input.token)`). Une lecture de la DB (backup, injection, accès interne) donne des sessions et resets utilisables directement. Les tokens transitent aussi **en paramètre de mutation** (body JSON) → susceptibles d'apparaître dans des logs.
**Reco :** stocker `sha256(token)` ; côté transport, finir la migration vers cookie httpOnly (le contexte client est déjà passé au modèle cookie, mais les pages et une partie des procédures attendent encore `sessionToken` en paramètre — cf. Finding 0).

### E5 — [2] Aucun rate limiting sur l'authentification
`auth.login`, `register`, magic links et reset : aucune limitation. `checkRateLimit` existe (`utils/client-portal-auth.ts:230`) mais n'est **appelé nulle part**. Bruteforce et spam d'e-mails (magic link/reset) possibles. nginx ne fait pas non plus de `limit_req` sur `/api`.
**Reco :** `express-rate-limit` sur `/api/trpc/auth.*` + `/api/auth/*` + magic links ; lockout progressif par compte.

### E6 — [2] Dépendances : 23 vulnérabilités dont 12 high (pnpm audit --prod)
Les plus pertinentes pour ce code : **drizzle-orm** (SQLi via `sql.identifier` mal échappé — `routes/sync.ts` utilise précisément `sql.identifier()` ; la whitelist `SYNCED_TABLES` limite fortement l'exploitabilité, mais l'upgrade s'impose), **multer** (DoS — utilisé par les uploads non authentifiés d'E1, combinaison aggravante), **socket.io-parser** (attachements binaires non bornés), **path-to-regexp** (ReDoS), **react-router** (XSS via open redirect), **lodash `_.template`**.
**Reco :** `pnpm update` ciblé sur drizzle-orm, multer, socket.io, react-router en priorité.

---

## MOYEN

### M1 — [2] CORS : requêtes sans `Origin` toujours acceptées + patterns dev en prod
`if (!origin) return callback(null, true)` avec `credentials: true`, et les patterns `localhost`/`127.0.0.1`/`192.168.x.x` sont acceptés quel que soit `NODE_ENV`.
**Reco :** restreindre les patterns dev hors production ; HEAD a en plus `ALLOWED_ORIGINS` env (perdu dans le WT) — à conserver.

### M2 — [2] Pas de régénération de session au login (fixation) et identité de session incomplète
`auth.login` ne fait pas `req.session.regenerate()`. Par ailleurs le login ne stocke que `userId`/`organizationId`, alors que `context.ts` lit `session.email`/`session.role` (jamais renseignés) → `role` retombe sur `'user'` et `email` sur `'user@example.com'`. Résultat : `adminProcedure` et le middleware superadmin (comparaison à `SUPERADMIN_EMAIL`) **refusent tout le monde** — fail-closed, donc pas d'escalade, mais le contrôle d'accès par rôle est de facto inopérant et fragile.
**Reco :** `regenerate()` au login ; charger rôle/email depuis la master DB dans `createContext` plutôt que depuis la session.

### M3 — [2] API sync : `created_by`/`updated_at` non protégés (connu, I1 macOS)
`PROTECTED_COLUMNS = {id, sync_version, created_at}` seulement. Un membre peut pousser un `created_by` arbitraire → falsification d'attribution dans le tenant.
**Reco :** forcer `created_by = req.syncUserId` côté serveur (1 ligne) et ajouter `updated_at` si géré par trigger.

### M4 — [2] OAuth : cookie d'état non signé → login CSRF
Le state (+ verifier PKCE) est un JSON base64url **non signé** dans un cookie. Un attaquant peut forger cookie+state cohérents et faire aboutir un callback dans le navigateur de la victime → connexion de la victime au compte de l'attaquant (login CSRF). Signature des id_tokens non vérifiée (acceptable : reçus du token endpoint en TLS, claims iss/aud/exp validés — documenté dans le code).
**Reco :** signer le cookie d'état (HMAC avec SESSION_SECRET) ou le stocker en session. NB : router actuellement non monté [WT].

### M5 — [HEAD] Bypass d'auth dev via query params sur le SSE notifications
`/api/notifications/stream` accepte `?userId=&orgId=` si `NODE_ENV==='development'`. Même classe de risque que les headers `x-test-*` de `routes/sync.ts` : inoffensif tant que `NODE_ENV` prod est correct, mais c'est un point de défaillance unique.
**Reco :** garde supplémentaire (ex. `ENABLE_DEV_AUTH=1` explicite) et assertion au démarrage en prod.

### M6 — [2] `/api/ai/stream` sans authentification
Placeholder (TODO Phase 2.3). À sécuriser avant toute implémentation réelle ; aujourd'hui surface minime.

### M7 — [WT] `trust proxy` et `sameSite` perdus
Sans `app.set('trust proxy', 1)`, `secure: true` derrière nginx fait que le cookie n'est **jamais posé** en prod (Express croit être en HTTP) → soit panne de login, soit tentation de remettre `secure:false`. `sameSite` non défini explicitement.
**Reco :** restaurer `trust proxy` + `sameSite: 'lax'` (présents dans HEAD).

---

## FAIBLE / INFO

- **F1 — [HEAD]** `express.json({ limit: '10mb' })` global (surface DoS) ; le WT est repassé à 100 ko par défaut, ce qui **cassera l'import vCard/Excel** (BUG-005 reviendra). Reco : limite basse globale + exception ciblée sur les routes d'import.
- **F2 — [2]** Énumération d'utilisateurs : `register` répond "User already exists" ; timing différent sur `login` selon existence du compte. Mineur.
- **F3 — [2]** Logs verbeux (IDs, payloads sync, `[Upload] File`, e-mails OAuth). Reco : logger structuré + masquage.
- **F4 — [2]** `VITE_SUPERADMIN_EMAIL` embarqué dans le bundle client (divulgation d'une adresse cible). Le contrôle réel est serveur — OK — mais inutile d'exposer l'e-mail.
- **F5 — [2]** CSP nginx avec `'unsafe-inline'` + `'unsafe-eval'` sur `script-src` — affaiblit la CSP ; à durcir quand Vite le permet (nonces/hashes).
- **F6 — [2]** Logout : `clearCookie("connect.sid")` sans options de path/domain identiques — le cookie peut survivre selon la config. Session détruite côté Redis donc impact faible.

### Points vérifiés sans problème
Webhook Stripe (raw body + signature + secrets obligatoires, fail-fast) ; isolation tenant de l'API sync (org depuis la session, whitelists table/colonne, UUID regex, conflits par `sync_version`) ; pas de `dangerouslySetInnerHTML` ni `innerHTML` dans le client ; aucun secret réel commité (seulement `.env.example` ; `docker-compose.production.yml` utilise des variables d'env) ; en-têtes de sécurité présents dans nginx (HSTS, XCTO, XFO, CSP, Referrer-Policy).

---

## Plan de remédiation priorisé

1. **Finding 0** : réconcilier working tree vs HEAD (décider, committer) — tout le reste en dépend.
2. **E1** : auth sur `routes/upload.ts` (POST + DELETE + logo).
3. **E2/E3/M7** : config session unifiée (`secure` prod, `sameSite lax`, `trust proxy`, fail-fast sur secrets, suppression du log debug tRPC de HEAD).
4. **E5** : rate limiting auth + magic links.
5. **E4** : hash des tokens portail en DB + fin de migration vers cookies httpOnly.
6. **E6** : upgrade drizzle-orm, multer, socket.io, react-router.
7. **M1–M4** : CORS, regenerate session + rôle depuis la DB, `created_by` serveur, signature du state OAuth.
