import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientData } = await request.json();

    console.log('🧪 DEBUG - Test sauvegarde signature:', {
      clientId,
      clientName: clientData?.nomPrenom
    });

    // 1. Vérifier que le client existe
    console.log('1️⃣ Vérification client...');
    const { data: clientInfo, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !clientInfo) {
      console.log('❌ Client non trouvé:', clientError?.message);
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé',
        details: clientError?.message
      }, { status: 404 });
    }

    console.log('✅ Client trouvé:', {
      id: clientInfo.id,
      code: clientInfo.client_code,
      name: `${clientInfo.users.first_name} ${clientInfo.users.last_name}`
    });

    // 2. Vérifier les signatures
    console.log('2️⃣ Vérification signatures...');
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('id, signature_name, is_active, is_default')
      .eq('client_id', clientId);

    console.log('📝 Signatures trouvées:', {
      count: signatures?.length || 0,
      signatures: signatures?.map(s => ({
        id: s.id,
        name: s.signature_name,
        active: s.is_active,
        default: s.is_default
      }))
    });

    if (!signatures || signatures.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune signature trouvée pour ce client',
        clientInfo: {
          id: clientInfo.id,
          name: `${clientInfo.users.first_name} ${clientInfo.users.last_name}`
        }
      }, { status: 400 });
    }

    // 3. Trouver une signature utilisable
    let usableSignature = signatures.find(s => s.is_active && s.is_default);
    if (!usableSignature) {
      usableSignature = signatures.find(s => s.is_active);
    }

    if (!usableSignature) {
      return NextResponse.json({
        success: false,
        error: 'Aucune signature active trouvée',
        signatures: signatures.map(s => ({
          name: s.signature_name,
          active: s.is_active,
          default: s.is_default
        }))
      }, { status: 400 });
    }

    console.log('✅ Signature utilisable:', {
      id: usableSignature.id,
      name: usableSignature.signature_name,
      active: usableSignature.is_active,
      default: usableSignature.is_default
    });

    // 4. Test de création de dossier (simulation)
    console.log('3️⃣ Simulation création dossier...');
    const timestamp = Date.now();
    const caseNumber = `TEST-${new Date().getFullYear()}-${timestamp}`;

    // Simuler la création sans vraiment créer
    const simulatedCase = {
      id: `test-case-${timestamp}`,
      case_number: caseNumber,
      client_id: clientId,
      status: 'signed'
    };

    console.log('✅ Dossier simulé:', simulatedCase);

    return NextResponse.json({
      success: true,
      message: 'Test réussi - Signature et client valides',
      clientInfo: {
        id: clientInfo.id,
        name: `${clientInfo.users.first_name} ${clientInfo.users.last_name}`,
        email: clientInfo.users.email
      },
      signatureInfo: {
        id: usableSignature.id,
        name: usableSignature.signature_name,
        active: usableSignature.is_active,
        default: usableSignature.is_default
      },
      simulatedCase: simulatedCase,
      allSignatures: signatures.map(s => ({
        id: s.id,
        name: s.signature_name,
        active: s.is_active,
        default: s.is_default
      }))
    });

  } catch (error) {
    console.error('💥 Erreur test sauvegarde:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({
      success: false,
      error: 'clientId requis'
    }, { status: 400 });
  }

  // Réutiliser la logique POST pour les vérifications
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientData: { nomPrenom: 'Test' } })
  }));
}
