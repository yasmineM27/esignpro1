-- Ajouter la colonne password_hash à la table users si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_hash VARCHAR(255);
        COMMENT ON COLUMN public.users.password_hash IS 'Hash bcrypt du mot de passe utilisateur';
    END IF;
END $$;

-- Créer un index sur password_hash pour les performances
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);

-- Mettre à jour les commentaires de la table
COMMENT ON TABLE public.users IS 'Table des utilisateurs avec authentification par mot de passe';
