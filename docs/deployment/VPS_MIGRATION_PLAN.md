# VPS Migration Plan - Legacy Python → Hybrid TypeScript

**Date:** 2025-12-23
**Projet:** recording-studio-manager-hybrid
**VPS:** 31.220.104.244 (Hostinger KVM 1 - 4GB RAM, 2 vCPU)
**Domaine:** recording-studio-manager.com

---

## 📋 Vue d'ensemble

### Objectif
Remplacer la version Legacy Python (test) par la version Hybride TypeScript en production sur le VPS, tout en conservant le même domaine et l'architecture multi-tenant.

### Architecture Cible
```
recording-studio-manager.com
├── studio1.recording-studio-manager.com  (Tenant 1)
├── studio2.recording-studio-manager.com  (Tenant 2)
└── ...                                    (Tenants N)
```

### Stack Technique
- **Frontend:** React 19 + Vite (port 80/443)
- **Backend:** Node.js + Express + tRPC (port 3000 interne)
- **Database:** PostgreSQL Database-per-Tenant
- **Cache:** Redis (sessions + caching)
- **Reverse Proxy:** Nginx system (SSL/HTTPS)

---

## 🎯 État Actuel VPS

### À CONSERVER
- ✅ Domaine: `recording-studio-manager.com`
- ✅ SSL Certificate: `/etc/letsencrypt/live/recording-studio-manager.com/` (wildcard)
- ✅ Nginx system (port 80/443)
- ✅ Projet: `ai-project-manager` (reste intact)
- ✅ Projet: Mem0/SecondBrain Docker (reste intact)

### À SUPPRIMER
- ❌ Container `studio_app` (Flask Python Legacy)
- ❌ Container `studio_postgres` (Legacy - ou réutiliser ?)
- ❌ Container `studio_redis` (Legacy - ou réutiliser ?)
- ❌ Code `/root/recording-studio-manager/` (backup puis suppression)
- ❌ Toutes données test: `recording_studio_prod`, `studio_5_db`

### À DÉPLOYER (Fresh Start)
- ✅ Code: `/root/recording-studio-manager-hybrid/`
- ✅ Containers: `rsm-server`, `rsm-postgres`, `rsm-redis`, `rsm-client`
- ✅ Databases: `rsm_master` (master) + `tenant_1`, `tenant_2`... (tenants)

---

## 📦 Phase 1: Préparation Locale (2-3h)

### 1.1 Redis Sessions (30min)

**Objectif:** Remplacer MemoryStore par Redis pour sessions persistantes.

**Installation:**
```bash
cd ~/Documents/APP_HOME/CascadeProjects/windsurf-project/recording-studio-manager-hybrid/packages/server
pnpm add connect-redis
```

**Code à modifier:** `packages/server/src/index.ts`

```typescript
// AVANT (MemoryStore - lignes 48-59)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// APRÈS (RedisStore)
import RedisStore from 'connect-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(
  session({
    store: new RedisStore({
      client: redis,
      prefix: 'rsm:session:',
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);
```

**Fichiers modifiés:**
- `packages/server/src/index.ts` (+5 lignes, ~10 modif)
- `packages/server/package.json` (dependency ajoutée)

---

### 1.2 docker-compose.production.yml (1h)

**Objectif:** Créer config Docker Compose optimisée pour VPS production.

**Source:** Copier depuis `recording-studio-manager/docker-compose.production.yml` (Legacy)

**Adaptations clés:**

| Legacy Python | Hybride TypeScript |
|---------------|-------------------|
| `studio_app` (Flask/Gunicorn) | `rsm-server` (Node/Express) |
| Port 5002 | Port 3000 |
| `studio_postgres` | `rsm-postgres` |
| `studio_redis` | `rsm-redis` |
| Build: Dockerfile.production (Python) | Build: packages/server/Dockerfile |
| Network: studio_network | Network: rsm_network |

**Fichier à créer:** `docker-compose.production.yml` (racine projet)

