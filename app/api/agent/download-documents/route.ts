import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { OpsioRobustGenerator } from '@/lib/opsio-robust-generator';

// Fonction pour générer les documents OPSIO
async function generateOpsioDocuments(caseData: any, clientData: any, signatureData?: string) {
  try {
    console.log('📄 Génération documents OPSIO pour:', clientData?.nom);

    const documents = [];

    // Données communes pour les templates
    const templateData = {
      clientName: clientData?.nom || 'Client',
      clientAddress: caseData?.clients?.address || 'Adresse non renseignée',
      clientPostalCity: caseData?.clients?.city ? `${caseData.clients.postal_code || ''} ${caseData.clients.city}` : 'Ville non renseignée',
      clientBirthdate: caseData?.clients?.date_of_birth || '',
      clientEmail: clientData?.email || '',
      clientPhone: clientData?.telephone || '',
      advisorName: 'Conseiller OPSIO',
      advisorEmail: 'info@opsio.ch',
      advisorPhone: '+41 78 305 12 77',
      insuranceCompany: caseData?.insurance_company || 'Compagnie d\'assurance',
      policyNumber: caseData?.policy_number || '',
      lamalTerminationDate: caseData?.termination_date || '',
      lcaTerminationDate: caseData?.termination_date || '',
      paymentMethod: 'commission',
      signatureData: signatureData || null // Signature réelle si fournie
    };

    // 1. Générer la feuille d'information OPSIO directement
    try {
      console.log('📄 Génération directe du document OPSIO...');

      const opsioData = {
        ...templateData,
        paymentMethod: 'commission' as 'commission',
        signatureData: signatureData || undefined
      };

      const opsioBuffer = await OpsioRobustGenerator.generateRobustOpsioDocument(opsioData);

      if (opsioBuffer) {
        // Le document OPSIO est maintenant en format Word
        const fileName = 'Feuille_Information_OPSIO.docx';

        documents.push({
          name: fileName,
          content: opsioBuffer,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        console.log('✅ Document OPSIO généré directement:', fileName);
        console.log('- Taille:', opsioBuffer.length, 'bytes');
        console.log('- Type:', 'Word (.docx)');
      }
    } catch (error) {
      console.error('❌ Erreur génération OPSIO:', error);
    }

    // 2. Générer la lettre de résiliation si applicable
    if (caseData?.reason_for_termination) {
      try {
        const resignationResponse = await fetch('http://localhost:3000/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: 'resignation-letter',
            clientId: caseData?.clients?.id,
            data: {
              ...templateData,
              persons: [{
                name: templateData.clientName,
                birthdate: templateData.clientBirthdate,
                policyNumber: templateData.policyNumber,
                isAdult: true
              }]
            }
          })
        });

        const resignationResult = await resignationResponse.json();
        if (resignationResult.success) {
          documents.push({
            name: 'Lettre_Resiliation_Assurance.html',
            content: resignationResult.document.content,
            type: 'resignation-letter'
          });
          console.log('✅ Lettre de résiliation générée');
        }
      } catch (error) {
        console.error('❌ Erreur génération résiliation:', error);
      }
    }

    return documents;
  } catch (error) {
    console.error('❌ Erreur génération documents OPSIO:', error);
    return [];
  }
}

