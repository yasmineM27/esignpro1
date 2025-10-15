import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API Upload - Début traitement');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const token = formData.get('token') as string;

    // Validation des paramètres
    if (!file || !documentType || !token) {
      console.error('❌ Paramètres manquants:', { file: !!file, documentType, token });
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Validation du fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'Fichier trop volumineux (max 10MB)'
      }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Type de fichier non autorisé (JPG, PNG, PDF uniquement)'
      }, { status: 400 });
    }

    console.log('✅ Validation fichier OK:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Vérifier que le token existe
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number')
      .eq('secure_token', token)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Token invalide:', token);
      return NextResponse.json({
        success: false,
        error: 'Token invalide'
      }, { status: 404 });
    }

    console.log('✅ Dossier trouvé:', caseData.case_number);

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sauvegarder le fichier dans Supabase Storage
    const fileName = `${token}_${documentType}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase Storage:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors du stockage du fichier'
      }, { status: 500 });
    }

    console.log('✅ Fichier uploadé dans Storage:', uploadData.path);

    // Supprimer l'ancien document du même type s'il existe
    const { error: deleteError } = await supabaseAdmin
      .from('client_documents')
      .delete()
      .eq('token', token)
      .eq('documenttype', documentType);

    if (deleteError) {
      console.warn('⚠️ Erreur suppression ancien document:', deleteError);
    }

    // Insérer le nouveau document avec filepath (pas filedata)
    const { data: newDocument, error: insertError } = await supabaseAdmin
      .from('client_documents')
      .insert({
        clientid: caseData.clients?.id || token,
        token,
        documenttype: documentType,
        filename: file.name,
        filepath: uploadData.path,
        mimetype: file.type,
        filesize: file.size,
        status: 'uploaded',
        uploaddate: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion document:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la sauvegarde'
      }, { status: 500 });
    }

    console.log('✅ Document sauvegardé:', newDocument.id);

    return NextResponse.json({
      success: true,
      message: 'Document uploadé avec succès',
      document: {
        id: newDocument.id,
        documenttype: newDocument.documenttype,
        filename: newDocument.filename,
        status: newDocument.status,
        uploaddate: newDocument.uploaddate
      }
    });

  } catch (error) {
    console.error('❌ Erreur API Upload:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