**Points critiques:**
- ✅ Health checks (postgres, redis, server, client)
- ✅ Resource limits (memory, CPU)
- ✅ Restart policy: `unless-stopped`
- ✅ Volumes persistants (postgres_data, redis_data)
- ✅ Environment variables (.env production)
- ✅ Network bridge isolé

**Exemple structure:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: rsm-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rsm_master
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5433:5432"  # Port 5433 pour éviter conflit
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1500M
          cpus: '1.0'

  redis:
    image: redis:7-alpine
    container_name: rsm-redis
    restart: unless-stopped
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6380:6379"  # Port 6380 pour éviter conflit
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
    deploy:
      resources:
        limits:
          memory: 256M

  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    container_name: rsm-server
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/rsm_master
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      # ... autres variables
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  client:
    build:
      context: .
      dockerfile: packages/client/Dockerfile
    container_name: rsm-client
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    depends_on:
      - server

volumes:
  postgres_data:
  redis_data:

networks:
  rsm_network:
    driver: bridge
```

---

### 1.3 Nginx Production Config (30min)

**Objectif:** Config nginx reverse proxy pour Hybride TypeScript.

**Source:** `recording-studio-manager/config/nginx-site.conf` (Legacy)

**Fichier à créer:** `nginx/production.conf`

**Adaptations:**

```nginx
# Upstream (Python → Node)
upstream node_app {
    server 127.0.0.1:3000 fail_timeout=10s max_fails=3;  # au lieu de 172.28.0.4:5002
    keepalive 32;
}

