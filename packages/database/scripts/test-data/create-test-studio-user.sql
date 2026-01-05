-- Create user for Test Studio UI (Organization 16)
-- Password: password (hashed with bcrypt)

-- Insert user into master database
INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin@test-studio-ui.com',
  'Admin Test Studio',
  '$2b$10$zAP43uVLimWwbpC5yfD91eUfkTOL/CxGHb8qAUlwG0A.3mDYrQDUK',  -- password: "password"
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Associate user with Organization 16 (Test Studio UI)
INSERT INTO organization_members (user_id, organization_id, role, joined_at)
SELECT
  (SELECT id FROM users WHERE email = 'admin@test-studio-ui.com'),
  16,
  'owner',
  NOW()
ON CONFLICT ON CONSTRAINT organization_members_user_id_organization_id_unique
DO UPDATE SET role = EXCLUDED.role;

-- Verify setup
SELECT
  u.id as user_id,
  u.email,
  u.name,
  u.role as user_role,
  o.id as org_id,
  o.name as org_name,
  om.role as member_role
FROM users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE o.id = 16;
