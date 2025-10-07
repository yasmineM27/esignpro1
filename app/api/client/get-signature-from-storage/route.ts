import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signatureId = searchParams.get('signatureId');
    const clientId = searchParams.get('clientId');
    const storagePath = searchParams.get('storagePath');

    console.log('🖼️ Récupération signature depuis Storage:', { signatureId, clientId, storagePath });

    // Option 1: Récupérer par ID de signature
    if (signatureId) {
      // Récupérer les métadonnées de la signature
      const { data: signatureData, error: signatureError } = await supabaseAdmin
        .from('client_signatures')
        .select('signature_metadata, signature_name, client_id')
        .eq('id', signatureId)
        .single();

      if (signatureError || !signatureData) {
        console.error('❌ Signature non trouvée:', signatureError);
        return NextResponse.json({
          success: false,
          error: 'Signature non trouvée'
        }, { status: 404 });
      }

      const metadata = signatureData.signature_metadata as any;
      if (!metadata?.storage_path) {
        return NextResponse.json({
          success: false,
          error: 'Aucun fichier de signature dans le storage'
        }, { status: 404 });
      }

      // Télécharger depuis Supabase Storage
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(metadata.storage_path);

      if (downloadError) {
        console.error('❌ Erreur téléchargement Storage:', downloadError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors du téléchargement de la signature'
        }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="${signatureData.signature_name}.png"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600' // Cache 1 heure
        }
      });
    }

    // Option 2: Récupérer par chemin direct
    if (storagePath) {
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(storagePath);

      if (downloadError) {
        console.error('❌ Erreur téléchargement Storage:', downloadError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors du téléchargement de la signature'
        }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="signature.png"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Option 3: Lister toutes les signatures d'un client
    if (clientId) {
      const { data: signatures, error: listError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, signature_name, signature_metadata, created_at, is_default, is_active')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('❌ Erreur récupération signatures:', listError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la récupération des signatures'
        }, { status: 500 });
      }

      // Enrichir avec les URLs de storage
      const enrichedSignatures = signatures.map(sig => {
        const metadata = sig.signature_metadata as any;
        return {
          ...sig,
          storage_available: !!metadata?.storage_path,
          storage_path: metadata?.storage_path,
          download_url: metadata?.storage_path 
            ? `/api/client/get-signature-from-storage?storagePath=${encodeURIComponent(metadata.storage_path)}`
            : null
        };
      });

      return NextResponse.json({
        success: true,
        signatures: enrichedSignatures,
        count: enrichedSignatures.length
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Paramètre requis: signatureId, clientId ou storagePath'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur API get-signature-from-storage:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la signature'
    }, { status: 500 });
  }
}

// API pour obtenir l'URL publique d'une signature
export async function POST(request: NextRequest) {
  try {
    const { storagePath, expiresIn = 3600 } = await request.json();

    if (!storagePath) {
      return NextResponse.json({
        success: false,
        error: 'storagePath requis'
      }, { status: 400 });
    }

    // Créer une URL signée pour accès temporaire
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('client-documents')
      .createSignedUrl(storagePath, expiresIn);

    if (urlError) {
      console.error('❌ Erreur création URL signée:', urlError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la création de l\'URL d\'accès'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUrl: urlData.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur API POST get-signature-from-storage:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'URL'
    }, { status: 500 });
  }
}