# Rate limiting (IDENTIQUE)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# HTTP → HTTPS Redirect (IDENTIQUE)
server {
    listen 80;
    server_name .recording-studio-manager.com;
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server (IDENTIQUE structure)
server {
    listen 443 ssl http2;
    server_name .recording-studio-manager.com;  # Wildcard pour multi-tenant

    # SSL (IDENTIQUE paths)
    ssl_certificate /etc/letsencrypt/live/recording-studio-manager.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recording-studio-manager.com/privkey.pem;

    # Security Headers (IDENTIQUE)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    # ...

    # API Routes (MODIFIÉ pour tRPC)
    location /api/trpc/ {  # au lieu de /api/
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://node_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Pas de buffering pour tRPC subscriptions
        proxy_buffering off;
    }

    # Webhooks (IDENTIQUE)
    location /webhooks/ {
        proxy_pass http://node_app;
        proxy_request_buffering off;  # Raw body pour Stripe
    }

    # Health Check (IDENTIQUE)
    location /health {
        proxy_pass http://node_app;
        access_log off;
    }

    # Static Files Frontend (NOUVEAU - React SPA)
    location / {
        proxy_pass http://127.0.0.1:8080;  # Nginx container frontend
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**Différences clés vs Legacy:**
- ✅ `upstream node_app` au lieu de `flask_app`
- ✅ Port `3000` au lieu de `5002`
- ✅ Route `/api/trpc/` au lieu de `/api/`
- ✅ Proxy frontend SPA React (port 8080)
- ✅ Pas de route `/static/` (frontend gère)

---

### 1.4 Dockerfile Production (30min)

**Objectif:** Multi-stage build optimisé pour production.

**Fichiers à créer:**
- `packages/server/Dockerfile.production`
- `packages/client/Dockerfile.production`

**Server Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/
RUN npm install -g pnpm@9.14.4
RUN pnpm install --frozen-lockfile
COPY packages/server ./packages/server
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
RUN pnpm --filter @recording-studio/server build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@9.14.4
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./packages/server/
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Client Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9.14.4
RUN pnpm install --frozen-lockfile
COPY packages/client ./packages/client
COPY packages/shared ./packages/shared
RUN pnpm --filter @recording-studio/client build

FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

### 1.5 Script Deploy VPS (30min)

**Objectif:** Script automatisé de déploiement.

**Source:** `recording-studio-manager/scripts/deploy-vps.sh` (Legacy)

**Fichier à créer:** `scripts/deploy-vps.sh`

**Adaptations:**
- Python commands → Node commands
- Database init: `python3 init_db.py` → `pnpm drizzle-kit migrate`
- App dir: `/root/recording-studio-manager-hybrid/`
- Compose file: `docker-compose.production.yml`

---

### 1.6 Tests Locaux (30min)

**Commandes:**
```bash
cd ~/Documents/APP_HOME/CascadeProjects/windsurf-project/recording-studio-manager-hybrid

# 1. Build images
docker compose -f docker-compose.production.yml build --no-cache

# 2. Start services
docker compose -f docker-compose.production.yml up -d

# 3. Check health
docker ps
docker logs rsm-server --tail 50
curl http://localhost:3000/health

# 4. Test multi-tenant (ajouter dans /etc/hosts)
echo "127.0.0.1 studio1.localhost" | sudo tee -a /etc/hosts
curl http://studio1.localhost:3000/health

# 5. Stop
docker compose -f docker-compose.production.yml down
```

---

## 🚀 Phase 2: Déploiement VPS (2h)

### 2.1 Backup Legacy (30min)

```bash
ssh root@31.220.104.244

# 1. Backup données (si besoin)
cd /root/recording-studio-manager
docker exec studio_postgres pg_dumpall -U studio_admin > /root/backups/legacy_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop containers Legacy
docker compose -f docker-compose.production.yml down

# 3. Archive code Legacy
cd /root
tar -czf recording-studio-manager-legacy-$(date +%Y%m%d).tar.gz recording-studio-manager/
mv recording-studio-manager recording-studio-manager-legacy-backup

# 4. Vérifier que ai-project-manager est intact
docker ps | grep ai-project
```

---

### 2.2 Deploy Hybride (1h)

```bash
# 1. Clone repo
cd /root
git clone https://github.com/lolomaraboo/recording-studio-manager-hybrid.git
cd recording-studio-manager-hybrid

# 2. Setup .env production
cp .env.example .env
nano .env

# Variables critiques:
# NODE_ENV=production
# DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/rsm_master
# REDIS_URL=redis://:STRONG_PASSWORD@redis:6379
# JWT_SECRET=GENERATE_64_CHARS
# SESSION_SECRET=GENERATE_64_CHARS
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# RESEND_API_KEY=re_...
# CLOUDINARY_*=...

# 3. Build images
docker compose -f docker-compose.production.yml build --no-cache

# 4. Start services
docker compose -f docker-compose.production.yml up -d

# 5. Initialize database
docker exec rsm-server pnpm drizzle-kit migrate

# 6. Check services
docker ps
docker logs rsm-server --tail 50
docker logs rsm-postgres --tail 50
curl http://localhost:3000/health
```

---

### 2.3 Update Nginx (15min)

```bash
# 1. Backup old config
cp /etc/nginx/sites-available/recording-studio-manager \
   /etc/nginx/sites-available/recording-studio-manager.legacy-backup

# 2. Upload new config
# (Copier nginx/production.conf depuis local)
nano /etc/nginx/sites-available/recording-studio-manager

# 3. Test config
nginx -t

# 4. Reload nginx
systemctl reload nginx
# OU si multiples instances:
kill -HUP $(cat /var/run/nginx.pid)
```

---

### 2.4 Tests Production (15min)

```bash
# Health check
curl https://recording-studio-manager.com/health
# Expected: {"status":"ok",...}

# Multi-tenant wildcard SSL
curl -I https://studio1.recording-studio-manager.com/health
# Expected: 200 OK + SSL valide

# Frontend
curl https://recording-studio-manager.com/
# Expected: HTML React app

# API tRPC
curl https://recording-studio-manager.com/api/trpc/health.ping
# Expected: tRPC response
```

---

## 🔧 Configuration Critique

### PostgreSQL/Redis: Partagé ou Nouveau ?

**Recommandation:** Nouveaux containers Hybride (isolation complète)

**Raison:**
- Legacy peut rester en backup (si besoin rollback)
- Pas de conflit ports (5433 vs 5432, 6380 vs 6379)
- Données fresh start (pas de migration)

**Ports utilisés:**
| Service | Legacy | Hybride | ai-project-manager |
|---------|--------|---------|-------------------|
| PostgreSQL | 5433 | 5432 (ou 5434) | ? |
| Redis | 6379 | 6380 | ? |
| App | 5002 | 3000 | ? |
| Frontend | - | 8080 | ? |

---

## ⚠️ Checklist Critique

### Avant déploiement:
- [ ] `connect-redis` installé
- [ ] `docker-compose.production.yml` créé
- [ ] `nginx/production.conf` créé
- [ ] Dockerfiles production créés
- [ ] `.env.example` mis à jour
- [ ] Tests locaux Docker passés
- [ ] Code commité + pushé GitHub

### Pendant déploiement:
- [ ] Backup Legacy fait
- [ ] Containers Legacy stoppés
- [ ] Code Legacy archivé
- [ ] ai-project-manager intact (vérifier `docker ps`)
- [ ] .env production configuré
- [ ] Build Docker réussi
- [ ] Migrations DB exécutées
- [ ] Nginx config updated
- [ ] SSL certificate vérifié

### Après déploiement:
- [ ] Health endpoint OK
- [ ] Multi-tenant wildcard fonctionne
- [ ] Frontend accessible
- [ ] API tRPC répond
- [ ] Sessions Redis fonctionnent
- [ ] Logs propres (pas d'erreurs)

---

## 📊 Ressources VPS

**Avant (Legacy + ai-pm):**
- Python Legacy: ~800MB
- PostgreSQL: ~600MB
- Redis: ~128MB
- ai-project-manager: ~? MB
- **Total:** ~1.5GB

**Après (Hybride + ai-pm):**
- Node Hybride: ~400MB
- PostgreSQL Hybride: ~600MB
- Redis Hybride: ~100MB
- ai-project-manager: ~? MB
- **Total estimé:** ~2.1GB

**Marge:** ~1.9GB libres + 2GB swap = OK ✅

---

## 🔐 Secrets à Générer

```bash
# JWT_SECRET (64 chars)
openssl rand -hex 32

# SESSION_SECRET (64 chars)
openssl rand -hex 32

# POSTGRES_PASSWORD (32 chars)
openssl rand -hex 16

# REDIS_PASSWORD (32 chars)
openssl rand -hex 16
```

---

## 🆘 Rollback Plan

Si problème après déploiement:

```bash
# 1. Stop Hybride
cd /root/recording-studio-manager-hybrid
docker compose -f docker-compose.production.yml down

# 2. Restore Legacy
cd /root
mv recording-studio-manager-legacy-backup recording-studio-manager
cd recording-studio-manager
docker compose -f docker-compose.production.yml up -d

# 3. Restore nginx config
cp /etc/nginx/sites-available/recording-studio-manager.legacy-backup \
   /etc/nginx/sites-available/recording-studio-manager
systemctl reload nginx
```

**Time to rollback:** ~5 minutes

---

## 📚 Références

- **Legacy config:** `~/recording-studio-manager/docker-compose.production.yml`
- **Legacy nginx:** `~/recording-studio-manager/config/nginx-site.conf`
- **Legacy deploy:** `~/recording-studio-manager/scripts/deploy-vps.sh`
- **Legacy docs:** `~/recording-studio-manager/docs/deployment/`
- **VPS IP:** 31.220.104.244
- **Domaine:** recording-studio-manager.com
- **SSL:** Let's Encrypt wildcard (valide jusqu'à 2026-02-25)

---

**Dernière mise à jour:** 2025-12-23
**Status:** Documentation complète - Prêt pour Phase 1
**Prochaine étape:** Implémenter Redis sessions (30min)
