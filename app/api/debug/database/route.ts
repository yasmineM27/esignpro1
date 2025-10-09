import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 ANALYSE DE LA BASE DE DONNÉES');
    console.log('================================');
    
    // Compter les dossiers
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, client_id, case_number')
      .limit(10);
      
    if (casesError) {
      console.error('❌ Erreur dossiers:', casesError);
      return NextResponse.json({ error: 'Erreur dossiers', details: casesError });
    }
      
    console.log('📋 Dossiers (insurance_cases):');
    console.log('Nombre:', cases?.length || 0);
    if (cases?.length > 0) {
      console.log('Exemples:', cases.slice(0, 3).map(c => ({ 
        case_number: c.case_number, 
        client_id: c.client_id 
      })));
    }
    
    // Compter les clients
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, client_code, user_id')
      .limit(10);
      
    if (clientsError) {
      console.error('❌ Erreur clients:', clientsError);
    } else {
      console.log('\n👥 Clients (clients):');
      console.log('Nombre:', clients?.length || 0);
      if (clients?.length > 0) {
        console.log('Exemples:', clients.slice(0, 3));
      }
    }
    
    // Compter les utilisateurs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .limit(10);
      
    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError);
    } else {
      console.log('\n🔑 Utilisateurs (users):');
      console.log('Nombre:', users?.length || 0);
      if (users?.length > 0) {
        console.log('Exemples:', users.slice(0, 3).map(u => ({ 
          email: u.email, 
          name: `${u.first_name} ${u.last_name}`,
          role: u.role 
        })));
      }
    }
    
    // Vérifier les client_id orphelins
    let orphanIds: string[] = [];
    if (cases?.length > 0) {
      const clientIds = [...new Set(cases.map(c => c.client_id).filter(Boolean))];
      console.log('\n🔍 Client IDs uniques dans les dossiers:', clientIds.length);
      
      if (clients?.length > 0) {
        const existingClientIds = clients.map(c => c.id);
        orphanIds = clientIds.filter(id => !existingClientIds.includes(id));
        console.log('❌ Client IDs orphelins (dossiers sans clients):', orphanIds.length);
        if (orphanIds.length > 0) {
          console.log('Exemples orphelins:', orphanIds.slice(0, 3));
        }
      } else {
        console.log('❌ PROBLÈME: Tous les client_id sont orphelins (table clients vide)');
        console.log('Client IDs dans les dossiers:', clientIds.slice(0, 5));
        orphanIds = clientIds;
      }
    }
    
    // Compter les signatures
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('id, client_id')
      .limit(10);
      
    if (sigError) {
      console.error('❌ Erreur signatures:', sigError);
    } else {
      console.log('\n✍️ Signatures (client_signatures):');
      console.log('Nombre:', signatures?.length || 0);
    }
    
    // Retourner le résumé
    const analysis = {
      cases: {
        count: cases?.length || 0,
        examples: cases?.slice(0, 3).map(c => ({ 
          case_number: c.case_number, 
          client_id: c.client_id 
        })) || []
      },
      clients: {
        count: clients?.length || 0,
        examples: clients?.slice(0, 3) || []
      },
      users: {
        count: users?.length || 0,
        examples: users?.slice(0, 3).map(u => ({ 
          email: u.email, 
          name: `${u.first_name} ${u.last_name}`,
          role: u.role 
        })) || []
      },
      signatures: {
        count: signatures?.length || 0
      },
      problems: {
        orphan_client_ids: orphanIds.length,
        orphan_examples: orphanIds.slice(0, 5)
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      analysis,
      message: 'Analyse terminée - voir les logs du serveur pour plus de détails'
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
  }
}
