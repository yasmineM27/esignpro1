-- Migration pour ajouter portal_token permanent aux clients
-- Exécuter dans Supabase SQL Editor

-- Ajouter la colonne portal_token si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'portal_token'
    ) THEN
        ALTER TABLE clients ADD COLUMN portal_token TEXT UNIQUE;
        
        -- Créer un index pour les recherches rapides
        CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token);
        
        -- Générer des portal tokens pour les clients existants
        UPDATE clients 
        SET portal_token = 'PORTAL_' || client_code || '_' || EXTRACT(EPOCH FROM NOW())::bigint || '_' || substr(md5(random()::text), 1, 10)
        WHERE portal_token IS NULL;
        
        RAISE NOTICE 'Colonne portal_token ajoutée et tokens générés pour les clients existants';
    ELSE
        RAISE NOTICE 'Colonne portal_token existe déjà';
    END IF;
END $$;

-- Vérifier les résultats
SELECT 
    id,
    client_code,
    portal_token,
    created_at
FROM clients 
WHERE portal_token IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
