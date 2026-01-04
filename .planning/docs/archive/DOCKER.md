# Docker Setup - Recording Studio Manager

Ce guide explique comment démarrer et gérer tous les services de l'application avec Docker.

## 📦 Services Inclus

### Development Stack (docker-compose.dev.yml) - RECOMMANDÉ ✨

Tous les services avec **hot reload** activé :

| Service | Image | Port | Hot Reload | Description |
|---------|-------|------|------------|-------------|
| **postgres** | postgres:15-alpine | 5432 | N/A | PostgreSQL database (Master + Tenants) |
| **redis** | redis:7-alpine | 6379 | N/A | Redis cache (sessions, AI credits) |
| **server** | Custom build | 3001 | ✅ tsx watch | Backend Express + tRPC API |
| **client** | Custom build | 5174 | ✅ Vite HMR | Frontend React + Vite |

### Production Stack (docker-compose.yml)

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| **postgres** | postgres:15-alpine | 5432 | PostgreSQL database (Master + Tenants) |
| **redis** | redis:7-alpine | 6379 | Redis cache (sessions, AI credits) |
| **server** | Custom build | 3000 | Backend Express + tRPC API (optimized) |
| **client** | Custom build | 80 | Frontend React + Nginx (optimized) |

## 🚀 Quick Start - Development Mode

### Prérequis

**IMPORTANT:** Arrêtez PostgreSQL local avant de démarrer Docker :

```bash
# Vérifiez si PostgreSQL local tourne
brew services list | grep postgresql

# Si actif, arrêtez-le
brew services stop postgresql@17
```

### 1. Démarrer Tous les Services (avec Hot Reload)

```bash
# Lancer la stack de développement
docker-compose -f docker-compose.dev.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.dev.yml ps
```

**Expected Output:**
```
NAME             STATUS                     PORTS
rsm-client-dev   Up (healthy)              0.0.0.0:5174->5174/tcp
rsm-postgres     Up (healthy)              0.0.0.0:5432->5432/tcp
rsm-redis        Up (healthy)              0.0.0.0:6379->6379/tcp
rsm-server-dev   Up (healthy)              0.0.0.0:3001->3001/tcp
```

### 2. Accès aux Services

- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:3001/api/trpc
- **Health Check:** http://localhost:3001/health
- **Client Portal:** http://localhost:5174/client-portal/login
  - Email: test@example.com
  - Password: password123

### 3. Hot Reload en Action

**Backend (tsx watch):**
```bash
# Modifiez n'importe quel fichier dans packages/server/src/
# Le serveur redémarre automatiquement

# Vérifiez les logs
docker logs rsm-server-dev --tail 20
```

**Frontend (Vite HMR):**
```bash
# Modifiez n'importe quel fichier dans packages/client/src/
# La page se met à jour instantanément

# Vérifiez les logs
docker logs rsm-client-dev --tail 20
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

## 🔧 Arrêt et Nettoyage

### Arrêter la Stack

```bash
# Arrêter tous les services (garde les volumes)
docker-compose -f docker-compose.dev.yml down

# Arrêter + supprimer volumes (⚠️ PERTE DE DONNÉES)
docker-compose -f docker-compose.dev.yml down -v
```

### Rebuild After Package Changes

Si vous modifiez `package.json` ou installez de nouveaux packages :

```bash
# Rebuild backend
docker-compose -f docker-compose.dev.yml up -d --build server

# Rebuild frontend
docker-compose -f docker-compose.dev.yml up -d --build client

# Rebuild tout
docker-compose -f docker-compose.dev.yml up -d --build
```

## 🆚 Development vs Production

### Development (docker-compose.dev.yml)
- ✅ **Hot reload**: Changements instantanés sans rebuild
- ✅ **tsx watch**: Backend redémarre automatiquement
- ✅ **Vite HMR**: Frontend met à jour sans refresh
- ✅ **Source maps**: Debugging facile
- ✅ **Volumes montés**: Code modifiable en live
- 🐌 **Performance**: Moins optimisé (mode dev)

### Production (docker-compose.yml)
- ⚡ **Optimisé**: Builds minifiés et compressés
- 🔒 **Sécurisé**: Pas de volumes montés
- 🚀 **Nginx**: Serveur web performant pour frontend
- ❌ **Pas de hot reload**: Rebuild requis
- ✅ **Performance**: Production-ready

## 💡 Pourquoi Docker Development Now?

Avant (Sans Docker Dev):
```bash
# Problèmes fréquents
❌ PostgreSQL local vs Docker conflict (port 5432)
❌ "Works on my machine" syndrome
❌ Différences dev/prod
❌ Setup complexe pour nouveaux devs
```

Maintenant (Avec Docker Dev):
```bash
# Avantages
✅ Environnement identique pour tous
✅ Un seul PostgreSQL (Docker)
✅ Hot reload fonctionne
✅ Setup en 1 commande
✅ Dev/Prod similaires
```

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

## 🎯 Quick Reference

```bash
# Start dev stack (hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Watch logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop dev stack
docker-compose -f docker-compose.dev.yml down

# Rebuild after package.json changes
docker-compose -f docker-compose.dev.yml up -d --build

# Access services
Frontend:  http://localhost:5174
Backend:   http://localhost:3001/api/trpc
Health:    http://localhost:3001/health
Login:     http://localhost:5174/client-portal/login (test@example.com / password123)
```

---

**Dernière mise à jour:** 2025-12-22
**Version Docker Compose:** 3.8
**Maintenu par:** Recording Studio Manager Team
