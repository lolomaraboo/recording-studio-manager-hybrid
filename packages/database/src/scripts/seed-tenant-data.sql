-- Seed data for tenant database (Test Studio Match - tenant_3)
-- Run with: psql -U postgres -d tenant_3 < seed-tenant-data.sql

BEGIN;

-- Clients
INSERT INTO clients (name, artist_name, email, phone, type, address, city, country, notes, is_vip, portal_access) VALUES
('Sophie Martin', 'Sophie M', 'sophie.martin@example.com', '+33 6 12 34 56 78', 'individual', '15 rue de la Musique', 'Paris', 'France', 'Singer-songwriter, préfère les sessions matinales', true, true),
('Marc Dubois', 'MC Dubz', 'marc.dubois@example.com', '+33 6 23 45 67 89', 'individual', '42 avenue du Hip-Hop', 'Lyon', 'France', 'Rappeur, très pointilleux sur le mixage', true, true),
('Production Sonore SARL', NULL, 'contact@production-sonore.fr', '+33 1 42 56 78 90', 'company', '89 boulevard des Productions', 'Paris', 'France', 'Studio partenaire, réservations régulières', false, false),
('Julie Leroux', 'Julie L', 'julie.leroux@example.com', '+33 6 34 56 78 90', 'individual', '23 rue des Artistes', 'Marseille', 'France', 'Compositrice de musique électronique', false, true),
('Thomas Bernard', 'Tom B', 'thomas.bernard@example.com', '+33 6 45 67 89 01', 'individual', '56 allée du Rock', 'Toulouse', 'France', 'Guitariste de rock, aime expérimenter', false, true);

-- Rooms
INSERT INTO rooms (name, description, type, hourly_rate, half_day_rate, full_day_rate, capacity, size, has_isolation_booth, has_live_room, has_control_room, color, is_active, is_available_for_booking) VALUES
('Studio A - Recording', 'Grande salle d''enregistrement avec isolation acoustique professionnelle', 'recording', 75.00, 280.00, 500.00, 8, 45, true, true, true, '#e74c3c', true, true),
('Studio B - Mixing', 'Salle de mixage équipée d''un système de monitoring de haute qualité', 'mixing', 60.00, 220.00, 400.00, 4, 30, false, false, true, '#3498db', true, true),
('Studio C - Mastering', 'Salle de mastering avec traitement acoustique premium', 'mastering', 80.00, 300.00, 550.00, 2, 20, false, false, true, '#2ecc71', true, true),
('Rehearsal Room', 'Salle de répétition pour groupes et musiciens', 'rehearsal', 25.00, 90.00, 150.00, 6, 35, false, true, false, '#f39c12', true, true);

-- Equipment
INSERT INTO equipment (room_id, name, brand, model, serial_number, category, description, specifications, purchase_date, purchase_price, status, condition, location, is_available) VALUES
(1, 'Neumann U87', 'Neumann', 'U87 Ai', 'U87-12345', 'microphone', 'Microphone à condensateur large diaphragme, son classique chaleureux', '{"type": "Condenser", "pattern": "Multi-pattern", "frequency": "20Hz-20kHz"}', '2022-03-15', 3200.00, 'operational', 'excellent', 'Studio A - Rack 1', true),
(1, 'Shure SM57', 'Shure', 'SM57', 'SM57-67890', 'microphone', 'Microphone dynamique cardioïde, parfait pour guitares et snare', '{"type": "Dynamic", "pattern": "Cardioid", "frequency": "40Hz-15kHz"}', '2021-06-20', 120.00, 'operational', 'good', 'Studio A - Mic Locker', true),
(2, 'Universal Audio Apollo x8', 'Universal Audio', 'Apollo x8', 'APX8-11223', 'interface', 'Interface audio Thunderbolt 3 avec convertisseurs Elite, 18x24', '{"inputs": 18, "outputs": 24, "connection": "Thunderbolt 3", "sampleRate": "192kHz"}', '2023-01-10', 2800.00, 'operational', 'excellent', 'Studio B - Main Desk', true),
(1, 'Neve 1073 Preamp', 'Neve', '1073', 'NEVE-99887', 'preamp', 'Préampli micro/ligne avec égaliseur 3 bandes, son légendaire', '{"channels": 1, "eq": "3-band", "gain": "80dB"}', '2022-09-05', 3500.00, 'operational', 'excellent', 'Studio A - Outboard Rack', true),
(3, 'Genelec 8351B', 'Genelec', '8351B', 'GEN-44556', 'monitoring', 'Monitoring actif 3 voies avec correction acoustique SAM, paire', '{"type": "Active 3-way", "woofer": "10 inch", "frequency": "32Hz-40kHz", "spl": "113dB"}', '2023-05-18', 8400.00, 'operational', 'excellent', 'Studio C - Main Monitors', true),
(1, 'Fender Stratocaster', 'Fender', 'American Professional II Stratocaster', 'FEND-77889', 'instrument', 'Guitare électrique Stratocaster, sunburst', '{"type": "Electric Guitar", "pickups": "V-Mod II Single-Coil", "finish": "3-Color Sunburst"}', '2022-11-22', 1700.00, 'operational', 'good', 'Studio A - Instrument Room', true);

