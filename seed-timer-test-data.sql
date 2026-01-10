-- Seed complete test data for Timer testing (Organization 2 - tenant_2)
-- This creates: clients, rooms, task types, and a session for testing the timer feature

-- ========================================
-- 1. INSERT CLIENTS
-- ========================================

INSERT INTO clients (name, email, phone, type, address, city, country, notes, is_vip, portal_access, created_at, updated_at)
VALUES
  ('Sophie Martin', 'sophie.martin@test.com', '+33 6 12 34 56 78', 'individual', '15 rue de la Musique', 'Paris', 'France', 'Chanteuse professionnelle', true, true, NOW(), NOW()),
  ('Marc Dubois', 'marc.dubois@test.com', '+33 6 23 45 67 89', 'individual', '42 avenue du Hip-Hop', 'Lyon', 'France', 'Rappeur', false, true, NOW(), NOW()),
  ('Production Sound SARL', 'contact@production-sound.fr', '+33 1 42 56 78 90', 'company', '89 boulevard des Studios', 'Paris', 'France', 'Label de production', false, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ========================================
-- 2. INSERT ROOMS
-- ========================================

INSERT INTO rooms (name, description, type, hourly_rate, half_day_rate, full_day_rate, capacity, size, has_isolation_booth, has_live_room, has_control_room, color, is_active, is_available_for_booking, created_at, updated_at)
VALUES
  ('Studio A - Recording', 'Grande salle d''enregistrement professionnelle', 'recording', 75.00, 280.00, 500.00, 8, 45, true, true, true, '#e74c3c', true, true, NOW(), NOW()),
  ('Studio B - Mixing', 'Salle de mixage avec monitoring haute qualité', 'mixing', 60.00, 220.00, 400.00, 4, 30, false, false, true, '#3498db', true, true, NOW(), NOW()),
  ('Studio C - Mastering', 'Salle de mastering avec traitement acoustique premium', 'mastering', 80.00, 300.00, 550.00, 2, 20, false, false, true, '#2ecc71', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ========================================
-- 3. INSERT TASK TYPES (for time tracking)
-- ========================================

INSERT INTO task_types (name, description, hourly_rate, category, color, sort_order, is_active, created_at, updated_at)
VALUES
  ('Setup', 'Installation et préparation du studio', 50.00, 'billable', '#3B82F6', 1, true, NOW(), NOW()),
  ('Recording', 'Enregistrement actif', 75.00, 'billable', '#EF4444', 2, true, NOW(), NOW()),
  ('Mixing', 'Mixage et production audio', 60.00, 'billable', '#10B981', 3, true, NOW(), NOW()),
  ('Mastering', 'Mastering et finalisation', 80.00, 'billable', '#8B5CF6', 4, true, NOW(), NOW()),
  ('Break', 'Pause (non facturable)', 0.00, 'non-billable', '#6B7280', 5, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. INSERT A TEST SESSION
-- ========================================

-- First, get IDs from inserted data
DO $$
DECLARE
  v_client_id INTEGER;
  v_room_id INTEGER;
BEGIN
  -- Get first client ID
  SELECT id INTO v_client_id FROM clients WHERE email = 'sophie.martin@test.com' LIMIT 1;

  -- Get first room ID
  SELECT id INTO v_room_id FROM rooms WHERE name = 'Studio A - Recording' LIMIT 1;

  -- Insert session
  INSERT INTO sessions (
    client_id,
    room_id,
    title,
    description,
    start_time,
    end_time,
    status,
    total_amount,
    deposit_amount,
    deposit_paid,
    payment_status,
    created_at,
    updated_at
  )
  VALUES (
    v_client_id,
    v_room_id,
    'Test Timer Session',
    'Session de test pour le chronomètre',
    NOW(),
    NOW() + INTERVAL '4 hours',
    'in-progress',
    300.00,
    90.00,
    true,
    'partial',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count inserted records
SELECT
  (SELECT COUNT(*) FROM clients) as clients_count,
  (SELECT COUNT(*) FROM rooms) as rooms_count,
  (SELECT COUNT(*) FROM task_types) as task_types_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count;

-- Show session details
SELECT
  s.id as session_id,
  s.title,
  s.status,
  c.name as client_name,
  r.name as room_name
FROM sessions s
JOIN clients c ON s.client_id = c.id
JOIN rooms r ON s.room_id = r.id
ORDER BY s.created_at DESC
LIMIT 5;

-- Show task types
SELECT id, name, hourly_rate, category, color
FROM task_types
ORDER BY sort_order;
