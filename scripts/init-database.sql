-- ============================================================================
-- ESIGNPRO - INITIALISATION BASE DE DONNÉES
-- ============================================================================
-- Ce script initialise les données de base nécessaires pour l'application
-- ============================================================================

-- Insérer un agent par défaut si il n'existe pas
INSERT INTO public.agents (
    id,
    user_id,
    agent_code,
    department,
    is_supervisor,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    NULL,
    'WH001',
    'Résiliation',
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insérer un utilisateur agent par défaut si il n'existe pas
INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'agent@esignpro.ch',
    'Wael',
    'Hamda',
    '+41 79 123 45 67',
    'agent',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Lier l'agent à l'utilisateur
UPDATE public.agents 
SET user_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id = '550e8400-e29b-41d4-a716-446655440001' AND user_id IS NULL;

-- Insérer des compagnies d'assurance par défaut
INSERT INTO public.insurance_companies (
    name,
    email,
    phone,
    address,
    contact_person,
    is_active
) VALUES 
(
    'CSS Assurance',
    'resiliation@css.ch',
    '+41 58 277 11 11',
    'Tribschenstrasse 21, 6002 Lucerne',
    'Service Résiliation',
    true
),
(
    'Helsana',
    'resiliation@helsana.ch',
    '+41 844 80 81 82',
    'Austrasse 2, 8045 Zürich',
    'Service Client',
    true
),
(
    'Swica',
    'resiliation@swica.ch',
    '+41 52 244 22 00',
    'Römerstrasse 38, 8401 Winterthur',
    'Service Résiliation',
    true
) ON CONFLICT (name) DO NOTHING;

-- Insérer des templates d'email par défaut
INSERT INTO public.email_templates (
    name,
    subject,
    body_html,
    body_text,
    template_type,
    is_active
) VALUES 
(
    'signature_request',
    '🔐 Signature requise - Dossier {{case_number}}',
    '<html><body><h2>Bonjour {{client_name}},</h2><p>Votre dossier de résiliation est prêt pour signature.</p><p><a href="{{portal_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Signer maintenant</a></p><p>Cordialement,<br>L''équipe eSignPro</p></body></html>',
    'Bonjour {{client_name}}, votre dossier {{case_number}} est prêt pour signature. Lien: {{portal_link}}',
    'signature_request',
    true
),
(
    'signature_completed',
    '✅ Signature confirmée - Dossier {{case_number}}',
    '<html><body><h2>Signature confirmée</h2><p>Votre dossier {{case_number}} a été signé avec succès.</p><p>Merci pour votre confiance.</p></body></html>',
    'Votre dossier {{case_number}} a été signé avec succès.',
    'signature_completed',
    true
) ON CONFLICT (name) DO NOTHING;

-- Insérer des paramètres système par défaut
INSERT INTO public.system_settings (
    key,
    value,
    description,
    is_public
) VALUES 
(
    'app_name',
    'eSignPro',
    'Nom de l''application',
    true
),
(
    'app_version',
    '2.0.0',
    'Version de l''application',
    true
),
(
    'max_file_size',
    '10485760',
    'Taille maximale des fichiers en bytes (10MB)',
    false
),
(
    'allowed_file_types',
    'pdf,jpg,jpeg,png,doc,docx',
    'Types de fichiers autorisés',
    false
),
(
    'signature_expiry_days',
    '30',
    'Nombre de jours avant expiration d''un lien de signature',
    false
) ON CONFLICT (key) DO NOTHING;

-- Créer des vues utiles
CREATE OR REPLACE VIEW public.client_summary AS
SELECT 
    c.id,
    c.client_code,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    c.date_of_birth,
    c.address,
    c.city,
    c.postal_code,
    c.country,
    c.has_signature,
    c.signature_count,
    c.created_at,
    c.updated_at,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    CASE 
        WHEN c.has_signature THEN 'Signature disponible'
        ELSE 'Aucune signature'
    END as signature_status
FROM public.clients c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.role = 'client';

-- Créer une vue pour les documents avec signatures
CREATE OR REPLACE VIEW public.client_documents_with_signature AS
SELECT 
    cda.*,
    cs.signature_data,
    cs.signature_name,
    cs.is_default as is_default_signature
FROM public.client_documents_archive cda
LEFT JOIN public.client_signatures cs ON cda.client_id = cs.client_id AND cs.is_active = true;

-- Fonction pour mettre à jour automatiquement le statut des signatures client
CREATE OR REPLACE FUNCTION public.update_client_signature_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le compteur et le statut de signature du client
    UPDATE public.clients 
    SET 
        signature_count = (
            SELECT COUNT(*) 
            FROM public.client_signatures 
            WHERE client_id = NEW.client_id AND is_active = true
        ),
        has_signature = true,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour automatiquement le statut
DROP TRIGGER IF EXISTS trigger_update_client_signature_status ON public.client_signatures;
CREATE TRIGGER trigger_update_client_signature_status
    AFTER INSERT OR UPDATE OR DELETE ON public.client_signatures
    FOR EACH ROW EXECUTE FUNCTION public.update_client_signature_status();

-- Fonction pour récupérer la signature par défaut d'un client
CREATE OR REPLACE FUNCTION public.get_client_default_signature(client_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    signature_data TEXT;
BEGIN
    SELECT cs.signature_data INTO signature_data
    FROM public.client_signatures cs
    WHERE cs.client_id = client_uuid 
    AND cs.is_active = true 
    AND cs.is_default = true
    LIMIT 1;
    
    -- Si pas de signature par défaut, prendre la plus récente
    IF signature_data IS NULL THEN
        SELECT cs.signature_data INTO signature_data
        FROM public.client_signatures cs
        WHERE cs.client_id = client_uuid 
        AND cs.is_active = true
        ORDER BY cs.created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN signature_data;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un client a une signature
CREATE OR REPLACE FUNCTION public.client_has_signature(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_sig BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM public.client_signatures 
        WHERE client_id = client_uuid AND is_active = true
    ) INTO has_sig;
    
    RETURN has_sig;
END;
$$ LANGUAGE plpgsql;

-- Accorder les permissions nécessaires
GRANT SELECT ON public.client_summary TO authenticated;
GRANT SELECT ON public.client_documents_with_signature TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_default_signature(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_has_signature(UUID) TO authenticated;

-- ============================================================================
-- SCRIPT D'INITIALISATION TERMINÉ
-- ============================================================================
