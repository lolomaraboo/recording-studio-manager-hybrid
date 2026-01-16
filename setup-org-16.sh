#!/bin/bash
# Setup Organization 16 (Test Studio UI) with complete test data

set -e

PSQL="/opt/homebrew/opt/postgresql@17/bin/psql -U postgres"

echo "🏗️  Setting up Organization 16 (Test Studio UI)..."

# 1. Create organization 16 in rsm_master
echo "1️⃣  Creating organization 16..."
$PSQL -d rsm_master <<EOF
INSERT INTO organizations (id, name, slug, subdomain, owner_id, is_active, created_at, updated_at)
VALUES (
  16,
  'Test Studio UI',
  'test-studio-ui',
  'test-studio-ui',
  1,  -- Temporary owner, will be updated after user creation
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    subdomain = EXCLUDED.subdomain,
    updated_at = NOW();

SELECT id, name FROM organizations WHERE id = 16;
EOF

# 2. Create tenant_16 database
echo "2️⃣  Creating tenant_16 database..."
$PSQL -d postgres -c "CREATE DATABASE tenant_16;" || echo "Database tenant_16 already exists"

# 3. Apply tenant migrations to tenant_16
echo "3️⃣  Applying tenant schema to tenant_16..."
$PSQL -d tenant_16 < drizzle/migrations/tenant/0000_talented_terror.sql || echo "Migrations already applied"

# 4. Create tenant_databases entry
echo "4️⃣  Registering tenant_16 in master..."
$PSQL -d rsm_master <<EOF
INSERT INTO tenant_databases (organization_id, database_name, created_at)
VALUES (16, 'tenant_16', NOW())
ON CONFLICT (organization_id) DO UPDATE
SET database_name = EXCLUDED.database_name;

SELECT * FROM tenant_databases WHERE organization_id = 16;
EOF

# 5. Create test user and associate with org 16
echo "5️⃣  Creating test user..."
$PSQL -d rsm_master < packages/database/scripts/test-data/create-test-studio-user.sql

# 6. Update organization owner
echo "6️⃣  Setting organization owner..."
$PSQL -d rsm_master <<EOF
UPDATE organizations
SET owner_id = (SELECT id FROM users WHERE email = 'admin@test-studio-ui.com')
WHERE id = 16;

SELECT id, name, owner_id FROM organizations WHERE id = 16;
EOF

# 7. Load test data into tenant_16
echo "7️⃣  Loading test data into tenant_16..."
$PSQL < packages/database/scripts/test-data/setup-test-studio-ui.sql

echo "✅ Organization 16 setup complete!"
echo ""
echo "📝 Test Credentials:"
echo "   Email: admin@test-studio-ui.com"
echo "   Password: password"
echo "   Organization: Test Studio UI (ID: 16)"
echo ""
echo "🔗 Login at: http://localhost:5174/login"
