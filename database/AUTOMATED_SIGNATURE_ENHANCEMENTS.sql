-- ============================================================================
-- ESIGNPRO - AUTOMATED SIGNATURE AND CLIENT FOLDER MANAGEMENT ENHANCEMENTS
-- ============================================================================
-- This script adds the required tables and modifications for the automated
-- signature and multi-folder management system
-- ============================================================================
-- ============================================================================
-- 1. ENHANCE EXISTING TABLES
-- ============================================================================
-- Add has_signature column to clients table for quick lookup
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS has_signature BOOLEAN DEFAULT false;
-- Add signature_count column to track number of signatures per client
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS signature_count INTEGER DEFAULT 0;
-- ============================================================================
-- 2. CREATE NEW TABLES FOR AUTOMATED SIGNATURE SYSTEM
-- ============================================================================
-- Enhanced client_signatures table (if not exists)
CREATE TABLE IF NOT EXISTS public.client_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL,
    -- Base64 encoded signature image
    signature_name VARCHAR(255) DEFAULT 'Signature principale',
    signature_metadata JSONB,
    -- Additional metadata (dimensions, format, etc.)
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    -- Allow multiple signatures per client
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, is_default) -- Only one default signature per client
);
-- Enhanced client_documents_archive table (if not exists)
CREATE TABLE IF NOT EXISTS public.client_documents_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.insurance_cases(id) ON DELETE
    SET NULL,
        template_id UUID REFERENCES public.document_templates(id) ON DELETE
    SET NULL,
        document_name VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        is_signed BOOLEAN DEFAULT false,
        signature_applied_at TIMESTAMP WITH TIME ZONE,
        generated_by UUID REFERENCES public.users(id),
        variables_used JSONB,
        -- Store template variables used
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enhanced document_templates table (if not exists)
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100) NOT NULL,
    -- 'resiliation', 'avenant', 'sinistre', etc.
    template_description TEXT,
    template_file_path TEXT NOT NULL,
    -- Path to template file
    template_variables JSONB NOT NULL,
    -- Required variables for template
    signature_positions JSONB,
    -- Where to place signatures in the document
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Client template preferences table
CREATE TABLE IF NOT EXISTS public.client_template_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, template_id)
);
-- Document generation sessions table for batch operations
CREATE TABLE IF NOT EXISTS public.document_generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    templates_used JSONB NOT NULL,
    -- Array of template IDs used
    documents_generated INTEGER DEFAULT 0,
    documents_signed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress',
    -- 'in_progress', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);
