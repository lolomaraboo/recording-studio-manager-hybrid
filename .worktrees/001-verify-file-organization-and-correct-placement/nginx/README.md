# Nginx Production Configuration

Configuration Nginx système pour VPS production (recording-studio-manager.com).

## 📋 Vue d'ensemble

Ce fichier configure Nginx comme reverse proxy pour:
- **Backend tRPC**: Node.js/Express (port 3000)
- **Frontend React**: Nginx container (port 8080)
- **SSL/TLS**: Let's Encrypt wildcard certificate
- **Multi-tenant**: Subdomains (studio1.recording-studio-manager.com)

## 🚀 Déploiement sur VPS

### 1. Copier le fichier sur le VPS

```bash
# Depuis votre machine locale
scp nginx/production.conf root@31.220.104.244:/etc/nginx/sites-available/recording-studio-manager
```

### 2. Créer le lien symbolique

```bash
# Sur le VPS
ssh root@31.220.104.244

# Activer le site
ln -sf /etc/nginx/sites-available/recording-studio-manager /etc/nginx/sites-enabled/

# Désactiver le site par défaut (optionnel)
rm -f /etc/nginx/sites-enabled/default
```

### 3. Créer les dossiers de logs

```bash
# Sur le VPS
mkdir -p /var/log/nginx
touch /var/log/nginx/recording-studio-manager-access.log
touch /var/log/nginx/recording-studio-manager-error.log
chown -R www-data:www-data /var/log/nginx
```

### 4. Tester la configuration

```bash
# Sur le VPS
nginx -t
```

Si tout est OK:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Recharger Nginx

```bash
# Sur le VPS
systemctl reload nginx

# OU si plusieurs instances Nginx tournent:
kill -HUP $(cat /var/run/nginx.pid)
```

## 🔧 Configuration Détaillée

### Upstreams

| Upstream | Port | Service |
|----------|------|---------|
| `node_app` | 127.0.0.1:3000 | Backend Express + tRPC |
| `frontend_app` | 127.0.0.1:8080 | Frontend React (Nginx container) |

### Routes

| Route | Destination | Rate Limit | Description |
|-------|------------|------------|-------------|
| `/api/trpc/*` | node_app | 10 req/s | tRPC API endpoints |
| `/api/upload/*` | node_app | 10 req/s | File uploads (audio) |
| `/api/webhooks/*` | node_app | 100 req/s | Stripe webhooks |
| `/api/ai/stream` | node_app | 10 req/s | AI SSE streaming |
| `/health` | node_app | - | Health check |
| `/*` | frontend_app | - | React SPA |

### Rate Limiting Zones

```nginx
api_limit:       10 req/s (burst 20)
login_limit:     5 req/min (stricter)
webhook_limit:   100 req/s (burst 50)
```

### Security Headers

- ✅ HSTS (Strict-Transport-Security)
- ✅ X-Frame-Options (SAMEORIGIN)
- ✅ X-Content-Type-Options (nosniff)
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Content-Security-Policy (configured for Stripe)

### SSL/TLS

- **Certificate**: Let's Encrypt wildcard
- **Protocols**: TLSv1.2, TLSv1.3
- **OCSP Stapling**: Enabled
- **Session Cache**: 10m

## 📊 Performance

### Gzip Compression

- **Level**: 6
- **Min Size**: 1024 bytes
- **Types**: text/*, application/json, application/javascript, fonts, SVG

### Keep-Alive

- **Backend**: 32 connections
- **Frontend**: 16 connections

### Client Limits

- **Max Body Size**: 100MB (audio file uploads)
- **Body Timeout**: 300s
- **Header Timeout**: 60s

## 🔒 Sécurité

### Connection Limiting

- Max 10 connections par IP (`limit_conn`)

### Non-Root Binding

- Tous les ports bound à `127.0.0.1` uniquement
- Nginx system est le seul point d'entrée public

### Hidden Files

- Accès refusé à tous les fichiers commençant par `.`

## 📝 Logs

### Access Log

```bash
# Location
/var/log/nginx/recording-studio-manager-access.log

# Format
combined (IP, date, request, status, size, referrer, user-agent)

# Rotation
Géré par logrotate système
```

### Error Log

```bash
# Location
/var/log/nginx/recording-studio-manager-error.log

# Level
warn (warnings + errors)
```

### Voir les logs en temps réel

```bash
# Access log
tail -f /var/log/nginx/recording-studio-manager-access.log

# Error log
tail -f /var/log/nginx/recording-studio-manager-error.log

# Les deux
tail -f /var/log/nginx/recording-studio-manager-*.log
```

## 🆘 Troubleshooting

### Nginx ne démarre pas

```bash
# Vérifier la syntaxe
nginx -t

# Voir les erreurs détaillées
systemctl status nginx
journalctl -xe -u nginx
```

### 502 Bad Gateway

- Vérifier que les containers Docker tournent: `docker ps`
- Vérifier que les ports 3000 et 8080 répondent: `curl http://localhost:3000/health`

### 413 Request Entity Too Large

- Augmenter `client_max_body_size` (actuellement 100M)

### Rate Limiting Errors (429)

- Ajuster les zones rate limiting si légitime
- Vérifier les IPs bloquées: `grep "limiting requests" /var/log/nginx/error.log`

## 🔄 Mise à jour

Pour modifier la configuration:

```bash
# 1. Modifier le fichier localement
vim nginx/production.conf

# 2. Copier sur VPS
scp nginx/production.conf root@31.220.104.244:/etc/nginx/sites-available/recording-studio-manager

# 3. Tester
ssh root@31.220.104.244 "nginx -t"

# 4. Recharger
ssh root@31.220.104.244 "systemctl reload nginx"
```

## 📚 Références

- [Nginx Documentation](https://nginx.org/en/docs/)
- [SSL Best Practices](https://ssl-config.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [VPS Migration Plan](../docs/deployment/VPS_MIGRATION_PLAN.md)
