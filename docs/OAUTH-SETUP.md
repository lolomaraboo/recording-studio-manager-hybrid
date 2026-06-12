# OAuth Setup — Sign in with Google & Apple

Implémenté le 2026-06-11. Code : `packages/server/src/routes/oauth.ts` (serveur, zéro dépendance externe), `packages/client/src/components/auth/OAuthButtons.tsx` (boutons), table `oauth_accounts` (master DB).

## 1. Appliquer la migration (une seule fois)

```bash
# PostgreSQL natif :
psql -U postgres -d rsm_master -f packages/database/drizzle/migrations/master/0004_add_oauth_accounts.sql
# OU via Docker :
docker exec -i rsm-postgres psql -U postgres -d rsm_master < packages/database/drizzle/migrations/master/0004_add_oauth_accounts.sql
```

## 2. Google (testable en local immédiatement)

1. Va sur https://console.cloud.google.com/apis/credentials (crée un projet si besoin)
2. « Create Credentials » → « OAuth client ID » → type **Web application**
3. Si demandé, configure l'écran de consentement (External, nom de l'app, ton email — rien d'autre d'obligatoire)
4. **Authorized redirect URIs** — ajoute les deux :
   - `http://localhost:5174/api/auth/oauth/google/callback` (dev)
   - `https://recording-studio-manager.com/api/auth/oauth/google/callback` (prod)
5. Copie Client ID + Client Secret dans `packages/server/.env` :

```bash
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
APP_URL=http://localhost:5174   # déjà présent normalement
```

6. Redémarre le serveur → bouton « Continue with Google » fonctionnel sur /login et /register.

## 3. Apple (nécessite Apple Developer Program, 99 $/an — prod uniquement)

Apple refuse les redirect URIs en `http://localhost` : testable uniquement sur le domaine HTTPS de prod.

1. https://developer.apple.com/account → Certificates, Identifiers & Profiles
2. **Identifiers** → crée un **App ID** (ex. `com.recording-studio-manager.app`) avec capability « Sign In with Apple »
3. **Identifiers** → crée un **Services ID** (ex. `com.recording-studio-manager.web`) — c'est le `APPLE_CLIENT_ID`. Active « Sign In with Apple », Configure :
   - Primary App ID : l'App ID ci-dessus
   - Domain : `recording-studio-manager.com`
   - Return URL : `https://recording-studio-manager.com/api/auth/oauth/apple/callback`
4. **Keys** → crée une clé avec « Sign In with Apple » activé → télécharge le fichier `.p8` (une seule fois !) et note le **Key ID**
5. Le **Team ID** est en haut à droite de la page du compte
6. Dans `.env` de prod :

```bash
APPLE_CLIENT_ID=com.recording-studio-manager.web
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAg...\n-----END PRIVATE KEY-----"
# (contenu du .p8, retours à la ligne échappés en \n)
```

## Comportement

- **Compte existant avec le même email** → liaison automatique, l'utilisateur se connecte à son compte.
- **Nouvel utilisateur** → création user (sans mot de passe) + organisation « Studio de <prénom> » + base tenant, comme le register classique.
- **Erreurs** → redirection vers `/login?error=<code>`, toast affiché (codes : `cancelled`, `no_email`, `invalid_state`, `google_not_configured`, ...).
- Sécurité : state anti-CSRF + PKCE (Google), claims iss/aud/exp vérifiés, cookie state httpOnly 10 min.