-- Sessions
INSERT INTO sessions (client_id, room_id, title, description, start_time, end_time, status, total_amount, deposit_amount, deposit_paid, payment_status) VALUES
(1, 1, 'Enregistrement vocal album', 'Session d''enregistrement des voix principales pour l''album', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '4 hours', 'completed', 300.00, 90.00, true, 'paid'),
(2, 2, 'Mixage EP', 'Mixage de 4 titres pour l''EP', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '8 hours', 'completed', 480.00, 144.00, true, 'paid'),
(4, 1, 'Session découverte', 'Première session d''enregistrement', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', 'scheduled', 150.00, 45.00, true, 'partial'),
(5, 4, 'Répétition groupe', 'Répétition avant concert', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '3 hours', 'scheduled', 75.00, 22.50, false, 'unpaid');

-- Projects
INSERT INTO projects (client_id, name, artist_name, description, genre, type, status, start_date, target_delivery_date, budget, total_cost, track_count) VALUES
(1, 'Lumière d''Été', 'Sophie M', 'Album folk-pop avec influences électroniques', 'Folk Pop', 'album', 'recording', '2024-11-01', '2025-03-15', 8000.00, 3200.00, 10),
(2, 'Urban Stories', 'MC Dubz', 'EP de rap conscient avec productions originales', 'Hip-Hop', 'ep', 'mixing', '2024-12-01', '2025-02-01', 3500.00, 2100.00, 4),
(4, 'Midnight Sessions', 'Julie L', 'Single électro ambient', 'Electronic', 'single', 'pre_production', '2025-01-10', '2025-02-28', 1200.00, NULL, 1);

-- Tracks
INSERT INTO tracks (project_id, title, track_number, duration, status, bpm, key, lyrics, composer, lyricist, copyright_holder, copyright_year, genre_tags, mood, language, explicit_content, instruments_used, microphones_used, recorded_in_room_id) VALUES
(1, 'Soleil Levant', 1, 245, 'mixing', 95, 'D Major', 'Verse 1:\nLe soleil se lève doucement\nSur les toits de la ville endormie...', 'Sophie Martin', 'Sophie Martin', 'Sophie Martin', 2025, '["Folk", "Pop", "Indie"]', 'Uplifting', 'fr', false, '["Acoustic Guitar", "Piano", "Vocals"]', '["Neumann U87", "Shure SM7B"]', 1),
(1, 'Océan Intérieur', 2, 198, 'recording', 72, 'Am', NULL, 'Sophie Martin', NULL, 'Sophie Martin', 2025, '["Folk", "Ambient"]', 'Melancholic', 'fr', false, NULL, NULL, 1),
(2, 'Rue de la Liberté', 1, 212, 'mixing', 90, 'Cm', 'Intro:\nYeah, yeah, c''est MC Dubz\nRue de la liberté...', 'Marc Dubois', 'Marc Dubois', 'Marc Dubois', 2025, '["Hip-Hop", "Rap", "Conscious"]', 'Energetic', 'fr', false, '["MPC", "Bass", "Keys"]', NULL, 1),
(2, 'Mirages Urbains', 2, 185, 'completed', 85, 'Gm', NULL, 'Marc Dubois', 'Marc Dubois', 'Marc Dubois', 2025, '["Hip-Hop", "Trap"]', 'Dark', 'fr', false, NULL, NULL, 1);

-- Musicians
INSERT INTO musicians (name, stage_name, email, phone, bio, talent_type, primary_instrument, instruments, genres, hourly_rate, is_active) VALUES
('Antoine Rousseau', 'Tony R', 'antoine.rousseau@example.com', '+33 6 78 90 12 34', 'Guitariste professionnel avec 15 ans d''expérience en studio', 'musician', 'Guitar', '["Electric Guitar", "Acoustic Guitar", "Bass"]', '["Rock", "Pop", "Blues"]', 80.00, true),
('Claire Moreau', NULL, 'claire.moreau@example.com', '+33 6 89 01 23 45', 'Ingénieure du son spécialisée en mixage et mastering', 'musician', 'Engineer', '["Pro Tools", "Logic Pro", "Ableton Live"]', '["All Genres"]', 100.00, true);

-- Invoices
INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, paid_at) VALUES
('INV-2025-001', 1, '2025-01-05', '2025-02-04', 'paid', 300.00, 20.00, 60.00, 360.00, '2025-01-10'),
('INV-2025-002', 2, '2025-01-12', '2025-02-11', 'sent', 480.00, 20.00, 96.00, 576.00, NULL);

