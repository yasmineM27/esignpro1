import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la migration des signatures...');

    // 1. Récupérer toutes les signatures de l'ancienne table
    const { data: oldSignatures, error: oldSigError } = await supabaseAdmin
      .from('signatures')
      .select(`
        id,
        case_id,
        signature_data,
        signed_at,
        is_valid,
        insurance_cases!inner(
          id,
          client_id,
          case_number,
          clients!inner(
            id,
            users!inner(
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .not('signature_data', 'is', null)
      .eq('is_valid', true)
      .order('signed_at', { ascending: false });

    if (oldSigError) {
      console.error('❌ Erreur récupération anciennes signatures:', oldSigError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des anciennes signatures'
      }, { status: 500 });
    }

    if (!oldSignatures || oldSignatures.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune signature à migrer',
        migrated: 0
      });
    }

    console.log(`✅ ${oldSignatures.length} signatures trouvées dans l'ancienne table`);

    // 2. Grouper les signatures par client (garder la plus récente par client)
    const signaturesByClient = new Map();
    
    oldSignatures.forEach(sig => {
      const clientId = sig.insurance_cases.client_id;
      const clientName = `${sig.insurance_cases.clients.users.first_name} ${sig.insurance_cases.clients.users.last_name}`;
      
      if (!signaturesByClient.has(clientId)) {
        signaturesByClient.set(clientId, {
          clientId,
          clientName,
          email: sig.insurance_cases.clients.users.email,
          signature: sig,
          caseNumber: sig.insurance_cases.case_number
        });
      }
      // Garder la signature la plus récente (déjà trié par signed_at desc)
    });

    console.log(`📊 ${signaturesByClient.size} clients uniques avec signatures`);

    // 3. Vérifier quelles signatures existent déjà dans la nouvelle table
    const clientIds = Array.from(signaturesByClient.keys());
    const { data: existingSignatures, error: existingError } = await supabaseAdmin
      .from('client_signatures')
      .select('client_id')
      .in('client_id', clientIds);

    if (existingError) {
      console.error('❌ Erreur vérification signatures existantes:', existingError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification des signatures existantes'
      }, { status: 500 });
    }

    const existingClientIds = new Set(existingSignatures?.map(s => s.client_id) || []);
    console.log(`📋 ${existingClientIds.size} clients ont déjà des signatures dans la nouvelle table`);

    // 4. Migrer les signatures manquantes
    const toMigrate = Array.from(signaturesByClient.values())
      .filter(item => !existingClientIds.has(item.clientId));

    if (toMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Toutes les signatures sont déjà migrées',
        migrated: 0,
        existing: existingClientIds.size
      });
    }

    console.log(`🔄 Migration de ${toMigrate.length} signatures...`);

    const migratedSignatures = [];
    const errors = [];

    for (const item of toMigrate) {
      try {
        const { data: newSignature, error: insertError } = await supabaseAdmin
          .from('client_signatures')
          .insert({
            client_id: item.clientId,
            signature_data: item.signature.signature_data,
            signature_name: `Signature migrée (${item.caseNumber})`,
            signature_metadata: {
              migrated_from: 'signatures_table',
              original_signature_id: item.signature.id,
              original_case_id: item.signature.case_id,
              original_signed_at: item.signature.signed_at,
              case_number: item.caseNumber
            },
            is_active: true,
            is_default: true,
            created_at: item.signature.signed_at,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Erreur migration ${item.clientName}:`, insertError);
          errors.push({
            client: item.clientName,
            error: insertError.message
          });
        } else {
          console.log(`✅ Migré: ${item.clientName}`);
          migratedSignatures.push({
            clientId: item.clientId,
            clientName: item.clientName,
            signatureId: newSignature.id
          });
        }
      } catch (error) {
        console.error(`❌ Erreur migration ${item.clientName}:`, error);
        errors.push({
          client: item.clientName,
          error: error.message
        });
      }
    }

    console.log(`🎉 Migration terminée: ${migratedSignatures.length} succès, ${errors.length} erreurs`);

    return NextResponse.json({
      success: true,
      message: `Migration terminée: ${migratedSignatures.length} signatures migrées`,
      migrated: migratedSignatures.length,
      existing: existingClientIds.size,
      errors: errors.length,
      details: {
        migratedSignatures,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Erreur migration signatures:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la migration'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint pour vérifier l'état de la migration
    console.log('🔍 Vérification état migration signatures...');

    // Compter les signatures dans l'ancienne table
    const { count: oldCount, error: oldCountError } = await supabaseAdmin
      .from('signatures')
      .select('*', { count: 'exact', head: true })
      .not('signature_data', 'is', null)
      .eq('is_valid', true);

    // Compter les signatures dans la nouvelle table
    const { count: newCount, error: newCountError } = await supabaseAdmin
      .from('client_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (oldCountError || newCountError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du comptage des signatures'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      oldSignatures: oldCount || 0,
      newSignatures: newCount || 0,
      needsMigration: (oldCount || 0) > (newCount || 0),
      message: `${oldCount || 0} signatures dans l'ancienne table, ${newCount || 0} dans la nouvelle`
    });

  } catch (error) {
    console.error('❌ Erreur vérification migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
