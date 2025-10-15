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

    // Récupérer les données complètes du client depuis la table clients (comme dans download-all-documents)
    const clientInfo = Array.isArray(caseData?.clients) ? caseData.clients[0] : caseData?.clients;
    const { data: clientDetails, error: clientDetailsError } = await supabaseAdmin
      .from('clients')
      .select('address, city, postal_code, country, date_of_birth')
      .eq('id', clientInfo?.id)
      .single();

    if (clientDetailsError) {
      console.error('❌ Erreur récupération détails client:', clientDetailsError);
    } else {
      console.log('✅ Détails client récupérés:', clientDetails);
    }

    // Construire l'adresse complète
    let fullAddress = '';
    if (clientDetails?.address) {
      fullAddress = clientDetails.address;
    }

    let postalCity = '';
    if (clientDetails?.postal_code && clientDetails?.city) {
      postalCity = `${clientDetails.postal_code} ${clientDetails.city}`;
    } else if (clientDetails?.city) {
      postalCity = clientDetails.city;
    }

    // Données communes pour les templates (inspiré de download-all-documents)
    const templateData = {
      clientName: clientData?.nom || 'Client',
      clientAddress: fullAddress || '', // Adresse réelle ou vide
      clientPostalCity: postalCity || '', // NPA/Localité réels ou vides
      clientBirthdate: clientDetails?.date_of_birth ? new Date(clientDetails.date_of_birth).toLocaleDateString('fr-CH') : '',
      clientEmail: clientData?.email || '',
      clientPhone: clientData?.telephone || '',
      advisorName: 'Conseiller OPSIO',
      advisorEmail: 'info@opsio.ch',
      advisorPhone: '+41 78 305 12 77',
      insuranceCompany: caseData?.insurance_company || 'Compagnie d\'assurance',
      policyNumber: caseData?.policy_number || '',
      lamalTerminationDate: caseData?.completed_at ? new Date(caseData.completed_at).toLocaleDateString('fr-CH') : '',
      lcaTerminationDate: caseData?.completed_at ? new Date(caseData.completed_at).toLocaleDateString('fr-CH') : '',
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
        // Le document OPSIO est maintenant en format Word (renommé comme dans download-all-documents)
        const fileName = `Art45 - Optio-${caseData?.case_number || 'CASE'}.docx`;

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

    // 2. Générer la lettre de résiliation directement avec DocxGenerator (comme dans download-all-documents)
    try {
      console.log(`📄 Génération résiliation pour dossier ${caseData?.case_number}...`);

      // Importer le générateur de documents Word
      const { DocxGenerator } = await import('@/lib/docx-generator');

      // Séparer le nom et prénom pour l'interface ClientData
      const nameParts = templateData.clientName.split(' ');
      const prenom = nameParts[0] || 'Prénom';
      const nom = nameParts.slice(1).join(' ') || 'Nom';

      const clientDataForResignation = {
        // Champs séparés requis par l'interface ClientData
        nom: nom,
        prenom: prenom,
        dateNaissance: templateData.clientBirthdate || '',
        numeroPolice: templateData.policyNumber || '',
        email: templateData.clientEmail || '',

        // Adresse séparée
        adresse: templateData.clientAddress || '',
        npa: templateData.clientPostalCity.split(' ')[0] || '',
        ville: templateData.clientPostalCity.split(' ').slice(1).join(' ') || '',

        // Type et destinataire
        typeFormulaire: 'resiliation' as const,
        destinataire: templateData.insuranceCompany || 'Compagnie d\'assurance',
        lieuDate: `Genève, le ${new Date().toLocaleDateString('fr-CH')}`,

        // Personnes supplémentaires
        personnes: [],

        // Dates spécifiques
        dateLamal: templateData.lamalTerminationDate || '',
        dateLCA: templateData.lcaTerminationDate || '',

        // Champs legacy pour compatibilité
        nomPrenom: templateData.clientName,
        npaVille: templateData.clientPostalCity
      };

      const resignationBuffer = await DocxGenerator.generateResignationDocument(clientDataForResignation, signatureData);

      if (resignationBuffer) {
        documents.push({
          name: `Lettre_Resiliation_${caseData?.case_number || 'CASE'}.docx`,
          content: resignationBuffer,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        console.log(`✅ Document résiliation généré pour ${caseData?.case_number} (${resignationBuffer.length} bytes)`);
      }
    } catch (error) {
      console.error('❌ Erreur génération résiliation:', error);
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

    // Récupérer les signatures client (système centralisé)
    const clientInfo = Array.isArray(caseData?.clients) ? caseData.clients[0] : caseData?.clients;
    const userInfo = Array.isArray(clientInfo?.users) ? clientInfo.users[0] : clientInfo?.users;
    const { data: clientSignatures, error: clientSigError } = await supabaseAdmin
      .from('client_signatures')
      .select('*')
      .eq('client_id', clientId || clientInfo?.id)
      .eq('is_active', true);

    // Plus d'utilisation de l'ancienne table signatures
    const signatures: any[] = [];

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
        nom: `${userInfo?.first_name || 'Prénom'} ${userInfo?.last_name || 'Nom'}`,
        email: userInfo?.email || 'email@example.com',
        telephone: userInfo?.phone || 'Non renseigné'
      },
      signatures_client: clientSignatures?.map(sig => ({
        id: sig.id,
        nom_signature: sig.signature_name,
        date_creation: sig.created_at,
        active: sig.is_active,
        par_defaut: sig.is_default
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

    // Ajouter les signatures client comme images
    if (clientSignatures && clientSignatures.length > 0) {
      const signaturesFolder = zip.folder('signatures-client');
      clientSignatures.forEach((sig, index) => {
        if (sig.signature_data && sig.signature_data.startsWith('data:image/')) {
          // Extraire les données base64
          const base64Data = sig.signature_data.split(',')[1];
          const extension = sig.signature_data.includes('png') ? 'png' : 'jpg';
          const dateCreation = sig.created_at?.split('T')[0] || 'date-inconnue';
          signaturesFolder?.file(`signature-client-${index + 1}-${dateCreation}.${extension}`, base64Data, { base64: true });
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

    //
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

      // Récupérer la signature client pour les documents OPSIO
      let signatureDataForOpsio = options.signatureData;
      if (!signatureDataForOpsio && clientSignatures && clientSignatures.length > 0) {
        signatureDataForOpsio = clientSignatures[0].signature_data;
        console.log('✅ Signature client récupérée pour OPSIO depuis client_signatures');
      }

      const opsioDocuments = await generateOpsioDocuments(caseData, caseInfo.client, signatureDataForOpsio);

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

Signatures Client: ${clientSignatures?.length || 0}
${clientSignatures?.map((sig, i) => `  ${i + 1}. ${sig.signature_name} - Créée le ${new Date(sig.created_at).toLocaleString('fr-FR')} - ${sig.is_active ? 'Active' : 'Inactive'}`).join('\n') || '  Aucune signature client'}

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
