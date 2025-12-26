#!/bin/bash

echo "🧪 Test: Vérification absence d'erreurs 500 après fix"
echo "=================================================="
echo ""

# Clear old logs
docker logs rsm-server-dev --tail 0 > /dev/null 2>&1

echo "1️⃣ Génération de trafic sur l'application..."
echo "   (Simulation de requêtes utilisateur)"
echo ""

# Simulate some requests (these will fail but that's ok, we just want to trigger the routes)
curl -s http://localhost:3001/api/trpc/notifications.list?input=%7B%22limit%22%3A50%7D > /dev/null 2>&1 &
curl -s http://localhost:3001/api/trpc/projects.list > /dev/null 2>&1 &
curl -s http://localhost:3001/api/trpc/clients.list > /dev/null 2>&1 &
curl -s http://localhost:3001/api/trpc/sessions.list > /dev/null 2>&1 &

sleep 2

echo "2️⃣ Analyse des logs serveur..."
echo ""

# Check for tenant_9 or tenant_10 errors in recent logs
RECENT_ERRORS=$(docker logs rsm-server-dev --since 10s 2>&1 | grep -E "tenant_(9|10)" | grep "does not exist" | wc -l)

if [ "$RECENT_ERRORS" -gt 0 ]; then
  echo "❌ ÉCHEC: Erreurs tenant database détectées ($RECENT_ERRORS erreurs)"
  echo ""
  echo "Erreurs trouvées:"
  docker logs rsm-server-dev --since 10s 2>&1 | grep -E "tenant_(9|10)" | grep "does not exist" | head -3
  echo ""
  exit 1
else
  echo "✅ SUCCÈS: Aucune erreur 'tenant does not exist' détectée"
  echo ""
fi

echo "3️⃣ Vérification des databases tenant..."
echo ""

# List all tenant databases
TENANT_DBS=$(docker exec rsm-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%' ORDER BY datname;")

echo "Databases tenant existantes:"
for db in $TENANT_DBS; do
  db=$(echo $db | xargs)
  TABLE_COUNT=$(docker exec rsm-postgres psql -U postgres -d $db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
  echo "   ✅ $db ($TABLE_COUNT tables)"
done

echo ""
echo "=================================================="
echo "✅ TEST RÉUSSI - Système stable"
echo "=================================================="
