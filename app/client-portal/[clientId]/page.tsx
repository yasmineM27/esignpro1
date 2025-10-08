import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import EnhancedClientPortal from '@/components/enhanced-client-portal';

// Types
interface ClientPortalPageProps {
  params: Promise<{ clientId: string }>;
}

interface CaseData {
  id: string;
  case_number: string;
  secure_token: string;
  status: string;
  insurance_company: string;
  policy_number: string;
  policy_type?: string;
  termination_date?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface DocumentData {
  id: string;
  documenttype: string;
  filename: string;
  status: string;
  uploaddate: string;
}

// Fonction pour récupérer les données du dossier avec informations client complètes
async function getCaseData(token: string): Promise<CaseData | null> {
  try {
    console.log('🔍 Récupération données dossier pour token:', token);
    const { supabaseAdmin } = require('@/lib/supabase');

    // Récupérer le dossier d'abord
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, secure_token, status, insurance_company, policy_number, policy_type, termination_date, expires_at, created_at, updated_at, client_id')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Erreur récupération dossier:', caseError);
      console.error('❌ Token non trouvé:', token);
      return null;
    }

    console.log('✅ Dossier trouvé:', {
      id: caseData.id,
      case_number: caseData.case_number,
      status: caseData.status
    });

    // Récupérer le client
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', caseData.client_id)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Erreur récupération client:', clientError);
      return null;
    }

    // Récupérer l'utilisateur
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email, phone')
      .eq('id', clientData.user_id)
      .single();

    if (userError || !userData) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return null;
    }

    console.log('✅ Client trouvé:', `${userData.first_name} ${userData.last_name}`);

    return {
      id: caseData.id,
      case_number: caseData.case_number,
      secure_token: caseData.secure_token,
      status: caseData.status,
      insurance_company: caseData.insurance_company || '',
      policy_number: caseData.policy_number || '',
      policy_type: caseData.policy_type || '',
      termination_date: caseData.termination_date,
      client_name: `${userData.first_name} ${userData.last_name}`,
      client_email: userData.email,
      client_phone: userData.phone,
      expires_at: caseData.expires_at,
      created_at: caseData.created_at,
      updated_at: caseData.updated_at
    };
  } catch (error) {
    console.error('Erreur connexion base:', error);
    return null;
  }
}

// Fonction pour récupérer les documents
async function getDocuments(token: string): Promise<DocumentData[]> {
  try {
    const { supabaseAdmin } = require('@/lib/supabase');

    const { data, error } = await supabaseAdmin
      .from('client_documents')
      .select('id, documenttype, filename, status, uploaddate')
      .eq('token', token)
      .order('uploaddate', { ascending: false });

    if (error) {
      console.error('Erreur récupération documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération documents:', error);
    return [];
  }
}

// Ancienne interface supprimée - remplacée par EnhancedClientPortal

// Composant principal de la page
export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { clientId: token } = await params;

  // Validation du token
  if (!token || typeof token !== 'string') {
    console.error('Token invalide:', token);
    notFound();
  }

  // Récupération des données
  console.log('🔍 Récupération données portail pour token:', token);

  const caseData = await getCaseData(token);
  if (!caseData) {
    console.error('❌ Dossier non trouvé pour le token:', token);
    notFound();
  }

  console.log('✅ Données dossier récupérées:', {
    case_number: caseData.case_number,
    client_name: caseData.client_name,
    status: caseData.status
  });

  const documents = await getDocuments(token);
  console.log(`✅ ${documents.length} document(s) récupéré(s)`);

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Chargement de votre dossier...
      </div>
    }>
      <EnhancedClientPortal
        caseData={caseData}
        documents={documents}
        token={token}
      />
    </Suspense>
  );
}
