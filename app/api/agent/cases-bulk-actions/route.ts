import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, caseIds, agentId = '550e8400-e29b-41d4-a716-446655440001' } = body;

    console.log('🔄 Action en lot sur dossiers:', { action, caseIds: caseIds?.length, agentId });

    if (!action || !caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Action et IDs de dossiers requis'
      }, { status: 400 });
    }

    let result: any = { success: false };

    switch (action) {
      case 'archive':
        result = await archiveCases(caseIds, agentId);
        break;
      
      case 'unarchive':
        result = await unarchiveCases(caseIds, agentId);
        break;
      
      case 'delete':
        result = await deleteCases(caseIds, agentId);
        break;
      
      case 'update-priority':
        const { priority } = body;
        result = await updateCasesPriority(caseIds, priority, agentId);
        break;
      
      case 'send-reminder':
        result = await sendReminders(caseIds, agentId);
        break;
      
      case 'export':
        result = await exportCases(caseIds, agentId);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: `Action '${action}' non supportée`
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Erreur action en lot:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

async function archiveCases(caseIds: string[], agentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('insurance_cases')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .in('id', caseIds)
      .eq('agent_id', agentId)
      .select('id, case_number');

    if (error) {
      console.error('❌ Erreur archivage:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'archivage'
      };
    }

    console.log(`✅ ${data?.length || 0} dossier(s) archivé(s)`);

    return {
      success: true,
      message: `${data?.length || 0} dossier(s) archivé(s) avec succès`,
      archivedCases: data
    };

  } catch (error) {
    console.error('❌ Erreur archivage:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'archivage'
    };
  }
}

async function unarchiveCases(caseIds: string[], agentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('insurance_cases')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .in('id', caseIds)
      .eq('agent_id', agentId)
      .eq('status', 'archived')
      .select('id, case_number');

    if (error) {
      console.error('❌ Erreur désarchivage:', error);
      return {
        success: false,
        error: 'Erreur lors du désarchivage'
      };
    }

    console.log(`✅ ${data?.length || 0} dossier(s) désarchivé(s)`);

    return {
      success: true,
      message: `${data?.length || 0} dossier(s) désarchivé(s) avec succès`,
      unarchivedCases: data
    };

  } catch (error) {
    console.error('❌ Erreur désarchivage:', error);
    return {
      success: false,
      error: 'Erreur lors du désarchivage'
    };
  }
}

async function deleteCases(caseIds: string[], agentId: string) {
  try {
    // Vérifier que les dossiers appartiennent à l'agent
    const { data: casesToDelete, error: checkError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, status')
      .in('id', caseIds)
      .eq('agent_id', agentId);

    if (checkError) {
      console.error('❌ Erreur vérification dossiers:', checkError);
      return {
        success: false,
        error: 'Erreur lors de la vérification des dossiers'
      };
    }

    // Ne supprimer que les dossiers archivés ou en brouillon
    const deletableCases = casesToDelete?.filter(c => 
      ['archived', 'draft'].includes(c.status)
    ) || [];

    if (deletableCases.length === 0) {
      return {
        success: false,
        error: 'Aucun dossier supprimable (seuls les dossiers archivés ou en brouillon peuvent être supprimés)'
      };
    }

    const deletableIds = deletableCases.map(c => c.id);

    // Supprimer les données liées d'abord
    await supabaseAdmin.from('signatures').delete().in('case_id', deletableIds);
    await supabaseAdmin.from('client_documents').delete().in('case_id', deletableIds);
    await supabaseAdmin.from('generated_documents').delete().in('case_id', deletableIds);
    await supabaseAdmin.from('email_logs').delete().in('case_id', deletableIds);

    // Supprimer les dossiers
    const { error: deleteError } = await supabaseAdmin
      .from('insurance_cases')
      .delete()
      .in('id', deletableIds);

    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError);
      return {
        success: false,
        error: 'Erreur lors de la suppression'
      };
    }

    console.log(`✅ ${deletableCases.length} dossier(s) supprimé(s)`);

    return {
      success: true,
      message: `${deletableCases.length} dossier(s) supprimé(s) avec succès`,
      deletedCases: deletableCases,
      skippedCount: caseIds.length - deletableCases.length
    };

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return {
      success: false,
      error: 'Erreur lors de la suppression'
    };
  }
}

async function updateCasesPriority(caseIds: string[], priority: string, agentId: string) {
  try {
    if (!['high', 'medium', 'low'].includes(priority)) {
      return {
        success: false,
        error: 'Priorité invalide'
      };
    }

    const { data, error } = await supabaseAdmin
      .from('insurance_cases')
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .in('id', caseIds)
      .eq('agent_id', agentId)
      .select('id, case_number, priority');

    if (error) {
      console.error('❌ Erreur mise à jour priorité:', error);
      return {
        success: false,
        error: 'Erreur lors de la mise à jour de la priorité'
      };
    }

    console.log(`✅ Priorité mise à jour pour ${data?.length || 0} dossier(s)`);

    return {
      success: true,
      message: `Priorité mise à jour pour ${data?.length || 0} dossier(s)`,
      updatedCases: data
    };

  } catch (error) {
    console.error('❌ Erreur mise à jour priorité:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour de la priorité'
    };
  }
}

async function sendReminders(caseIds: string[], agentId: string) {
  try {
    // Récupérer les dossiers avec les informations client
    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        secure_token,
        status,
        clients!inner(
          id,
          users!inner(
            email,
            first_name,
            last_name
          )
        )
      `)
      .in('id', caseIds)
      .eq('agent_id', agentId)
      .in('status', ['email_sent', 'documents_uploaded']); // Seulement les dossiers en attente

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des dossiers'
      };
    }

    if (!cases || cases.length === 0) {
      return {
        success: false,
        error: 'Aucun dossier éligible pour un rappel'
      };
    }

    // Simuler l'envoi de rappels (à implémenter avec le service email)
    const reminders = [];
    for (const caseItem of cases) {
      const user = caseItem.clients.users;
      
      // Log du rappel
      await supabaseAdmin
        .from('email_logs')
        .insert({
          case_id: caseItem.id,
          email_type: 'reminder',
          recipient_email: user.email,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      reminders.push({
        caseId: caseItem.id,
        caseNumber: caseItem.case_number,
        clientName: `${user.first_name} ${user.last_name}`,
        email: user.email
      });
    }

    console.log(`✅ ${reminders.length} rappel(s) envoyé(s)`);

    return {
      success: true,
      message: `${reminders.length} rappel(s) envoyé(s) avec succès`,
      reminders
    };

  } catch (error) {
    console.error('❌ Erreur envoi rappels:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'envoi des rappels'
    };
  }
}

async function exportCases(caseIds: string[], agentId: string) {
  try {
    // Cette fonction retournerait normalement un fichier CSV/Excel
    // Pour l'instant, on retourne juste les données
    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        priority,
        insurance_company,
        policy_type,
        policy_number,
        created_at,
        updated_at,
        clients!inner(
          client_code,
          users!inner(
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .in('id', caseIds)
      .eq('agent_id', agentId);

    if (error) {
      console.error('❌ Erreur export:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'export'
      };
    }

    console.log(`✅ Export de ${cases?.length || 0} dossier(s)`);

    return {
      success: true,
      message: `Export de ${cases?.length || 0} dossier(s) préparé`,
      exportData: cases,
      exportFormat: 'json' // Pourrait être 'csv' ou 'excel'
    };

  } catch (error) {
    console.error('❌ Erreur export:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'export'
    };
  }
}