async function handleDownload(caseId: string, clientId: string | null, options: any = {}) {
  try {
    console.log('📦 Téléchargement documents:', { caseId, clientId });

    // Récupérer les informations du dossier
    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        status,
        secure_token,
        insurance_company,
        policy_type,
        policy_number,
        created_at,
        updated_at,
        clients (
          id,
          users (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('❌ Erreur récupération dossier:', caseError);
      return NextResponse.json({
        success: false,
        error: 'Dossier non trouvé'
      }, { status: 404 });
    }

    // Récupérer les signatures du dossier (nouvelle et ancienne table)
    const { data: signatures, error: sigError } = await supabaseAdmin
      .from('signatures')
      .select('*')
      .eq('case_id', caseId);

    // Récupérer aussi les signatures client (nouvelle table)
    const { data: clientSignatures, error: clientSigError } = await supabaseAdmin
      .from('client_signatures')
      .select('*')
      .eq('client_id', clientId || caseData.clients?.id)
      .eq('is_active', true);

    // Récupérer les documents uploadés par le client
    const { data: clientDocuments, error: clientDocError } = await supabaseAdmin
      .from('client_documents')
      .select('*')
      .eq('token', caseData.secure_token);

    // Récupérer les documents générés
    const { data: generatedDocuments, error: genDocError } = await supabaseAdmin
      .from('generated_documents')
      .select('*')
      .eq('case_id', caseId);

    // Créer un ZIP avec tous les documents
    const zip = new JSZip();

    // Ajouter les informations du dossier
    const caseInfo = {
      dossier: {
        numero: caseData.case_number,
        statut: caseData.status,
        token: caseData.secure_token,
        compagnie_assurance: caseData.insurance_company,
        type_police: caseData.policy_type,
        numero_police: caseData.policy_number,
        date_creation: caseData.created_at,
        derniere_modification: caseData.updated_at
      },
      client: {
        nom: `${caseData.clients?.users?.first_name || 'Prénom'} ${caseData.clients?.users?.last_name || 'Nom'}`,
        email: caseData.clients?.users?.email || 'email@example.com',
        telephone: caseData.clients?.users?.phone || 'Non renseigné'
      },
      signatures: signatures?.map(sig => ({
        id: sig.id,
        date_signature: sig.signed_at,
        valide: sig.is_valid,
        adresse_ip: sig.ip_address,
        navigateur: sig.user_agent
      })) || [],
      documents_client: clientDocuments?.map(doc => ({
        id: doc.id,
        nom: doc.filename,
        type: doc.documenttype,
        statut: doc.status,
        date_upload: doc.uploaddate
      })) || [],
      documents_generes: generatedDocuments?.map(doc => ({
        id: doc.id,
        nom: doc.document_name,
        template: doc.template_id,
        signe: doc.is_signed,
        date_creation: doc.created_at
      })) || []
    };

    // Ajouter le fichier d'informations JSON
    zip.file('informations-dossier.json', JSON.stringify(caseInfo, null, 2));

    // Ajouter les signatures comme images
    if (signatures && signatures.length > 0) {
      const signaturesFolder = zip.folder('signatures');
      signatures.forEach((sig, index) => {
        if (sig.signature_data && sig.signature_data.startsWith('data:image/')) {
          // Extraire les données base64
          const base64Data = sig.signature_data.split(',')[1];
          const extension = sig.signature_data.includes('png') ? 'png' : 'jpg';
          signaturesFolder?.file(`signature-${index + 1}-${sig.signed_at?.split('T')[0]}.${extension}`, base64Data, { base64: true });
        }
      });
    }

    // Ajouter les documents uploadés par le client (vrais fichiers)
    if (clientDocuments && clientDocuments.length > 0) {
      const clientDocsFolder = zip.folder('documents-client');

      for (const doc of clientDocuments) {
        try {
          // Essayer de lire le fichier réel depuis le système de fichiers
          let fileContent = null;
          let fileName = doc.filename;

          // Si le fichier a un chemin, essayer de le lire
          if (doc.filepath) {
            try {
              // Pour les fichiers Supabase Storage
              if (doc.filepath.startsWith('http')) {
                console.log(`📥 Téléchargement fichier depuis URL: ${doc.filepath}`);
                const response = await fetch(doc.filepath);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  fileContent = Buffer.from(arrayBuffer);
                  console.log(`✅ Fichier téléchargé: ${fileName} (${fileContent.length} bytes)`);
                }
              } else if (doc.filepath.includes('SECURE_')) {
                // Pour les fichiers Supabase Storage avec chemin sécurisé
                console.log(`📥 Téléchargement fichier Supabase: ${doc.filepath}`);

                // Construire l'URL Supabase Storage
                const { supabaseAdmin } = await import('@/lib/supabase');
                const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                  .from('client-documents')
                  .download(doc.filepath);

                if (fileData && !downloadError) {
                  fileContent = Buffer.from(await fileData.arrayBuffer());
                  console.log(`✅ Fichier Supabase téléchargé: ${fileName} (${fileContent.length} bytes)`);
                } else {
                  console.error(`❌ Erreur téléchargement Supabase:`, downloadError);

                  // Essayer avec l'URL publique
                  const { data: publicUrlData } = supabaseAdmin.storage
                    .from('client-documents')
                    .getPublicUrl(doc.filepath);

                  if (publicUrlData?.publicUrl) {
                    console.log(`📥 Essai URL publique: ${publicUrlData.publicUrl}`);
                    const response = await fetch(publicUrlData.publicUrl);
                    if (response.ok) {
                      const arrayBuffer = await response.arrayBuffer();
                      fileContent = Buffer.from(arrayBuffer);
                      console.log(`✅ Fichier URL publique téléchargé: ${fileName} (${fileContent.length} bytes)`);
                    }
                  }
                }
              } else {
                // Pour les fichiers locaux
                const fullPath = path.join(process.cwd(), 'public', doc.filepath);
                if (fs.existsSync(fullPath)) {
                  fileContent = fs.readFileSync(fullPath);
                  console.log(`✅ Fichier local lu: ${fileName} (${fileContent.length} bytes)`);
                }
              }
            } catch (fileError) {
              console.error(`❌ Erreur lecture fichier ${fileName}:`, fileError.message);
            }
          }

          // Ajouter le fichier réel ou un placeholder
          if (fileContent) {
            clientDocsFolder?.file(fileName, fileContent);
          } else {
            // Fallback: créer un fichier texte avec les informations
            const infoContent = `Document: ${doc.filename}
Type: ${doc.documenttype}
Taille: ${doc.filesize} bytes
Statut: ${doc.status}
Date upload: ${doc.uploaddate}
Chemin original: ${doc.filepath}

Note: Le fichier original n'a pas pu être récupéré.`;

            clientDocsFolder?.file(`${doc.documenttype}-${fileName}.txt`, infoContent);
          }

          // Ajouter aussi les métadonnées JSON
          clientDocsFolder?.file(`${doc.documenttype}-metadata.json`, JSON.stringify({
            nom: doc.filename,
            type: doc.documenttype,
            chemin: doc.filepath,
            statut: doc.status,
            date_upload: doc.uploaddate,
            taille: doc.filesize,
            mime_type: doc.mimetype
          }, null, 2));

        } catch (error) {
          console.error(`❌ Erreur traitement document ${doc.filename}:`, error);
        }
      }
    }

    // 🆕 Générer des documents Word avec signatures automatiques si demandé
    if (options.generateWordWithSignature || options.includeWordDocuments) {
      const wordDocsFolder = zip.folder('documents-word-avec-signatures');

      // Récupérer la signature la plus récente
      let signatureData = null;
      if (clientSignatures && clientSignatures.length > 0) {
        signatureData = clientSignatures[0].signature_data;
        console.log('✅ Signature client récupérée depuis client_signatures');
      } else if (signatures && signatures.length > 0) {
        signatureData = signatures[signatures.length - 1].signature_data;
        console.log('✅ Signature récupérée depuis signatures (fallback)');
      }

      if (signatureData) {
        try {
          // Importer le générateur de documents Word
          const { DocxGenerator } = await import('@/lib/docx-generator');

          // Préparer les données client pour le document
          const clientDataForDoc = {
            nomPrenom: `${caseData.clients.users.first_name} ${caseData.clients.users.last_name}`,
            nom: caseData.clients.users.last_name,
            prenom: caseData.clients.users.first_name,
            dateNaissance: caseData.clients.date_of_birth || '',
            email: caseData.clients.users.email,
            telephone: caseData.clients.users.phone || '',
            destinataire: caseData.insurance_company,
            numeroPolice: caseData.policy_number,
            typeFormulaire: caseData.policy_type,
            dateLamal: caseData.termination_date,
            dateLCA: caseData.termination_date,
            adresse: caseData.clients.address || '',
            npa: caseData.clients.postal_code || '',
            ville: caseData.clients.city || '',
            npaVille: `${caseData.clients.postal_code || ''} ${caseData.clients.city || ''}`.trim(),
            personnes: [] // Pas de personnes supplémentaires pour l'instant
          };

          // Générer le document Word avec signature
          const wordBuffer = await DocxGenerator.generateResignationDocument(clientDataForDoc, signatureData);

          // Ajouter le document Word au ZIP
          wordDocsFolder?.file(
            `Lettre-Resiliation-${caseData.case_number}-SIGNE.docx`,
            wordBuffer
          );

          console.log('✅ Document Word avec signature ajouté au ZIP');
        } catch (error) {
          console.error('❌ Erreur génération document Word:', error);
        }
      }
    }

    // Ajouter les documents générés (anciens)
    if (generatedDocuments && generatedDocuments.length > 0) {
      const genDocsFolder = zip.folder('documents-generes');
      generatedDocuments.forEach((doc, index) => {
        // Ajouter le contenu du document
        if (doc.document_content) {
          genDocsFolder?.file(`${doc.document_name}.txt`, doc.document_content);
        }

        // Ajouter le PDF signé si disponible
        if (doc.signed_pdf_data) {
          const base64Data = doc.signed_pdf_data.replace(/^data:application\/pdf;base64,/, '');
          genDocsFolder?.file(`${doc.document_name}-signe.pdf`, base64Data, { base64: true });
        }
      });
    }

    // 🆕 Générer et ajouter les documents OPSIO
    try {
      console.log('📄 Génération des documents OPSIO...');
      const opsioDocuments = await generateOpsioDocuments(caseData, caseInfo.client, options.signatureData);

      if (opsioDocuments.length > 0) {
        const opsioFolder = zip.folder('documents-opsio');

        opsioDocuments.forEach(doc => {
          opsioFolder?.file(doc.name, doc.content);
          console.log(`✅ Document OPSIO ajouté: ${doc.name}`);
        });

        // Ajouter les métadonnées des documents OPSIO
        opsioFolder?.file('_informations-opsio.json', JSON.stringify({
          documents_generes: opsioDocuments.map(doc => ({
            nom: doc.name,
            type: doc.type,
            taille: doc.content.length,
            genere_le: new Date().toISOString()
          })),
          total_documents: opsioDocuments.length,
          genere_automatiquement: true
        }, null, 2));

        console.log(`✅ ${opsioDocuments.length} documents OPSIO générés et ajoutés au ZIP`);
      }
    } catch (error) {
      console.error('❌ Erreur génération documents OPSIO:', error);
      // Continuer même en cas d'erreur
    }

    // Si aucun document
    if ((!clientDocuments || clientDocuments.length === 0) && (!generatedDocuments || generatedDocuments.length === 0)) {
      zip.file('aucun-document.txt', 'Aucun document n\'a été uploadé ou généré pour ce dossier.');
    }

    // Combiner tous les documents pour le rapport
    const allDocuments = [
      ...(clientDocuments || []).map(doc => ({
        file_name: doc.filename,
        file_type: doc.documenttype,
        file_size: doc.filesize || 'N/A',
        source: 'Client'
      })),
      ...(generatedDocuments || []).map(doc => ({
        file_name: doc.document_name,
        file_type: 'Document généré',
        file_size: 'N/A',
        source: 'Système'
      }))
    ];

    // Ajouter un rapport de synthèse
    const rapport = `RAPPORT DE SYNTHÈSE - DOSSIER ${caseData.case_number}
=====================================

Client: ${caseData.clients?.users?.first_name || 'Prénom'} ${caseData.clients?.users?.last_name || 'Nom'}
Email: ${caseData.clients?.users?.email || 'email@example.com'}
Téléphone: ${caseData.clients?.users?.phone || 'Non renseigné'}

Assurance:
- Compagnie: ${caseData.insurance_company}
- Type: ${caseData.policy_type || 'Non spécifié'}
- Numéro de police: ${caseData.policy_number}

Dossier:
- Numéro: ${caseData.case_number}
- Statut: ${caseData.status}
- Créé le: ${new Date(caseData.created_at).toLocaleString('fr-FR')}
- Modifié le: ${new Date(caseData.updated_at).toLocaleString('fr-FR')}

Signatures: ${signatures?.length || 0}
${signatures?.map((sig, i) => `  ${i + 1}. Signée le ${new Date(sig.signed_at).toLocaleString('fr-FR')} - ${sig.is_valid ? 'Valide' : 'En attente'}`).join('\n') || '  Aucune signature'}

Documents: ${allDocuments.length || 0}
${allDocuments.map((doc, i) => `  ${i + 1}. ${doc.file_name} (${doc.file_type}) - ${doc.file_size} - Source: ${doc.source}`).join('\n') || '  Aucun document'}

Documents Client: ${clientDocuments?.length || 0}
Documents Générés: ${generatedDocuments?.length || 0}

Lien portail client: https://esignpro.ch/client-portal/${caseData.secure_token}

Généré le: ${new Date().toLocaleString('fr-FR')}
Par: Agent eSignPro
`;

    zip.file('rapport-synthese.txt', rapport);

    // Générer le ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Retourner le ZIP
    const fileName = `dossier-${caseData.case_number}-${caseData.clients?.users?.first_name || 'client'}-${caseData.clients?.users?.last_name || 'nom'}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur téléchargement documents:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération du ZIP'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');

    if (!caseId) {
      return NextResponse.json({
        success: false,
        error: 'caseId requis'
      }, { status: 400 });
    }

    return await handleDownload(caseId, clientId);
  } catch (error) {
    console.error('❌ Erreur GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      caseId,
      clientId,
      includeWordDocuments = false,
      includeSignatures = true,
      generateWordWithSignature = false,
      signatureData = null // Signature réelle en base64
    } = await request.json();

    if (!caseId) {
      return NextResponse.json({
        success: false,
        error: 'caseId requis'
      }, { status: 400 });
    }

    const options = {
      includeWordDocuments,
      includeSignatures,
      generateWordWithSignature,
      signatureData
    };

    return await handleDownload(caseId, clientId, options);
  } catch (error) {
    console.error('❌ Erreur POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}
