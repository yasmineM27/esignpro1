import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test des signatures en base de données...');

    // 1. Récupérer tous les clients
    const { data: clients, error: clientsError } = await supabaseAdmin
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
      .order('created_at', { ascending: false })
      .limit(20); // Limiter à 20 clients pour le test

    if (clientsError) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des clients'
      }, { status: 500 });
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        signatures: [],
        message: 'Aucun client trouvé dans la base de données'
      });
    }

    console.log(`✅ ${clients.length} clients récupérés`);

    // 2. Pour chaque client, récupérer ses signatures
    const clientIds = clients.map(c => c.id);
    
    const { data: signatures, error: signaturesError } = await supabaseAdmin
      .from('client_signatures')
      .select(`
        id,
        client_id,
        signature_name,
        is_active,
        is_default,
        created_at
      `)
      .in('client_id', clientIds)
      .order('created_at', { ascending: false });

    if (signaturesError) {
      console.error('❌ Erreur récupération signatures:', signaturesError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des signatures'
      }, { status: 500 });
    }

    console.log(`✅ ${signatures?.length || 0} signatures récupérées`);

    // 3. Organiser les données par client
    const signaturesByClient = new Map();
    
    if (signatures) {
      signatures.forEach(sig => {
        if (!signaturesByClient.has(sig.client_id)) {
          signaturesByClient.set(sig.client_id, []);
        }
        signaturesByClient.get(sig.client_id).push({
          id: sig.id,
          signature_name: sig.signature_name,
          is_active: sig.is_active,
          is_default: sig.is_default,
          created_at: sig.created_at
        });
      });
    }

    // 4. Formater les résultats
    const result = clients.map(client => ({
      clientId: client.id,
      clientCode: client.client_code,
      clientName: `${client.users.first_name} ${client.users.last_name}`,
      clientEmail: client.users.email,
      signatures: signaturesByClient.get(client.id) || []
    }));

    // 5. Statistiques
    const stats = {
      totalClients: result.length,
      clientsWithSignatures: result.filter(c => c.signatures.length > 0).length,
      clientsWithoutSignatures: result.filter(c => c.signatures.length === 0).length,
      totalSignatures: result.reduce((total, c) => total + c.signatures.length, 0),
      activeSignatures: result.reduce((total, c) => 
        total + c.signatures.filter(s => s.is_active).length, 0
      ),
      defaultSignatures: result.reduce((total, c) => 
        total + c.signatures.filter(s => s.is_default).length, 0
      )
    };

    console.log('📊 Statistiques signatures:', stats);

    return NextResponse.json({
      success: true,
      signatures: result,
      stats: stats,
      message: `${stats.totalClients} clients analysés, ${stats.clientsWithSignatures} avec signatures`
    });

  } catch (error) {
    console.error('❌ Erreur test signatures:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors du test des signatures'
    }, { status: 500 });
  }
}

// Endpoint pour créer une signature de test
export async function POST(request: NextRequest) {
  try {
    const { clientId, signatureData, signatureName = 'Signature de test' } = await request.json();

    if (!clientId || !signatureData) {
      return NextResponse.json({
        success: false,
        error: 'clientId et signatureData requis'
      }, { status: 400 });
    }

    console.log('💾 Création signature de test pour client:', clientId);

    // Vérifier que le client existe
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, users!inner(first_name, last_name)')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Créer la signature
    const { data: signature, error: signatureError } = await supabaseAdmin
      .from('client_signatures')
      .insert({
        client_id: clientId,
        signature_data: signatureData,
        signature_name: signatureName,
        is_active: true,
        is_default: true,
        signature_metadata: {
          created_by: 'test-api',
          test_signature: true
        }
      })
      .select()
      .single();

    if (signatureError) {
      console.error('❌ Erreur création signature:', signatureError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création de la signature'
      }, { status: 500 });
    }

    console.log('✅ Signature de test créée:', signature.id);

    return NextResponse.json({
      success: true,
      signature: signature,
      message: `Signature de test créée pour ${client.users.first_name} ${client.users.last_name}`
    });

  } catch (error) {
    console.error('❌ Erreur création signature test:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