-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Indexes for client_signatures
CREATE INDEX IF NOT EXISTS idx_client_signatures_client_id ON public.client_signatures(client_id);
CREATE INDEX IF NOT EXISTS idx_client_signatures_is_active ON public.client_signatures(is_active);
CREATE INDEX IF NOT EXISTS idx_client_signatures_is_default ON public.client_signatures(is_default);
-- Indexes for client_documents_archive
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_client_id ON public.client_documents_archive(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_case_id ON public.client_documents_archive(case_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_template_id ON public.client_documents_archive(template_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_document_type ON public.client_documents_archive(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_is_signed ON public.client_documents_archive(is_signed);
CREATE INDEX IF NOT EXISTS idx_client_documents_archive_created_at ON public.client_documents_archive(created_at);
-- Indexes for document_templates
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON public.document_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_active ON public.document_templates(is_active);
-- Indexes for client_template_preferences
CREATE INDEX IF NOT EXISTS idx_client_template_preferences_client_id ON public.client_template_preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_client_template_preferences_template_id ON public.client_template_preferences(template_id);
CREATE INDEX IF NOT EXISTS idx_client_template_preferences_is_favorite ON public.client_template_preferences(is_favorite);
-- Indexes for document_generation_sessions
CREATE INDEX IF NOT EXISTS idx_document_generation_sessions_client_id ON public.document_generation_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_document_generation_sessions_agent_id ON public.document_generation_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_document_generation_sessions_status ON public.document_generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_document_generation_sessions_started_at ON public.document_generation_sessions(started_at);
-- Indexes for enhanced clients table
CREATE INDEX IF NOT EXISTS idx_clients_has_signature ON public.clients(has_signature);
CREATE INDEX IF NOT EXISTS idx_clients_signature_count ON public.clients(signature_count);
-- ============================================================================
-- 4. CREATE FUNCTIONS FOR AUTOMATED SIGNATURE MANAGEMENT
-- ============================================================================
-- Function to update client signature status
CREATE OR REPLACE FUNCTION public.update_client_signature_status() RETURNS TRIGGER AS $$ BEGIN -- Update has_signature and signature_count in clients table
UPDATE public.clients
SET has_signature = EXISTS(
        SELECT 1
        FROM public.client_signatures
        WHERE client_id = NEW.client_id
            AND is_active = true
    ),
    signature_count = (
        SELECT COUNT(*)
        FROM public.client_signatures
        WHERE client_id = NEW.client_id
            AND is_active = true
    ),
    updated_at = NOW()
WHERE id = NEW.client_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Function to get client's default signature
CREATE OR REPLACE FUNCTION public.get_client_default_signature(p_client_id UUID) RETURNS TABLE(
        signature_id UUID,
        signature_data TEXT,
        signature_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE
    ) AS $$ BEGIN RETURN QUERY
SELECT cs.id,
    cs.signature_data,
    cs.signature_name,
    cs.created_at
FROM public.client_signatures cs
WHERE cs.client_id = p_client_id
    AND cs.is_active = true
    AND cs.is_default = true
LIMIT 1;
END;
$$ LANGUAGE plpgsql;
-- Function to check if client has signature
CREATE OR REPLACE FUNCTION public.client_has_signature(p_client_id UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS(
        SELECT 1
        FROM public.client_signatures
        WHERE client_id = p_client_id
            AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================
-- Trigger to update client signature status when signature is added/updated
DROP TRIGGER IF EXISTS trigger_update_client_signature_status ON public.client_signatures;
CREATE TRIGGER trigger_update_client_signature_status
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.client_signatures FOR EACH ROW EXECUTE FUNCTION public.update_client_signature_status();
-- ============================================================================
-- 6. INSERT SAMPLE DOCUMENT TEMPLATES
-- ============================================================================
-- Insert predefined document templates
INSERT INTO public.document_templates (
        template_name,
        template_category,
        template_description,
        template_file_path,
        template_variables,
        signature_positions,
        is_active
    )
VALUES (
        'Résiliation LAMal',
        'resiliation',
        'Lettre de résiliation d''assurance maladie de base LAMal',
        '/templates/resiliation_lamal.docx',
        '["client_name", "client_address", "client_npa", "client_ville", "policy_number", "insurance_company", "termination_date", "current_date"]',
        '{"signature_position": "bottom", "signature_label": "Signature personnes majeures:"}',
        true
    ),
    (
        'Résiliation LCA',
        'resiliation',
        'Lettre de résiliation d''assurance complémentaire LCA',
        '/templates/resiliation_lca.docx',
        '["client_name", "client_address", "client_npa", "client_ville", "policy_number", "insurance_company", "termination_date", "current_date"]',
        '{"signature_position": "bottom", "signature_label": "Signature personnes majeures:"}',
        true
    ),
    (
        'Changement d''adresse',
        'modification',
        'Notification de changement d''adresse',
        '/templates/changement_adresse.docx',
        '["client_name", "old_address", "new_address", "client_npa", "client_ville", "policy_number", "insurance_company", "effective_date", "current_date"]',
        '{"signature_position": "bottom", "signature_label": "Signature personnes majeures:"}',
        true
    ) ON CONFLICT DO NOTHING;
-- ============================================================================
-- 7. CREATE VIEWS FOR EASY DATA ACCESS
-- ============================================================================
-- View for client summary with signature status
CREATE OR REPLACE VIEW public.client_summary AS
SELECT c.id as client_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    c.address,
    c.city,
    c.postal_code,
    c.has_signature,
    c.signature_count,
    c.created_at as client_created_at,
    COUNT(ic.id) as total_cases,
    COUNT(
        CASE
            WHEN ic.status = 'completed' THEN 1
        END
    ) as completed_cases,
    MAX(ic.updated_at) as last_case_activity
FROM public.clients c
    JOIN public.users u ON c.user_id = u.id
    LEFT JOIN public.insurance_cases ic ON c.id = ic.client_id
GROUP BY c.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    c.address,
    c.city,
    c.postal_code,
    c.has_signature,
    c.signature_count,
    c.created_at;
-- View for client documents with signature status
CREATE OR REPLACE VIEW public.client_documents_with_signature AS
SELECT cda.*,
    c.has_signature as client_has_signature,
    cs.signature_name,
    cs.is_default as is_default_signature,
    ic.case_number,
    ic.status as case_status,
    u.first_name || ' ' || u.last_name as client_name
FROM public.client_documents_archive cda
    JOIN public.clients c ON cda.client_id = c.id
    JOIN public.users u ON c.user_id = u.id
    LEFT JOIN public.client_signatures cs ON c.id = cs.client_id
    AND cs.is_active = true
    AND cs.is_default = true
    LEFT JOIN public.insurance_cases ic ON cda.case_id = ic.id;
-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================
-- Grant permissions to authenticated users (adjust as needed for your RLS policies)
GRANT ALL ON public.client_signatures TO authenticated;
GRANT ALL ON public.client_documents_archive TO authenticated;
GRANT ALL ON public.document_templates TO authenticated;
GRANT ALL ON public.client_template_preferences TO authenticated;
GRANT ALL ON public.document_generation_sessions TO authenticated;
-- Grant permissions on views
GRANT SELECT ON public.client_summary TO authenticated;
GRANT SELECT ON public.client_documents_with_signature TO authenticated;
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_client_default_signature(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_has_signature(UUID) TO authenticated;
-- ============================================================================
-- SCRIPT COMPLETED SUCCESSFULLY
-- ============================================================================