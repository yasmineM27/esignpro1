import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API pour récupérer les documents générés d'un dossier
 * GET: Récupère tous les documents générés pour un caseId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    console.log('🔍 API called with caseId:', caseId);
    console.log('🔍 API version: 3.0 - Fixed client_documents search');

    if (!caseId) {
      console.log('❌ No caseId provided');
      return NextResponse.json({
        success: false,
        error: 'caseId requis'
      }, { status: 400 });
    }

    // D'abord vérifier si le dossier existe et récupérer le secure_token
    console.log('🔍 Searching for case in insurance_cases...');
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number, status, secure_token')
      .eq('id', caseId)
      .single();

    if (caseError) {
      console.error('❌ Case query error:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la recherche du dossier'
      }, { status: 500 });
    }

    if (!caseData) {
      console.log('❌ Case not found');
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    console.log('📁 Dossier trouvé:', caseData);
    console.log('🔑 Token du dossier:', caseData.secure_token);

    // Chercher dans toutes les tables possibles
    const allDocuments = [];

    // 1. generated_documents
    console.log('🔍 Searching in generated_documents...');
    const { data: genDocs, error: genError } = await supabaseAdmin
      .from('generated_documents')
      .select('*')
      .eq('case_id', caseId);

    if (genError) {
      console.error('❌ Error in generated_documents:', genError);
    } else {
      console.log(`✅ ${genDocs?.length || 0} document(s) généré(s) trouvé(s) dans generated_documents`);
      if (genDocs) allDocuments.push(...genDocs);
    }

    // 2. client_documents avec token (SANS ORDER BY pour éviter l'erreur)
    console.log('🔍 Recherche dans client_documents avec token:', caseData.secure_token);
    const { data: clientDocs, error: clientError } = await supabaseAdmin
      .from('client_documents')
      .select('*')
      .eq('token', caseData.secure_token);

    if (clientError) {
      console.error('❌ Erreur récupération client_documents:', clientError);
    } else {
      console.log(`📄 ${clientDocs?.length || 0} document(s) trouvé(s) dans client_documents`);
      if (clientDocs) allDocuments.push(...clientDocs);
    }

    // 3. client_documents_archive
    console.log('🔍 Recherche dans client_documents_archive...');
    const { data: archiveDocs, error: archiveError } = await supabaseAdmin
      .from('client_documents_archive')
      .select('*')
      .eq('case_id', caseId);

    if (archiveError) {
      console.error('❌ Error in client_documents_archive:', archiveError);
    } else {
      console.log(`📦 ${archiveDocs?.length || 0} document(s) trouvé(s) dans client_documents_archive`);
      if (archiveDocs) allDocuments.push(...archiveDocs);
    }

    // 4. final_documents
    console.log('🔍 Searching in final_documents...');
    const { data: finalDocs, error: finalError } = await supabaseAdmin
      .from('final_documents')
      .select('*')
      .eq('case_id', caseId);

    if (finalError) {
      console.error('❌ Error in final_documents:', finalError);
    } else {
      console.log(`📄 ${finalDocs?.length || 0} docs in final_documents`);
      if (finalDocs) allDocuments.push(...finalDocs);
    }

    console.log(`📊 Total documents trouvés: ${allDocuments.length}`);
    console.log('📋 All documents:', allDocuments);

    return NextResponse.json({
      success: true,
      documents: allDocuments
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
