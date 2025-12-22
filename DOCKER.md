# Docker Setup - Recording Studio Manager

Ce guide explique comment démarrer et gérer tous les services de l'application avec Docker.

## 📦 Services Inclus

Le `docker-compose.yml` configure les services suivants :

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| **postgres** | postgres:15-alpine | 5432 | PostgreSQL database (Master + Tenants) |
| **redis** | redis:7-alpine | 6379 | Redis cache (sessions, AI credits) |
| **server** | Custom build | 3000 | Backend Express + tRPC API |
| **client** | Custom build | 80 | Frontend React + Nginx |

## 🚀 Quick Start

### 1. Configuration Environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Éditez `.env` et remplissez les valeurs nécessaires :

```bash
# Requis pour Client Portal
STRIPE_SECRET_KEY=sk_test_...      # Dashboard Stripe > API Keys
RESEND_API_KEY=re_...               # Resend.com > API Keys

# Optionnel (AI Chatbot)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Démarrer Tous les Services

```bash
docker-compose up -d
```

Vérifier le statut :

```bash
docker-compose ps
```

### 3. Initialiser la Base de Données

**Première fois uniquement :**

```bash
# Créer les databases master + tenant
docker exec -i rsm-postgres psql -U postgres < packages/database/drizzle/migrations/master/0000_massive_zodiak.sql

# Créer tenant_1
docker exec -i rsm-postgres psql -U postgres -c "CREATE DATABASE tenant_1;"

# Appliquer migrations tenant
docker exec -i rsm-postgres psql -U postgres -d tenant_1 < packages/database/drizzle/migrations/tenant/0000_early_charles_xavier.sql
```

### 4. Accéder à l'Application

- **Frontend:** http://localhost (port 80)
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 🛠️ Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f server

# Arrêter tous les services
docker-compose down

# Arrêter + supprimer volumes (⚠️ PERTE DE DONNÉES)
docker-compose down -v
```

### Accès aux Containers

```bash
# Shell PostgreSQL
docker exec -it rsm-postgres psql -U postgres -d rsm_master

# Shell Redis
docker exec -it rsm-redis redis-cli

# Shell Backend
docker exec -it rsm-server sh

# Shell Frontend
docker exec -it rsm-client sh
```

### Database Management

```bash
# Backup database
docker exec rsm-postgres pg_dump -U postgres rsm_master > backup.sql

# Restore database
docker exec -i rsm-postgres psql -U postgres rsm_master < backup.sql

# Lister les databases
docker exec rsm-postgres psql -U postgres -c "\\l"

# Vérifier les tables tenant_1
docker exec rsm-postgres psql -U postgres -d tenant_1 -c "\\dt"
```

### Rebuild Services

```bash
# Rebuild backend après changement de code
docker-compose build server
docker-compose up -d server

# Rebuild frontend
docker-compose build client
docker-compose up -d client

# Rebuild tout
docker-compose build
docker-compose up -d
```

## 🔧 Development Mode (Sans Docker)

Pour développer en local sans Docker :

```bash
# Terminal 1: PostgreSQL + Redis (Docker uniquement)
docker-compose up postgres redis

# Terminal 2: Backend (local)
cd packages/server
pnpm dev

# Terminal 3: Frontend (local)
cd packages/client
pnpm dev
```

**Avantages :**
- Hot reload immédiat (tsx watch, Vite HMR)
- Debugging facile (Chrome DevTools, VS Code)
- Pas de rebuild Docker à chaque changement

**Configuration :**
- Backend: `http://localhost:3001` (pas 3000)
- Frontend: `http://localhost:5174` (Vite default)
- Utilisez `.env` à la racine du projet

## 📊 Healthchecks

Tous les services ont des healthchecks automatiques :

```bash
# Vérifier la santé des services
docker-compose ps

# Détails healthcheck PostgreSQL
docker inspect rsm-postgres | grep -A 10 Health

# Détails healthcheck Redis
docker inspect rsm-redis | grep -A 10 Health
```

## 🐛 Troubleshooting

### Erreur: Port déjà utilisé

```bash
# Port 5432 (PostgreSQL)
lsof -ti:5432 | xargs kill -9

# Port 6379 (Redis)
lsof -ti:6379 | xargs kill -9

# Port 3000 (Backend)
lsof -ti:3000 | xargs kill -9

# Port 80 (Frontend) - nécessite sudo
sudo lsof -ti:80 | xargs sudo kill -9
```

### Backend ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs server

# Vérifier les variables d'environnement
docker exec rsm-server env | grep DATABASE_URL

# Rebuild avec cache nettoyé
docker-compose build --no-cache server
docker-compose up -d server
```

### Database connection failed

```bash
# Vérifier que PostgreSQL est ready
docker exec rsm-postgres pg_isready -U postgres

# Tester connexion depuis backend
docker exec rsm-server sh -c "apk add postgresql-client && psql $DATABASE_URL -c 'SELECT 1'"

# Recréer le container PostgreSQL
docker-compose down postgres
docker volume rm recording-studio-manager-hybrid_postgres_data
docker-compose up -d postgres
```

### Redis connection failed

```bash
# Vérifier Redis
docker exec rsm-redis redis-cli ping

# Avec mot de passe
docker exec rsm-redis redis-cli -a change-me-in-production ping

# Voir les logs Redis
docker-compose logs redis
```

## 🔐 Sécurité Production

**Avant de déployer en production :**

1. ✅ Changez tous les secrets dans `.env`
2. ✅ Utilisez des secrets forts (32+ caractères)
3. ✅ Configurez HTTPS/SSL (Traefik, Nginx Proxy)
4. ✅ Limitez les ports exposés (pas de 5432/6379 publics)
5. ✅ Activez les backups automatiques (PostgreSQL)
6. ✅ Configurez le monitoring (Prometheus, Grafana)

## 📚 Ressources

- **Docker Compose Docs:** https://docs.docker.com/compose/
- **PostgreSQL Docker:** https://hub.docker.com/_/postgres
- **Redis Docker:** https://hub.docker.com/_/redis
- **Drizzle ORM Migrations:** https://orm.drizzle.team/docs/migrations

---

**Dernière mise à jour:** 2025-12-21
**Version Docker Compose:** 3.8
**Maintenu par:** Recording Studio Manager Team
