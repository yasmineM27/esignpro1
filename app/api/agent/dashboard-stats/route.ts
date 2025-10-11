import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies
    const token = request.cookies.get('agent_token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const agentId = decoded.agentId;

    console.log('📊 Récupération stats dashboard pour agent:', agentId);

    // Récupérer les statistiques de l'agent
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, status, created_at, client_id')
      .eq('agent_id', agentId);

    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération des données'
      }, { status: 500 });
    }

    // Récupérer les clients uniques
    const uniqueClientIds = [...new Set(cases?.map(c => c.client_id) || [])];
    
    // Récupérer les signatures d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todaySignatures, error: signaturesError } = await supabaseAdmin
      .from('client_signatures')
      .select('id, created_at')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .in('client_id', uniqueClientIds.length > 0 ? uniqueClientIds : ['no-clients']);

    if (signaturesError) {
      console.error('❌ Erreur récupération signatures:', signaturesError);
    }

    // Calculer les statistiques
    const totalCases = cases?.length || 0;
    const activeCases = cases?.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length || 0;
    const completedCases = cases?.filter(c => c.status === 'completed' || c.status === 'signed').length || 0;
    const todaySignaturesCount = todaySignatures?.length || 0;
    const successRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

    // Statistiques par mois (derniers 6 mois)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthCases = cases?.filter(c => {
        const caseDate = new Date(c.created_at);
        return caseDate >= monthDate && caseDate < nextMonth;
      }) || [];

      monthlyStats.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        cases: monthCases.length,
        completed: monthCases.filter(c => c.status === 'completed' || c.status === 'signed').length
      });
    }

    const stats = {
      totalClients: uniqueClientIds.length,
      activeCases,
      todaySignatures: todaySignaturesCount,
      successRate,
      totalCases,
      completedCases,
      monthlyStats,
      recentActivity: cases?.slice(0, 5).map(c => ({
        id: c.id,
        status: c.status,
        created_at: c.created_at
      })) || []
    };

    console.log(`✅ Stats calculées pour agent ${agentId}:`, {
      clients: stats.totalClients,
      cases: stats.activeCases,
      signatures: stats.todaySignatures,
      rate: stats.successRate
    });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats dashboard:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
