import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    console.log('🔗 Récupération portal URL client:', { clientId });

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Client ID requis'
      }, { status: 400 });
    }

    // Vérifier si le client a déjà un portal URL permanent
    const { data: existingClient, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        portal_token,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (fetchError || !existingClient) {
      console.error('❌ Client non trouvé:', fetchError?.message);
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    let portalToken = existingClient.portal_token;

    // Si le client n'a pas de portal token, en créer un permanent
    if (!portalToken) {
      portalToken = `PORTAL_${existingClient.client_code}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Mettre à jour le client avec le portal token permanent
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ portal_token: portalToken })
        .eq('id', clientId);

      if (updateError) {
        console.error('❌ Erreur mise à jour portal token:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la création du portal token'
        }, { status: 500 });
      }

      console.log('✅ Portal token créé:', portalToken);
    }

    // Construire l'URL du portal
    const portalUrl = `/client-portal/${portalToken}`;
    const fullPortalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${portalUrl}`;

    console.log('✅ Portal URL récupéré:', {
      clientId,
      clientName: `${existingClient.users.first_name} ${existingClient.users.last_name}`,
      portalToken,
      portalUrl: fullPortalUrl
    });

    return NextResponse.json({
      success: true,
      client: {
        id: existingClient.id,
        clientCode: existingClient.client_code,
        fullName: `${existingClient.users.first_name} ${existingClient.users.last_name}`,
        email: existingClient.users.email
      },
      portalToken,
      portalUrl,
      fullPortalUrl,
      message: 'Portal URL récupéré avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur API client-portal-url:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la récupération du portal URL',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// API pour régénérer un portal token (si nécessaire)
export async function POST(request: NextRequest) {
  try {
    const { clientId, regenerate } = await request.json();

    console.log('🔄 Régénération portal token:', { clientId, regenerate });

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Client ID requis'
      }, { status: 400 });
    }

    // Récupérer le client
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('id, client_code, portal_token')
      .eq('id', clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    // Générer un nouveau portal token
    const newPortalToken = `PORTAL_${client.client_code}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Mettre à jour le client
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ portal_token: newPortalToken })
      .eq('id', clientId);

    if (updateError) {
      console.error('❌ Erreur régénération portal token:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la régénération du portal token'
      }, { status: 500 });
    }

    const newPortalUrl = `/client-portal/${newPortalToken}`;
    const fullPortalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${newPortalUrl}`;

    console.log('✅ Portal token régénéré:', {
      clientId,
      oldToken: client.portal_token,
      newToken: newPortalToken
    });

    return NextResponse.json({
      success: true,
      message: 'Portal token régénéré avec succès',
      client: {
        id: client.id,
        clientCode: client.client_code
      },
      oldPortalToken: client.portal_token,
      newPortalToken,
      portalUrl: newPortalUrl,
      fullPortalUrl
    });

  } catch (error) {
    console.error('💥 Erreur API client-portal-url (POST):', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la régénération du portal token',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// API pour valider un portal token
export async function PUT(request: NextRequest) {
  try {
    const { portalToken } = await request.json();

    console.log('✅ Validation portal token:', { portalToken });

    if (!portalToken) {
      return NextResponse.json({
        success: false,
        error: 'Portal token requis'
      }, { status: 400 });
    }

    // Vérifier si le portal token existe et est valide
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        portal_token,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('portal_token', portalToken)
      .single();

    if (fetchError || !client) {
      console.error('❌ Portal token invalide:', fetchError?.message);
      return NextResponse.json({
        success: false,
        error: 'Portal token invalide ou expiré'
      }, { status: 404 });
    }

    console.log('✅ Portal token valide:', {
      clientId: client.id,
      clientName: `${client.users.first_name} ${client.users.last_name}`
    });

    return NextResponse.json({
      success: true,
      valid: true,
      client: {
        id: client.id,
        clientCode: client.client_code,
        fullName: `${client.users.first_name} ${client.users.last_name}`,
        email: client.users.email
      },
      message: 'Portal token valide'
    });

  } catch (error) {
    console.error('💥 Erreur API client-portal-url (PUT):', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la validation du portal token',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