-- Invoice Items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
(1, 'Enregistrement Studio A - 4 heures', 4.00, 75.00, 300.00),
(2, 'Mixage Studio B - 8 heures', 8.00, 60.00, 480.00);

-- Expenses
INSERT INTO expenses (category, description, vendor, amount, currency, tax_amount, expense_date, paid_at, payment_method, reference_number, status, is_recurring) VALUES
('utilities', 'Électricité studio - Décembre 2024', 'EDF', 450.00, 'EUR', 90.00, '2024-12-31', '2025-01-05', 'bank_transfer', 'EDF-2024-12', 'paid', true),
('maintenance', 'Maintenance console SSL', 'SSL France', 850.00, 'EUR', 170.00, '2025-01-10', '2025-01-10', 'card', 'SSL-MNT-2025-01', 'paid', false);

-- Notifications
INSERT INTO notifications (type, priority, title, message, action_url, action_label, is_read, session_id) VALUES
('reminder', 'high', 'Session à venir', 'Rappel: Session d''enregistrement demain à 10h00', '/sessions/3', 'Voir la session', false, 3),
('success', 'normal', 'Paiement reçu', 'Paiement de 360.00€ reçu de Sophie Martin', NULL, NULL, true, NULL);

-- Client Portal Accounts
INSERT INTO client_portal_accounts (client_id, email, email_verified, email_verified_at, last_login_at, login_count, is_active, is_locked) VALUES
(1, 'sophie.martin@example.com', true, '2024-11-15', '2025-01-15', 23, true, false),
(2, 'marc.dubois@example.com', true, '2024-12-01', '2025-01-14', 15, true, false);

COMMIT;

-- Display summary
SELECT 'Seed completed!' AS status;
SELECT COUNT(*) AS clients FROM clients;
SELECT COUNT(*) AS rooms FROM rooms;
SELECT COUNT(*) AS equipment FROM equipment;
SELECT COUNT(*) AS sessions FROM sessions;
SELECT COUNT(*) AS projects FROM projects;
SELECT COUNT(*) AS tracks FROM tracks;
SELECT COUNT(*) AS musicians FROM musicians;
SELECT COUNT(*) AS invoices FROM invoices;
