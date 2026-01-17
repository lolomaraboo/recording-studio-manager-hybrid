-- Add a company with multiple contacts to Test Studio UI (tenant_16)
\c tenant_16

-- Insert a music production company
INSERT INTO clients (
  name,
  type,
  email,
  phone,
  address,
  street,
  city,
  postal_code,
  region,
  country,
  notes,
  is_vip,
  portal_access,
  logo_url,
  websites,
  created_at,
  updated_at
) VALUES (
  'Mélodie Productions SAS',
  'company',
  'info@melodie-productions.fr',
  '+33 1 42 68 75 90',
  '156 avenue des Champs-Élysées',
  '156 avenue des Champs-Élysées',
  'Paris',
  '75008',
  'Île-de-France',
  'France',
  'Grosse boîte de production musicale, gère plusieurs labels et artistes. Budget important, projets d''envergure.',
  true,
  true,
  'https://via.placeholder.com/200x200.png?text=Melodie+Productions',
  '[{"type": "work", "url": "https://melodie-productions.fr"}, {"type": "linkedin", "url": "https://linkedin.com/company/melodie-productions"}]'::jsonb,
  NOW(),
  NOW()
) RETURNING id;

-- Get the client ID (will be the highest ID)
DO $$
DECLARE
  v_client_id INT;
BEGIN
  -- Get the ID of the company we just created
  SELECT id INTO v_client_id FROM clients WHERE name = 'Mélodie Productions SAS';

  -- Insert primary contact (CEO)
  INSERT INTO client_contacts (
    client_id,
    first_name,
    last_name,
    title,
    email,
    phone,
    is_primary,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    'Philippe',
    'Moreau',
    'PDG / CEO',
    'p.moreau@melodie-productions.fr',
    '+33 6 12 34 56 78',
    true,
    NOW(),
    NOW()
  );

  -- Insert artistic director
  INSERT INTO client_contacts (
    client_id,
    first_name,
    last_name,
    title,
    email,
    phone,
    is_primary,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    'Sophie',
    'Laurent',
    'Directrice Artistique',
    's.laurent@melodie-productions.fr',
    '+33 6 23 45 67 89',
    false,
    NOW(),
    NOW()
  );

  -- Insert studio manager
  INSERT INTO client_contacts (
    client_id,
    first_name,
    last_name,
    title,
    email,
    phone,
    is_primary,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    'Marc',
    'Dubois',
    'Responsable Booking',
    'm.dubois@melodie-productions.fr',
    '+33 6 34 56 78 90',
    false,
    NOW(),
    NOW()
  );

  -- Insert accounting contact
  INSERT INTO client_contacts (
    client_id,
    first_name,
    last_name,
    title,
    email,
    phone,
    is_primary,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    'Isabelle',
    'Bernard',
    'Directrice Financière (CFO)',
    'i.bernard@melodie-productions.fr',
    '+33 6 45 67 89 01',
    false,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Company created with ID % and 4 contacts added', v_client_id;
END $$;
