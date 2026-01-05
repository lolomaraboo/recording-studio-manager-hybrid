-- Setup Test Studio UI (Org 16) with user and complete seed data

\c rsm_master

-- Create user for Test Studio UI
INSERT INTO users (email, name, password_hash, email_verified, created_at, updated_at)
VALUES (
  'admin@test-studio-ui.com',
  'Admin Test UI',
  '$2b$10$rQ0XKzGvKJX5p5F5F5F5F.5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F',  -- password: "password"
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Get user ID (will be highest ID)
DO $$ 
DECLARE
  v_user_id INT;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'admin@test-studio-ui.com';
  
  -- Associate user with organization 16
  INSERT INTO organization_members (user_id, organization_id, role, created_at)
  VALUES (v_user_id, 16, 'admin', NOW())
  ON CONFLICT (user_id, organization_id) DO NOTHING;
  
  RAISE NOTICE 'User % associated with org 16', v_user_id;
END $$;

-- Switch to tenant database
\c tenant_16

-- Clear existing data
TRUNCATE TABLE invoice_items, invoices, tracks, projects, sessions, equipment, rooms, musicians, clients CASCADE;

-- Clients (5)
INSERT INTO clients (name, artist_name, email, phone, type, address, city, country, notes, is_vip, portal_access) VALUES
('Emma Dubois', 'Emma D', 'emma.dubois@example.com', '+33 6 11 22 33 44', 'individual', '12 rue Mozart', 'Paris', 'France', 'Chanteuse folk, très professionnelle', true, true),
('Lucas Martin', 'DJ Lucas', 'lucas.martin@example.com', '+33 6 22 33 44 55', 'individual', '38 avenue Electro', 'Lyon', 'France', 'DJ house music, sessions nocturnes', true, true),
('Sound Production SARL', NULL, 'contact@soundprod.fr', '+33 1 45 67 89 00', 'company', '92 boulevard Commerce', 'Paris', 'France', 'Partenaire commercial régulier', false, false),
('Sarah Petit', 'Sarah P', 'sarah.petit@example.com', '+33 6 33 44 55 66', 'individual', '27 rue Jazz', 'Marseille', 'France', 'Pianiste jazz contemporain', false, true),
('Alexandre Grand', 'Alex G', 'alex.grand@example.com', '+33 6 44 55 66 77', 'individual', '64 allée Blues', 'Toulouse', 'France', 'Guitariste blues expérimenté', false, true);

-- Rooms (4)
INSERT INTO rooms (name, description, type, hourly_rate, half_day_rate, full_day_rate, capacity, size, has_isolation_booth, has_live_room, has_control_room, color, is_active, is_available_for_booking) VALUES
('Studio Principal - Recording', 'Grande salle recording avec acoustique professionnelle premium', 'recording', 80.00, 300.00, 550.00, 10, 50, true, true, true, '#e74c3c', true, true),
('Studio Mix - Mixing', 'Salle mixage avec monitoring audiophile', 'mixing', 70.00, 260.00, 480.00, 5, 35, false, false, true, '#3498db', true, true),
('Studio Master - Mastering', 'Salle mastering traitement acoustique haut de gamme', 'mastering', 90.00, 340.00, 620.00, 3, 25, false, false, true, '#2ecc71', true, true),
('Salle Répétition', 'Grande salle répétition équipée complète', 'rehearsal', 30.00, 110.00, 180.00, 8, 40, false, true, false, '#f39c12', true, true);

-- Equipment (8)
INSERT INTO equipment (room_id, name, brand, model, serial_number, category, description, specifications, purchase_date, purchase_price, status, condition, location, is_available) VALUES
((SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Neumann U87 Ai', 'Neumann', 'U87 Ai', 'U87-54321', 'microphone', 'Micro condensateur large diaphragme premium', '{"type": "Condenser", "pattern": "Multi-pattern", "frequency": "20Hz-20kHz"}', '2023-01-15', 3400.00, 'operational', 'excellent', 'Studio Principal - Rack 1', true),
((SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Shure SM7B', 'Shure', 'SM7B', 'SM7B-98765', 'microphone', 'Micro dynamique broadcast/studio', '{"type": "Dynamic", "pattern": "Cardioid", "frequency": "50Hz-16kHz"}', '2022-08-20', 450.00, 'operational', 'excellent', 'Studio Principal - Mic Locker', true),
((SELECT id FROM rooms WHERE name = 'Studio Mix - Mixing'), 'Universal Audio Apollo x16', 'Universal Audio', 'Apollo x16', 'APX16-22334', 'interface', 'Interface audio Thunderbolt 32x32', '{"inputs": 32, "outputs": 32, "connection": "Thunderbolt 3", "sampleRate": "192kHz"}', '2023-06-10', 3800.00, 'operational', 'excellent', 'Studio Mix - Main Desk', true),
((SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'API 512c Preamp', 'API', '512c', 'API-11223', 'preamp', 'Préampli microphone API avec transformateur', '{"channels": 1, "gain": "65dB"}', '2023-02-28', 950.00, 'operational', 'excellent', 'Studio Principal - Outboard Rack', true),
((SELECT id FROM rooms WHERE name = 'Studio Master - Mastering'), 'Genelec 8361A', 'Genelec', '8361A', 'GEN-55667', 'monitoring', 'Monitoring actif 3 voies avec GLM', '{"type": "Active 3-way", "woofer": "10 inch", "frequency": "30Hz-43kHz", "spl": "118dB"}', '2023-09-15', 9200.00, 'operational', 'excellent', 'Studio Master - Main Monitors', true),
((SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Gibson Les Paul', 'Gibson', 'Les Paul Standard', 'GIB-88990', 'instrument', 'Guitare électrique Gibson Les Paul heritage cherry', '{"type": "Electric Guitar", "pickups": "BurstBucker", "finish": "Heritage Cherry"}', '2023-03-10', 2800.00, 'operational', 'excellent', 'Studio Principal - Instrument Room', true),
((SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Yamaha C7 Grand Piano', 'Yamaha', 'C7', 'YAM-77665', 'instrument', 'Piano à queue acoustique Yamaha 7 pieds', '{"type": "Acoustic Grand Piano", "size": "7 feet", "finish": "Polished Ebony"}', '2022-11-05', 45000.00, 'operational', 'excellent', 'Studio Principal - Live Room', true),
((SELECT id FROM rooms WHERE name = 'Studio Mix - Mixing'), 'SSL Fusion', 'Solid State Logic', 'Fusion', 'SSL-44556', 'processor', 'Processeur analogique stéréo SSL', '{"type": "Stereo Processor", "modules": "Vintage Drive, Violet EQ, HF Compressor"}', '2023-07-20', 2600.00, 'operational', 'excellent', 'Studio Mix - Master Insert', true);

-- Sessions (8 - mix of past and future)
INSERT INTO sessions (client_id, room_id, title, description, start_time, end_time, status, total_amount, notes) VALUES
((SELECT id FROM clients WHERE email = 'emma.dubois@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Recording album folk', 'Enregistrement voix + guitare acoustique pour album', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '5 hours', 'completed', 400.00, 'Session excellente, très pro'),
((SELECT id FROM clients WHERE email = 'lucas.martin@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Mix - Mixing'), 'Mixage set DJ', 'Mixage et mastering set live 90 min', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '6 hours', 'completed', 420.00, 'Client satisfait du résultat'),
((SELECT id FROM clients WHERE email = 'sarah.petit@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Enregistrement piano solo', 'Session piano Yamaha C7 pour EP jazz', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '4 hours', 'scheduled', 320.00, 'Session planifiée, piano accordé'),
((SELECT id FROM clients WHERE email = 'alex.grand@example.com'), (SELECT id FROM rooms WHERE name = 'Salle Répétition'), 'Répétition groupe blues', 'Répétition avant tournée', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'scheduled', 90.00, 'Groupe régulier'),
((SELECT id FROM clients WHERE email = 'emma.dubois@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Master - Mastering'), 'Mastering album', 'Mastering final album 10 titres', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '8 hours', 'scheduled', 720.00, 'Session importante - deadline label'),
((SELECT id FROM clients WHERE email = 'lucas.martin@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Recording collab', 'Featuring artiste invité track 3', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '4 hours', 'scheduled', 320.00, 'Attente confirmation artiste'),
((SELECT id FROM clients WHERE email = 'sarah.petit@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Mix - Mixing'), 'Mixage EP jazz', 'Mixage 5 titres piano trio', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '10 hours', 'completed', 700.00, 'Mix terminé, client très content'),
((SELECT id FROM clients WHERE email = 'alex.grand@example.com'), (SELECT id FROM rooms WHERE name = 'Studio Principal - Recording'), 'Recording guitare + voix', 'Session acoustique blues', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '3 hours', 'scheduled', 240.00, 'Setup simple, client autonome');

-- Projects (4)
INSERT INTO projects (client_id, name, artist_name, description, genre, type, status, start_date, target_delivery_date, budget, total_cost, track_count) VALUES
((SELECT id FROM clients WHERE email = 'emma.dubois@example.com'), 'Horizons Lointains', 'Emma D', 'Album folk-pop introspectif avec orchestrations', 'Folk Pop', 'album', 'recording', '2024-10-15', '2025-04-01', 12000.00, 5200.00, 10),
((SELECT id FROM clients WHERE email = 'lucas.martin@example.com'), 'Night Sessions Vol.1', 'DJ Lucas', 'EP house progressive 4 tracks', 'House', 'ep', 'mixing', '2024-11-20', '2025-02-15', 5000.00, 3100.00, 4),
((SELECT id FROM clients WHERE email = 'sarah.petit@example.com'), 'Blue Notes', 'Sarah P', 'EP piano jazz trio contemporain', 'Jazz', 'ep', 'mastering', '2024-12-05', '2025-02-28', 4500.00, 3800.00, 5),
((SELECT id FROM clients WHERE email = 'alex.grand@example.com'), 'Delta Road', 'Alex G', 'Single blues acoustique', 'Blues', 'single', 'pre_production', '2025-01-15', '2025-03-10', 1500.00, NULL, 1);

-- Tracks (10)
INSERT INTO tracks (project_id, title, track_number, duration, status, bpm, key, lyrics, notes) VALUES
((SELECT id FROM projects WHERE name = 'Horizons Lointains'), 'Aube Nouvelle', 1, 268, 'mixing', 88, 'G Major', 'Verse 1:\nQuand l''aube se lève sur la colline\nJe pense à toi...', 'Composer: Emma Dubois, Genre: Folk/Pop, Mood: Hopeful, Copyright: Emma D 2025'),
((SELECT id FROM projects WHERE name = 'Horizons Lointains'), 'Chemins Perdus', 2, 215, 'recording', 76, 'Em', NULL, 'Composer: Emma Dubois, Genre: Folk/Indie, Mood: Melancholic'),
((SELECT id FROM projects WHERE name = 'Horizons Lointains'), 'Lumière du Soir', 3, 242, 'pre_production', 92, 'C Major', NULL, 'Composer: Emma Dubois, Genre: Folk Pop, Mood: Peaceful'),
((SELECT id FROM projects WHERE name = 'Night Sessions Vol.1'), 'Midnight Drive', 1, 385, 'mixing', 124, 'Am', NULL, 'Producer: Lucas Martin, Genre: Progressive House, Mood: Energetic, BPM: 124'),
((SELECT id FROM projects WHERE name = 'Night Sessions Vol.1'), 'Dawn Breaking', 2, 402, 'mixing', 126, 'Dm', NULL, 'Producer: Lucas Martin, Genre: Melodic House, Mood: Uplifting'),
((SELECT id FROM projects WHERE name = 'Night Sessions Vol.1'), 'City Lights', 3, 368, 'completed', 128, 'Em', NULL, 'Producer: Lucas Martin, Genre: Deep House, Mood: Atmospheric'),
((SELECT id FROM projects WHERE name = 'Blue Notes'), 'Autumn Waltz', 1, 312, 'mastering', 132, 'F Major', NULL, 'Composer: Sarah Petit, Genre: Jazz/Contemporary, Mood: Romantic, Instrumentation: Piano Trio'),
((SELECT id FROM projects WHERE name = 'Blue Notes'), 'Blue Morning', 2, 285, 'mastering', 96, 'Bb Major', NULL, 'Composer: Sarah Petit, Genre: Jazz, Mood: Contemplative'),
((SELECT id FROM projects WHERE name = 'Blue Notes'), 'Midnight Blue', 3, 348, 'completed', 88, 'Gm', NULL, 'Composer: Sarah Petit, Genre: Jazz/Blues, Mood: Melancholic'),
((SELECT id FROM projects WHERE name = 'Delta Road'), 'Delta Blues', 1, 256, 'pre_production', 72, 'E Blues', 'Intro:\nDown by the delta where the river runs deep\nI got the blues...', 'Composer: Alexandre Grand, Genre: Delta Blues, Mood: Raw');

-- Musicians/Talents (3)
INSERT INTO musicians (name, stage_name, email, phone, bio, talent_type, primary_instrument, instruments, genres, hourly_rate, is_active) VALUES
('Pierre Roussel', 'Pierre R', 'pierre.roussel@example.com', '+33 6 55 66 77 88', 'Bassiste session professionnel 20 ans expérience', 'musician', 'Bass', '["Electric Bass", "Upright Bass", "Fretless"]', '["Jazz", "Funk", "Rock", "Pop"]', 90.00, true),
('Marie Dubois', NULL, 'marie.dubois@example.com', '+33 6 66 77 88 99', 'Ingénieure du son spécialisée mixage mastering', 'musician', 'Engineer', '["Pro Tools", "Logic Pro", "Ableton Live", "Reaper"]', '["All Genres"]', 120.00, true),
('Thomas Laurent', 'Tom L', 'thomas.laurent@example.com', '+33 6 77 88 99 00', 'Batteur session tous styles', 'musician', 'Drums', '["Acoustic Drums", "Electronic Drums", "Percussion"]', '["Rock", "Jazz", "Pop", "Electronic"]', 85.00, true);

-- Invoices (3)
INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, paid_at) VALUES
('INV-2025-101', (SELECT id FROM clients WHERE email = 'emma.dubois@example.com'), '2025-01-02', '2025-02-01', 'paid', 400.00, 20.00, 80.00, 480.00, '2025-01-08'),
('INV-2025-102', (SELECT id FROM clients WHERE email = 'lucas.martin@example.com'), '2025-01-10', '2025-02-09', 'sent', 420.00, 20.00, 84.00, 504.00, NULL),
('INV-2025-103', (SELECT id FROM clients WHERE email = 'sarah.petit@example.com'), '2025-01-15', '2025-02-14', 'sent', 700.00, 20.00, 140.00, 840.00, NULL);

-- Invoice Items (3)
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
((SELECT id FROM invoices WHERE invoice_number = 'INV-2025-101'), 'Recording Studio Principal - 5 heures', 5.00, 80.00, 400.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2025-102'), 'Mixage Studio Mix - 6 heures', 6.00, 70.00, 420.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2025-103'), 'Mixage EP Jazz - 10 heures', 10.00, 70.00, 700.00);

SELECT '✅ Test Studio UI seeded successfully!' as status;
SELECT COUNT(*) as clients FROM clients;
SELECT COUNT(*) as rooms FROM rooms;
SELECT COUNT(*) as equipment FROM equipment;
SELECT COUNT(*) as sessions FROM sessions;
SELECT COUNT(*) as projects FROM projects;
SELECT COUNT(*) as tracks FROM tracks;
SELECT COUNT(*) as musicians FROM musicians;
SELECT COUNT(*) as invoices FROM invoices;
