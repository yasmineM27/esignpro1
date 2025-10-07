import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic des signatures clients...');

    // 1. Récupérer tous les clients avec leurs signatures
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email
        )
      `);

    if (clientError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération clients',
        details: clientError.message
      }, { status: 500 });
    }

    // 2. Récupérer toutes les signatures
    const { data: allSignatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('*');

    if (sigError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération signatures',
        details: sigError.message
      }, { status: 500 });
    }

    // 3. Analyser les problèmes
    const problems = [];
    const clientSignatureMap = new Map();

    // Grouper les signatures par client
    allSignatures?.forEach(sig => {
      if (!clientSignatureMap.has(sig.client_id)) {
        clientSignatureMap.set(sig.client_id, []);
      }
      clientSignatureMap.get(sig.client_id).push(sig);
    });

    // Analyser chaque client
    clients?.forEach(client => {
      const clientName = `${client.users.first_name} ${client.users.last_name}`;
      const signatures = clientSignatureMap.get(client.id) || [];
      
      if (signatures.length > 0) {
        const activeSignatures = signatures.filter(s => s.is_active);
        const defaultSignatures = signatures.filter(s => s.is_default);
        
        // Problème 1: Signatures inactives
        if (activeSignatures.length === 0) {
          problems.push({
            type: 'inactive_signatures',
            clientId: client.id,
            clientName: clientName,
            clientCode: client.client_code,
            issue: 'Toutes les signatures sont inactives',
            signatures: signatures.map(s => ({
              id: s.id,
              name: s.signature_name,
              active: s.is_active,
              default: s.is_default,
              created: s.created_at
            }))
          });
        }
        
        // Problème 2: Pas de signature par défaut
        if (activeSignatures.length > 0 && defaultSignatures.length === 0) {
          problems.push({
            type: 'no_default_signature',
            clientId: client.id,
            clientName: clientName,
            clientCode: client.client_code,
            issue: 'Aucune signature par défaut définie',
            signatures: signatures.map(s => ({
              id: s.id,
              name: s.signature_name,
              active: s.is_active,
              default: s.is_default,
              created: s.created_at
            }))
          });
        }
        
        // Problème 3: Plusieurs signatures par défaut
        if (defaultSignatures.length > 1) {
          problems.push({
            type: 'multiple_default_signatures',
            clientId: client.id,
            clientName: clientName,
            clientCode: client.client_code,
            issue: 'Plusieurs signatures par défaut',
            signatures: signatures.map(s => ({
              id: s.id,
              name: s.signature_name,
              active: s.is_active,
              default: s.is_default,
              created: s.created_at
            }))
          });
        }
      }
    });

    // 4. Statistiques
    const stats = {
      totalClients: clients?.length || 0,
      totalSignatures: allSignatures?.length || 0,
      clientsWithSignatures: clientSignatureMap.size,
      clientsWithProblems: problems.length,
      problemTypes: {
        inactive_signatures: problems.filter(p => p.type === 'inactive_signatures').length,
        no_default_signature: problems.filter(p => p.type === 'no_default_signature').length,
        multiple_default_signatures: problems.filter(p => p.type === 'multiple_default_signatures').length
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Diagnostic terminé',
      stats: stats,
      problems: problems,
      clientsWithSignatures: Array.from(clientSignatureMap.entries()).map(([clientId, signatures]) => {
        const client = clients?.find(c => c.id === clientId);
        return {
          clientId,
          clientName: client ? `${client.users.first_name} ${client.users.last_name}` : 'Inconnu',
          clientCode: client?.client_code,
          signatureCount: signatures.length,
          activeCount: signatures.filter(s => s.is_active).length,
          defaultCount: signatures.filter(s => s.is_default).length,
          signatures: signatures.map(s => ({
            id: s.id,
            name: s.signature_name,
            active: s.is_active,
            default: s.is_default,
            created: s.created_at
          }))
        };
      })
    });

  } catch (error) {
    console.error('💥 Erreur diagnostic signatures:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, clientId, signatureId } = await request.json();
    
    console.log('🔧 Correction signature:', { action, clientId, signatureId });

    switch (action) {
      case 'activate_all_signatures':
        // Activer toutes les signatures d'un client
        const { data: activatedSigs, error: activateError } = await supabaseAdmin
          .from('client_signatures')
          .update({ is_active: true })
          .eq('client_id', clientId)
          .select();

        if (activateError) {
          return NextResponse.json({
            success: false,
            error: 'Erreur activation signatures',
            details: activateError.message
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `${activatedSigs?.length || 0} signatures activées`,
          activatedSignatures: activatedSigs
        });

      case 'set_default_signature':
        // Désactiver toutes les signatures par défaut du client
        await supabaseAdmin
          .from('client_signatures')
          .update({ is_default: false })
          .eq('client_id', clientId);

        // Activer la signature spécifiée comme défaut
        const { data: defaultSig, error: defaultError } = await supabaseAdmin
          .from('client_signatures')
          .update({ is_default: true, is_active: true })
          .eq('id', signatureId)
          .select()
          .single();

        if (defaultError) {
          return NextResponse.json({
            success: false,
            error: 'Erreur définition signature par défaut',
            details: defaultError.message
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Signature par défaut définie',
          defaultSignature: defaultSig
        });

      case 'fix_all_problems':
        // Corriger automatiquement tous les problèmes détectés
        let fixedCount = 0;
        const fixes = [];

        // Récupérer tous les clients avec signatures
        const { data: allClients, error: clientsError } = await supabaseAdmin
          .from('client_signatures')
          .select('client_id, id, signature_name, is_active, is_default, created_at');

        if (clientsError) {
          return NextResponse.json({
            success: false,
            error: 'Erreur récupération signatures',
            details: clientsError.message
          }, { status: 500 });
        }

        // Grouper par client
        const clientGroups = new Map();
        allClients?.forEach(sig => {
          if (!clientGroups.has(sig.client_id)) {
            clientGroups.set(sig.client_id, []);
          }
          clientGroups.get(sig.client_id).push(sig);
        });

        // Corriger chaque client
        for (const [clientId, signatures] of clientGroups) {
          const activeSignatures = signatures.filter(s => s.is_active);
          const defaultSignatures = signatures.filter(s => s.is_default);

          // Si aucune signature active, activer toutes
          if (activeSignatures.length === 0) {
            await supabaseAdmin
              .from('client_signatures')
              .update({ is_active: true })
              .eq('client_id', clientId);
            
            fixes.push(`Activé ${signatures.length} signatures pour client ${clientId}`);
            fixedCount++;
          }

          // Si pas de signature par défaut, définir la plus récente comme défaut
          if (defaultSignatures.length === 0 && signatures.length > 0) {
            const mostRecent = signatures.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            await supabaseAdmin
              .from('client_signatures')
              .update({ is_default: true, is_active: true })
              .eq('id', mostRecent.id);

            fixes.push(`Défini signature par défaut pour client ${clientId}: ${mostRecent.signature_name}`);
            fixedCount++;
          }

          // Si plusieurs signatures par défaut, garder seulement la plus récente
          if (defaultSignatures.length > 1) {
            const mostRecent = defaultSignatures.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            // Désactiver toutes les signatures par défaut
            await supabaseAdmin
              .from('client_signatures')
              .update({ is_default: false })
              .eq('client_id', clientId);

            // Réactiver seulement la plus récente
            await supabaseAdmin
              .from('client_signatures')
              .update({ is_default: true })
              .eq('id', mostRecent.id);

            fixes.push(`Corrigé signatures multiples par défaut pour client ${clientId}`);
            fixedCount++;
          }
        }

        return NextResponse.json({
          success: true,
          message: `${fixedCount} problèmes corrigés`,
          fixes: fixes
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Action non reconnue'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Erreur correction signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
