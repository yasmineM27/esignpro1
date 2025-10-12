import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { OpsioRobustGenerator } from '@/lib/opsio-robust-generator';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DocumentData {
  // Client data
  clientName: string;
  clientAddress: string;
  clientPostalCity: string;
  clientBirthdate?: string;
  clientEmail?: string;
  clientPhone?: string;
  
  // Advisor data (for OPSIO sheet)
  advisorName?: string;
  advisorEmail?: string;
  advisorPhone?: string;
  
  // Insurance data (for resignation letter)
  insuranceCompany?: string;
  companyAddress?: string;
  companyPostalCity?: string;
  
  // Termination dates
  lamalTerminationDate?: string;
  lcaTerminationDate?: string;
  
  // Insured persons (for resignation letter)
  persons?: Array<{
    name: string;
    birthdate: string;
    policyNumber: string;
    isAdult: boolean;
  }>;
  
  // Payment method (for OPSIO sheet)
  paymentMethod?: 'commission' | 'fees';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function replaceTemplateVariables(template: string, data: DocumentData): string {
  const today = new Date();
  const signatureDate = `Genève, ${formatDate(today)}`;
  
  let result = template
    // Client data
    .replace(/{{CLIENT_NAME}}/g, data.clientName || '')
    .replace(/{{CLIENT_ADDRESS}}/g, data.clientAddress || '')
    .replace(/{{CLIENT_POSTAL_CITY}}/g, data.clientPostalCity || '')
    .replace(/{{CLIENT_BIRTHDATE}}/g, data.clientBirthdate || '')
    .replace(/{{CLIENT_EMAIL}}/g, data.clientEmail || '')
    .replace(/{{CLIENT_PHONE}}/g, data.clientPhone || '')
    
    // Advisor data
    .replace(/{{ADVISOR_NAME}}/g, data.advisorName || '')
    .replace(/{{ADVISOR_EMAIL}}/g, data.advisorEmail || '')
    .replace(/{{ADVISOR_PHONE}}/g, data.advisorPhone || '')
    
    // Insurance company data
    .replace(/{{INSURANCE_COMPANY}}/g, data.insuranceCompany || '')
    .replace(/{{COMPANY_ADDRESS}}/g, data.companyAddress || '')
    .replace(/{{COMPANY_POSTAL_CITY}}/g, data.companyPostalCity || '')
    
    // Dates
    .replace(/{{SIGNATURE_DATE}}/g, signatureDate)
    .replace(/{{LAMAL_TERMINATION_DATE}}/g, data.lamalTerminationDate || '')
    .replace(/{{LCA_TERMINATION_DATE}}/g, data.lcaTerminationDate || '')
    
    // Payment method checkboxes
    .replace(/{{COMMISSION_CHECKED}}/g, data.paymentMethod === 'commission' ? 'checked' : '')
    .replace(/{{FEES_CHECKED}}/g, data.paymentMethod === 'fees' ? 'checked' : '')

    // Signature électronique automatique
    .replace(/{{SIGNATURE_HASH}}/g, Math.random().toString(16).substr(2, 8).toUpperCase())
    .replace(/{{SIGNATURE_IP}}/g, '127.0.0.1')
    .replace(/{{SIGNATURE_USER_AGENT}}/g, 'eSignPro System v1.0');

  // Handle persons data for resignation letter
  if (data.persons) {
    for (let i = 1; i <= 4; i++) {
      const person = data.persons[i - 1];
      if (person) {
        result = result
          .replace(new RegExp(`{{PERSON_${i}_NAME}}`, 'g'), person.name)
          .replace(new RegExp(`{{PERSON_${i}_BIRTHDATE}}`, 'g'), person.birthdate)
          .replace(new RegExp(`{{PERSON_${i}_POLICY}}`, 'g'), person.policyNumber)
          .replace(new RegExp(`{{PERSON_${i}_DISPLAY}}`, 'g'), 'display: block;')
          .replace(new RegExp(`{{SIGNATURE_${i}_DISPLAY}}`, 'g'), person.isAdult ? 'display: block;' : 'display: none;');
      } else {
        result = result
          .replace(new RegExp(`{{PERSON_${i}_NAME}}`, 'g'), '')
          .replace(new RegExp(`{{PERSON_${i}_BIRTHDATE}}`, 'g'), '')
          .replace(new RegExp(`{{PERSON_${i}_POLICY}}`, 'g'), '')
          .replace(new RegExp(`{{PERSON_${i}_DISPLAY}}`, 'g'), 'display: none;')
          .replace(new RegExp(`{{SIGNATURE_${i}_DISPLAY}}`, 'g'), 'display: none;');
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, caseId, data, clientId } = body;

    console.log('📄 Génération document:', { documentType, caseId, clientId });

    // Validate required fields
    if (!documentType || !data) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants: documentType, data requis'
      }, { status: 400 });
    }

    // Si on a un caseId, récupérer le client_id depuis le dossier
    let finalClientId = clientId;
    if (caseId && !finalClientId) {
      const { data: caseData, error: caseError } = await supabaseAdmin
        .from('insurance_cases')
        .select('client_id')
        .eq('id', caseId)
        .single();

      if (caseData) {
        finalClientId = caseData.client_id;
      }
    }

    // Si on n'a toujours pas de client_id, créer un client temporaire
    if (!finalClientId) {
      console.log('⚠️ Aucun client_id fourni, création d\'un client temporaire...');

      // Créer un utilisateur temporaire
      const { data: tempUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          email: `temp_${Date.now()}@esignpro.ch`,
          first_name: data.clientName?.split(' ')[0] || 'Client',
          last_name: data.clientName?.split(' ').slice(1).join(' ') || 'Temporaire',
          role: 'client',
          is_active: false // Marquer comme inactif car temporaire
        }])
        .select('id')
        .single();

      if (tempUser) {
        // Créer un client temporaire
        const { data: tempClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert([{
            user_id: tempUser.id,
            client_code: `TEMP_${Date.now()}`,
            address: data.clientAddress || '',
            city: data.clientPostalCity || '',
            postal_code: data.clientPostalCity?.split(' ')[0] || ''
          }])
          .select('id')
          .single();

        if (clientError) {
          console.error('❌ Erreur création client temporaire:', clientError);
        }

        if (tempClient) {
          finalClientId = tempClient.id;
          console.log('✅ Client temporaire créé:', finalClientId);
        }
      } else if (userError) {
        console.error('❌ Erreur création utilisateur temporaire:', userError);
      }
    }

    if (!finalClientId) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de déterminer le client pour ce document'
      }, { status: 400 });
    }

    // Générer le document selon le type
    let processedDocument: string | Buffer;
    let documentTitle: string;
    let mimeType: string;
    let fileExtension: string;

    if (documentType === 'opsio-info-sheet') {
      // Générer document Word pour OPSIO
      documentTitle = 'Feuille d\'information OPSIO';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';

      // Préparer les données pour le générateur Word
      const opsioData = {
        clientName: data.clientName || '',
        clientAddress: data.clientAddress || '',
        clientPostalCity: data.clientPostalCity || '',
        clientBirthdate: data.clientBirthdate || '',
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        advisorName: data.advisorName || '',
        advisorEmail: data.advisorEmail || '',
        advisorPhone: data.advisorPhone || '',
        paymentMethod: data.paymentMethod || 'commission',
        signatureHash: Math.random().toString(16).substr(2, 8).toUpperCase(),
        signatureIP: '127.0.0.1',
        signatureUserAgent: 'eSignPro System v1.0',
        signatureData: data.signatureData || null // Signature réelle en base64
      };

      processedDocument = await OpsioRobustGenerator.generateRobustOpsioDocument(opsioData);

    } else if (documentType === 'resignation-letter') {
      // Générer document HTML pour résiliation (comme avant)
      documentTitle = 'Lettre de résiliation d\'assurance';
      mimeType = 'text/html';
      fileExtension = 'html';

      const templatePath = path.join(process.cwd(), 'public', 'templates', 'resignation-letter.html');

      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({
          success: false,
          error: 'Template non trouvé'
        }, { status: 404 });
      }

      const template = fs.readFileSync(templatePath, 'utf-8');
      processedDocument = replaceTemplateVariables(template, data);

    } else {
      return NextResponse.json({
        success: false,
        error: 'Type de document non supporté'
      }, { status: 400 });
    }

    // Save document to database - using generated_documents table as fallback
    console.log('💾 Tentative de sauvegarde document:', {
      client_id: finalClientId,
      case_id: caseId || null,
      document_type: documentType,
      document_name: documentTitle
    });

    // Essayer d'abord client_documents_archive, puis generated_documents en fallback
    let documentRecord = null;
    let dbError = null;

    try {
      const { data: archiveRecord, error: archiveError } = await supabaseAdmin
        .from('client_documents_archive')
        .insert({
          client_id: finalClientId,
          case_id: caseId || null,
          document_name: documentTitle,
          document_type: documentType,
          file_path: `/generated/${documentType}_${Date.now()}.${fileExtension}`,
          file_size: processedDocument.length,
          mime_type: mimeType,
          is_signed: false,
          variables_used: {
            ...data,
            document_content: processedDocument instanceof Buffer ? '[Binary Word Document]' : processedDocument
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (archiveError) {
        console.log('⚠️ Erreur client_documents_archive, essai generated_documents:', archiveError.message);

        // Fallback vers generated_documents
        const { data: genRecord, error: genError } = await supabaseAdmin
          .from('generated_documents')
          .insert({
            case_id: caseId || null,
            template_id: documentType,
            document_name: documentTitle,
            document_content: processedDocument,
            is_signed: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (genError) {
          dbError = genError;
          console.error('❌ Erreur generated_documents aussi:', genError);
        } else {
          documentRecord = genRecord;
          console.log('✅ Document sauvegardé dans generated_documents');
        }
      } else {
        documentRecord = archiveRecord;
        console.log('✅ Document sauvegardé dans client_documents_archive');
      }
    } catch (error) {
      console.error('❌ Erreur générale sauvegarde:', error);
      dbError = error;
    }

    // Si la sauvegarde échoue, retourner quand même le document généré
    if (dbError && !documentRecord) {
      console.error('❌ Erreur sauvegarde document:', dbError);
      console.log('⚠️ Retour du document sans sauvegarde en base');

      return NextResponse.json({
        success: true,
        document: {
          id: `temp_${Date.now()}`, // ID temporaire
          type: documentType,
          title: documentTitle,
          content: processedDocument,
          status: 'generated_no_save'
        }
      });
    }

    const documentId = documentRecord?.id || `temp_${Date.now()}`;
    console.log('✅ Document généré:', documentId);

    // Pour les documents Word, retourner le buffer en base64
    if (processedDocument instanceof Buffer) {
      return NextResponse.json({
        success: true,
        document: {
          id: documentId,
          type: documentType,
          title: documentTitle,
          content: processedDocument.toString('base64'),
          contentType: 'base64',
          mimeType: mimeType,
          fileExtension: fileExtension,
          status: documentRecord ? 'generated' : 'generated_no_save'
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        document: {
          id: documentId,
          type: documentType,
          title: documentTitle,
          content: processedDocument,
          contentType: 'text',
          mimeType: mimeType,
          fileExtension: fileExtension,
          status: documentRecord ? 'generated' : 'generated_no_save'
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur génération document:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// GET - Récupérer les documents d'un dossier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({
        success: false,
        error: 'caseId requis'
      }, { status: 400 });
    }

    const { data: documents, error } = await supabaseAdmin
      .from('client_documents_archive')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération documents:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération documents'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('❌ Erreur récupération documents:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
