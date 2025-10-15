import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Dashboard Stats - Début traitement');

    // 1. Compter les agents actifs (via la table users)
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select(`
        id,
        user_id,
        users!inner(
          id,
          is_active
        )
      `)
      .eq('users.is_active', true);

    if (agentsError) {
      console.error('❌ Erreur récupération agents:', agentsError);
    }

    const activeAgents = agents?.length || 0;

    // 2. Compter les documents traités (tous les documents uploadés)
    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('client_documents')
      .select('id')
      .eq('status', 'uploaded');

    if (documentsError) {
      console.error('❌ Erreur récupération documents:', documentsError);
    }

    const totalDocuments = documents?.length || 0;

    // 3. Compter les signatures d'aujourd'hui
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data: todaySignatures, error: signaturesError } = await supabaseAdmin
      .from('client_signatures')
      .select('id')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (signaturesError) {
      console.error('❌ Erreur récupération signatures:', signaturesError);
    }

    const todaySignaturesCount = todaySignatures?.length || 0;

    // 4. Calculer le temps moyen de traitement des dossiers
    const { data: completedCases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('created_at, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null);

    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
    }

    let averageTime = 0;
    if (completedCases && completedCases.length > 0) {
      const totalTime = completedCases.reduce((sum, case_) => {
        const created = new Date(case_.created_at);
        const completed = new Date(case_.completed_at);
        const diffInHours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + diffInHours;
      }, 0);
      
      averageTime = totalTime / completedCases.length;
    }

    // Formater le temps moyen
    let averageTimeFormatted = '0min';
    if (averageTime > 0) {
      if (averageTime >= 24) {
        const days = Math.floor(averageTime / 24);
        const hours = Math.floor(averageTime % 24);
        averageTimeFormatted = `${days}j ${hours}h`;
      } else if (averageTime >= 1) {
        const hours = Math.floor(averageTime);
        const minutes = Math.floor((averageTime % 1) * 60);
        averageTimeFormatted = `${hours}h ${minutes}min`;
      } else {
        const minutes = Math.floor(averageTime * 60);
        averageTimeFormatted = `${minutes}min`;
      }
    }

    const stats = {
      activeAgents,
      totalDocuments,
      todaySignatures: todaySignaturesCount,
      averageTime: averageTimeFormatted
    };

    console.log('✅ Statistiques calculées:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erreur API Dashboard Stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
