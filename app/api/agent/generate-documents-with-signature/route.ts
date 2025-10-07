import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PDFGenerator } from '@/lib/pdf-generator';

/**
 * API for generating documents with automatic signature insertion
 * POST: Generate multiple documents with automatic signature application
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      clientId,
      caseId,
      templateIds,
      customVariables = {},
      agentId,
      sessionName,
      autoApplySignature = true
    } = await request.json();

    console.log('📝 Génération documents avec signature automatique:', { 
      clientId, 
      caseId, 
      templateIds, 
      agentId, 
      autoApplySignature 
    });

    if (!clientId || !caseId || !templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'clientId, caseId et templateIds (array) requis'
      }, { status: 400 });
    }

    // 1. Récupérer les données du client et du dossier
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        insurance_company,
        policy_number,
        policy_type,
        termination_date,
        reason_for_termination,
        clients!inner(
          id,
          address,
          city,
          postal_code,
          country,
          has_signature,
          users!inner(
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', caseId)
      .eq('client_id', clientId)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Dossier non trouvé:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé ou non associé au client'
      }, { status: 404 });
    }

    // 2. Récupérer la signature du client si disponible
    let clientSignature = null;
    if (autoApplySignature && caseData.clients.has_signature) {
      const { data: signatureData, error: signatureError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, signature_data, signature_name, signature_metadata')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (!signatureError && signatureData) {
        clientSignature = signatureData;
        console.log('✅ Signature client récupérée:', signatureData.id);
      } else {
        console.warn('⚠️ Signature non trouvée malgré has_signature=true');
      }
    }

    // 3. Récupérer les templates
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('document_templates')
      .select('*')
      .in('id', templateIds)
      .eq('is_active', true);

    if (templatesError || !templates || templates.length === 0) {
      console.error('❌ Templates non trouvés:', templatesError);
      return NextResponse.json({
        success: false,
        error: 'Templates non trouvés'
      }, { status: 404 });
    }

    // 4. Créer une session de génération
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('document_generation_sessions')
      .insert([{
        client_id: clientId,
        agent_id: agentId,
        session_name: sessionName || `Génération ${new Date().toLocaleString('fr-CH')}`,
        templates_used: templateIds,
        status: 'in_progress'
      }])
      .select()
      .single();

    if (sessionError) {
      console.warn('⚠️ Erreur création session:', sessionError);
    }

    // 5. Préparer les variables pour le remplissage des templates
    const clientName = `${caseData.clients.users.first_name} ${caseData.clients.users.last_name}`;
    const variables = {
      client_name: clientName,
      client_first_name: caseData.clients.users.first_name,
      client_last_name: caseData.clients.users.last_name,
      client_address: caseData.clients.address || 'Adresse non renseignée',
      client_city: caseData.clients.city || '',
      client_postal_code: caseData.clients.postal_code || '',
      client_npa: caseData.clients.postal_code || '',
      client_ville: caseData.clients.city || '',
      client_npa_ville: `${caseData.clients.postal_code || ''} ${caseData.clients.city || ''}`.trim(),
      client_email: caseData.clients.users.email,
      client_phone: caseData.clients.users.phone || '',
      policy_number: caseData.policy_number || 'N/A',
      insurance_company: caseData.insurance_company || 'N/A',
      policy_type: caseData.policy_type || 'N/A',
      termination_date: caseData.termination_date || new Date().toISOString().split('T')[0],
      reason: caseData.reason_for_termination || 'Résiliation à l\'échéance',
      current_date: new Date().toLocaleDateString('fr-CH'),
      case_number: caseData.case_number,
      lieu_date: `Sousse, ${new Date().toLocaleDateString('fr-CH')}`,
      ...customVariables
    };

    // 6. Générer les documents
    const generatedDocuments = [];
    let documentsGenerated = 0;
    let documentsSigned = 0;

    for (const template of templates) {
      try {
        console.log(`📄 Génération document: ${template.template_name}`);

        // Remplacer les variables dans le contenu du template
        let content = template.template_file_path; // Assuming this contains the template content
        
        // For now, we'll use a simple template content (in production, you'd load from file)
        content = generateTemplateContent(template, variables);

        // Appliquer la signature si disponible
        const shouldApplySignature = autoApplySignature && clientSignature;
        if (shouldApplySignature) {
          content = content.replace(
            /\[SIGNATURE_PLACEHOLDER\]|_________________________/g,
            '[Signature électronique appliquée]'
          );
        }

        // Générer le PDF
        const pdfBytes = await PDFGenerator.generatePDF({
          title: template.template_name,
          content: content,
          clientName: clientName,
          caseNumber: caseData.case_number,
          signatureDataUrl: shouldApplySignature ? clientSignature.signature_data : undefined,
          signatureDate: shouldApplySignature ? new Date().toLocaleString('fr-CH') : undefined
        });

        const pdfBase64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;

        // Sauvegarder dans generated_documents
        const { data: docData, error: docError } = await supabaseAdmin
          .from('generated_documents')
          .insert([{
            case_id: caseId,
            template_id: template.id,
            document_name: template.template_name,
            content: content,
            pdf_url: pdfBase64,
            is_signed: shouldApplySignature,
            signed_at: shouldApplySignature ? new Date().toISOString() : null
          }])
          .select()
          .single();

        if (docError) {
          console.error(`❌ Erreur sauvegarde document ${template.template_name}:`, docError);
          continue;
        }

        // Sauvegarder dans l'archive client
        await supabaseAdmin
          .from('client_documents_archive')
          .insert([{
            client_id: clientId,
            case_id: caseId,
            template_id: template.id,
            document_name: template.template_name,
            document_type: template.template_category,
            file_path: `/generated/${caseData.case_number}/${template.template_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            file_size: pdfBytes.length,
            mime_type: 'application/pdf',
            is_signed: shouldApplySignature,
            signature_applied_at: shouldApplySignature ? new Date().toISOString() : null,
            generated_by: agentId,
            variables_used: variables
          }]);

        generatedDocuments.push({
          id: docData.id,
          templateId: template.id,
          templateName: template.template_name,
          templateCategory: template.template_category,
          documentName: template.template_name,
          content: content,
          pdfUrl: pdfBase64,
          isSigned: shouldApplySignature,
          signedAt: shouldApplySignature ? new Date().toISOString() : null,
          variables: variables,
          generatedAt: new Date().toISOString()
        });

        documentsGenerated++;
        if (shouldApplySignature) {
          documentsSigned++;
        }

        console.log(`✅ Document généré: ${template.template_name} (signé: ${shouldApplySignature})`);

      } catch (error) {
        console.error(`❌ Erreur génération document ${template.template_name}:`, error);
      }
    }

    // 7. Mettre à jour la session
    if (sessionData) {
      await supabaseAdmin
        .from('document_generation_sessions')
        .update({
          documents_generated: documentsGenerated,
          documents_signed: documentsSigned,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionData.id);
    }

    console.log(`✅ Génération terminée: ${documentsGenerated} documents générés, ${documentsSigned} signés`);

    return NextResponse.json({
      success: true,
      documents: generatedDocuments,
      summary: {
        totalRequested: templateIds.length,
        documentsGenerated: documentsGenerated,
        documentsSigned: documentsSigned,
        clientHasSignature: caseData.clients.has_signature,
        signatureApplied: autoApplySignature && clientSignature !== null,
        sessionId: sessionData?.id
      },
      clientInfo: {
        clientId: clientId,
        clientName: clientName,
        caseNumber: caseData.case_number,
        hasSignature: caseData.clients.has_signature
      },
      message: `${documentsGenerated} document(s) généré(s) avec succès${documentsSigned > 0 ? `, ${documentsSigned} signé(s) automatiquement` : ''}`
    });

  } catch (error) {
    console.error('❌ Erreur génération documents:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la génération'
    }, { status: 500 });
  }
}

function generateTemplateContent(template: any, variables: any): string {
  // Simple template content generation (in production, you'd load from actual template files)
  const templateContents: { [key: string]: string } = {
    'Résiliation LAMal': `
Nom prénom : ${variables.client_name}
Adresse: ${variables.client_address}
NPA Ville: ${variables.client_npa_ville}
Lieu et date : ${variables.lieu_date}
Objet : Résiliation de l'assurance maladie LAMal

Madame, Monsieur,

Par la présente, je vous informe de ma décision de résilier mon contrat d'assurance maladie LAMal n° ${variables.policy_number} souscrit auprès de ${variables.insurance_company}.

Cette résiliation prendra effet le ${variables.termination_date}.

Motif de la résiliation : ${variables.reason}

Je vous prie de bien vouloir me faire parvenir un accusé de réception de cette demande.

Cordialement,

Signature personnes majeures:
[SIGNATURE_PLACEHOLDER]
    `,
    'Résiliation LCA': `
Nom prénom : ${variables.client_name}
Adresse: ${variables.client_address}
NPA Ville: ${variables.client_npa_ville}
Lieu et date : ${variables.lieu_date}
Objet : Résiliation de l'assurance complémentaire LCA

Madame, Monsieur,

Par la présente, je vous informe de ma décision de résilier mon contrat d'assurance complémentaire LCA n° ${variables.policy_number} souscrit auprès de ${variables.insurance_company}.

Cette résiliation prendra effet le ${variables.termination_date}.

Motif de la résiliation : ${variables.reason}

Je vous prie de bien vouloir me faire parvenir un accusé de réception de cette demande.

Cordialement,

Signature personnes majeures:
[SIGNATURE_PLACEHOLDER]
    `,
    'Changement d\'adresse': `
Nom prénom : ${variables.client_name}
Ancienne adresse: ${variables.client_address}
Nouvelle adresse: ${variables.client_address}
NPA Ville: ${variables.client_npa_ville}
Lieu et date : ${variables.lieu_date}
Objet : Changement d'adresse

Madame, Monsieur,

Par la présente, je vous informe de mon changement d'adresse pour le contrat n° ${variables.policy_number} souscrit auprès de ${variables.insurance_company}.

Ce changement prend effet le ${variables.current_date}.

Je vous prie de bien vouloir mettre à jour vos dossiers.

Cordialement,

Signature personnes majeures:
[SIGNATURE_PLACEHOLDER]
    `
  };

  return templateContents[template.template_name] || `
Document: ${template.template_name}
Client: ${variables.client_name}
Date: ${variables.current_date}

[Contenu du template à définir]

Signature personnes majeures:
[SIGNATURE_PLACEHOLDER]
  `;
}
