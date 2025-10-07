import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Fonction utilitaire pour télécharger un fichier depuis son emplacement de stockage
async function downloadFileFromStorage(document: any): Promise<{ buffer: Buffer | null, error: string | null }> {
  try {
    console.log('📥 Téléchargement fichier:', document.filename, 'depuis:', document.filepath);

    // Vérifier si le fichier est dans Supabase Storage
    if (document.filepath && !document.filepath.startsWith('/uploads/')) {
      // Fichier dans Supabase Storage
      console.log('☁️ Téléchargement depuis Supabase Storage:', document.filepath);

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('client-documents')
        .download(document.filepath);

      if (downloadError) {
        console.error('❌ Erreur téléchargement Supabase Storage:', downloadError);
        return { buffer: null, error: `Erreur Supabase Storage: ${downloadError.message}` };
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      console.log('✅ Fichier téléchargé depuis Storage:', buffer.length, 'bytes');
      return { buffer, error: null };
    }

    // Fichier local dans /public/uploads/
    else if (document.filepath && document.filepath.startsWith('/uploads/')) {
      console.log('💾 Téléchargement depuis fichier local:', document.filepath);

      // Construire le chemin absolu
      const publicPath = join(process.cwd(), 'public', document.filepath);

      try {
        const buffer = await readFile(publicPath);
        console.log('✅ Fichier local lu:', buffer.length, 'bytes');
        return { buffer, error: null };
      } catch (fileError) {
        console.error('❌ Erreur lecture fichier local:', fileError);
        return { buffer: null, error: `Fichier local non trouvé: ${document.filepath}` };
      }
    }

    // Chemin de fichier non reconnu
    else {
      console.warn('⚠️ Chemin de fichier non reconnu:', document.filepath);
      return { buffer: null, error: `Chemin de fichier non valide: ${document.filepath}` };
    }

  } catch (error) {
    console.error('❌ Erreur générale téléchargement fichier:', error);
    return { buffer: null, error: `Erreur téléchargement: ${error.message}` };
  }
}

// Fonction pour organiser les documents par type
function getDocumentTypeFolder(documentType: string): string {
  const typeMapping = {
    'identity_front': 'identite',
    'identity_back': 'identite',
    'insurance_contract': 'contrats',
    'proof_address': 'justificatifs',
    'bank_statement': 'justificatifs',
    'additional': 'autres'
  };

  return typeMapping[documentType] || 'autres';
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'clientId requis'
      }, { status: 400 });
    }

    console.log('📦 Création ZIP pour client:', clientId);

    // 1. Récupérer les informations du client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        client_code,
        users!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({
        success: false,
        error: 'Client non trouvé'
      }, { status: 404 });
    }

    const clientName = `${client.users.first_name} ${client.users.last_name}`;
    console.log('👤 Client trouvé:', clientName);

    // 2. Récupérer tous les dossiers du client
    const { data: cases, error: casesError } = await supabaseAdmin
      .from('insurance_cases')
      .select(`
        id,
        case_number,
        insurance_company,
        policy_number,
        status,
        created_at,
        completed_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (casesError) {
      console.error('❌ Erreur récupération dossiers:', casesError);
      return NextResponse.json({
        success: false,
        error: 'Erreur récupération dossiers'
      }, { status: 500 });
    }

    console.log('📁 Dossiers trouvés:', cases?.length || 0);

    // 3. Récupérer toutes les signatures du client
    const { data: clientSignatures, error: sigError } = await supabaseAdmin
      .from('client_signatures')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (sigError) {
      console.warn('⚠️ Erreur récupération signatures client:', sigError);
    }

    // 4. Récupérer les signatures de dossiers
    const caseIds = cases?.map(c => c.id) || [];
    let caseSignatures = [];
    
    if (caseIds.length > 0) {
      const { data: caseSigs, error: caseSigError } = await supabaseAdmin
        .from('signatures')
        .select('*')
        .in('case_id', caseIds);

      if (!caseSigError && caseSigs) {
        caseSignatures = caseSigs;
      }
    }

    console.log('✍️ Signatures trouvées:', {
      clientSignatures: clientSignatures?.length || 0,
      caseSignatures: caseSignatures.length
    });

    // 4.5. Récupérer tous les documents du client
    const { data: clientDocuments, error: docsError } = await supabaseAdmin
      .from('client_documents')
      .select('*')
      .eq('clientid', clientId)
      .order('uploaddate', { ascending: false });

    if (docsError) {
      console.warn('⚠️ Erreur récupération documents client:', docsError);
    }

    console.log('📄 Documents trouvés:', clientDocuments?.length || 0);

    // 5. Créer le ZIP
    const zip = new JSZip();

    // Dossier principal du client
    const clientFolder = zip.folder(`${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${client.client_code}`);
    
    if (!clientFolder) {
      throw new Error('Impossible de créer le dossier client');
    }

    // 5.1. Ajouter un fichier d'informations client
    const clientInfo = {
      nom: clientName,
      email: client.users.email,
      code_client: client.client_code,
      nombre_dossiers: cases?.length || 0,
      nombre_signatures: (clientSignatures?.length || 0) + caseSignatures.length,
      date_export: new Date().toISOString()
    };

    clientFolder.file('informations_client.json', JSON.stringify(clientInfo, null, 2));

    // 5.2. Ajouter les documents réels du client
    if (clientDocuments && clientDocuments.length > 0) {
      console.log('📁 Ajout des documents client au ZIP...');
      const documentsFolder = clientFolder.folder('documents');

      // Statistiques des documents
      let documentsStats = {
        total: clientDocuments.length,
        downloaded: 0,
        errors: 0,
        by_type: {}
      };

      for (const document of clientDocuments) {
        try {
          // Télécharger le fichier réel
          const { buffer, error } = await downloadFileFromStorage(document);

          if (buffer && !error) {
            // Organiser par type de document
            const typeFolder = getDocumentTypeFolder(document.documenttype);
            const docTypeFolder = documentsFolder?.folder(typeFolder);

            // Ajouter le fichier réel au ZIP
            const safeFileName = document.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            docTypeFolder?.file(safeFileName, buffer);

            documentsStats.downloaded++;
            documentsStats.by_type[typeFolder] = (documentsStats.by_type[typeFolder] || 0) + 1;

            console.log(`✅ Document ajouté: ${typeFolder}/${safeFileName} (${buffer.length} bytes)`);
          } else {
            console.warn(`⚠️ Impossible de télécharger: ${document.filename} - ${error}`);
            documentsStats.errors++;

            // Créer un fichier d'erreur pour traçabilité
            const errorInfo = {
              filename: document.filename,
              filepath: document.filepath,
              error: error,
              document_type: document.documenttype,
              upload_date: document.uploaddate
            };

            const errorFolder = documentsFolder?.folder('erreurs');
            errorFolder?.file(`ERREUR_${document.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`,
              JSON.stringify(errorInfo, null, 2));
          }
        } catch (docError) {
          console.error(`❌ Erreur traitement document ${document.filename}:`, docError);
          documentsStats.errors++;
        }
      }

      // Ajouter un rapport des documents
      const documentsReport = {
        ...documentsStats,
        generated_at: new Date().toISOString(),
        client_id: clientId,
        client_name: clientName
      };

      documentsFolder?.file('rapport_documents.json', JSON.stringify(documentsReport, null, 2));

      console.log('📊 Statistiques documents:', documentsStats);
    }

    // 5.3. Ajouter les signatures du client (réutilisables)
    if (clientSignatures && clientSignatures.length > 0) {
      const signaturesFolder = clientFolder.folder('signatures_client');
      
      for (const signature of clientSignatures) {
        try {
          // Créer un formulaire Word complet avec signature
          const formParagraphs = [
            // En-tête du formulaire
            new Paragraph({
              children: [
                new TextRun({
                  text: "FORMULAIRE DE SIGNATURE ÉLECTRONIQUE",
                  bold: true,
                  size: 32,
                  color: "2563EB"
                })
              ],
              alignment: "center"
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "eSignPro - Signature Électronique Sécurisée",
                  size: 24,
                  color: "6B7280"
                })
              ],
              alignment: "center"
            }),
            new Paragraph({ children: [] }), // Espace

            // Informations client
            new Paragraph({
              children: [
                new TextRun({
                  text: "INFORMATIONS CLIENT",
                  bold: true,
                  size: 28,
                  color: "1F2937"
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nom complet: ", bold: true, size: 24 }),
                new TextRun({ text: clientName, size: 24 })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Email: ", bold: true, size: 24 }),
                new TextRun({ text: client.users.email, size: 24 })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Code client: ", bold: true, size: 24 }),
                new TextRun({ text: client.client_code, size: 24 })
              ]
            }),
            new Paragraph({ children: [] }), // Espace

            // Informations signature
            new Paragraph({
              children: [
                new TextRun({
                  text: "DÉTAILS DE LA SIGNATURE",
                  bold: true,
                  size: 28,
                  color: "1F2937"
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nom de la signature: ", bold: true, size: 24 }),
                new TextRun({ text: signature.signature_name, size: 24 })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Date de création: ", bold: true, size: 24 }),
                new TextRun({ text: new Date(signature.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }), size: 24 })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Type: ", bold: true, size: 24 }),
                new TextRun({
                  text: signature.is_default ? 'Signature par défaut' : 'Signature secondaire',
                  size: 24,
                  color: signature.is_default ? "059669" : "7C3AED"
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Statut: ", bold: true, size: 24 }),
                new TextRun({
                  text: signature.is_active ? 'Active' : 'Inactive',
                  size: 24,
                  color: signature.is_active ? "059669" : "DC2626"
                })
              ]
            }),
            new Paragraph({ children: [] }), // Espace

            // Section signature
            new Paragraph({
              children: [
                new TextRun({
                  text: "SIGNATURE ÉLECTRONIQUE",
                  bold: true,
                  size: 28,
                  color: "1F2937"
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "La signature ci-dessous a été capturée électroniquement et est juridiquement valide:",
                  size: 22,
                  italics: true,
                  color: "6B7280"
                })
              ]
            }),
            new Paragraph({ children: [] }), // Espace pour la signature
          ];

          const doc = new Document({
            sections: [{
              properties: {
                page: {
                  margin: {
                    top: 1440,    // 1 inch
                    right: 1440,
                    bottom: 1440,
                    left: 1440,
                  },
                },
              },
              children: formParagraphs
            }]
          });

          // Si la signature contient des données d'image, les ajouter au formulaire
          if (signature.signature_data && signature.signature_data.startsWith('data:image/')) {
            try {
              const base64Data = signature.signature_data.split(',')[1];
              const imageBuffer = Buffer.from(base64Data, 'base64');

              // Créer un formulaire complet avec l'image de signature intégrée
              const completeFormParagraphs = [
                // En-tête du formulaire
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "FORMULAIRE DE SIGNATURE ÉLECTRONIQUE",
                      bold: true,
                      size: 32,
                      color: "2563EB"
                    })
                  ],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "eSignPro - Signature Électronique Sécurisée",
                      size: 24,
                      color: "6B7280"
                    })
                  ],
                  alignment: "center"
                }),
                new Paragraph({ children: [] }), // Espace

                // Informations client
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "INFORMATIONS CLIENT",
                      bold: true,
                      size: 28,
                      color: "1F2937"
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Nom complet: ", bold: true, size: 24 }),
                    new TextRun({ text: clientName, size: 24 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Email: ", bold: true, size: 24 }),
                    new TextRun({ text: client.users.email, size: 24 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Code client: ", bold: true, size: 24 }),
                    new TextRun({ text: client.client_code, size: 24 })
                  ]
                }),
                new Paragraph({ children: [] }), // Espace

                // Informations signature
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "DÉTAILS DE LA SIGNATURE",
                      bold: true,
                      size: 28,
                      color: "1F2937"
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Nom de la signature: ", bold: true, size: 24 }),
                    new TextRun({ text: signature.signature_name, size: 24 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Date de création: ", bold: true, size: 24 }),
                    new TextRun({ text: new Date(signature.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }), size: 24 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Type: ", bold: true, size: 24 }),
                    new TextRun({
                      text: signature.is_default ? 'Signature par défaut' : 'Signature secondaire',
                      size: 24
                    })
                  ]
                }),
                new Paragraph({ children: [] }), // Espace

                // Section signature avec image
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "SIGNATURE ÉLECTRONIQUE",
                      bold: true,
                      size: 28,
                      color: "1F2937"
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "La signature ci-dessous a été capturée électroniquement et est juridiquement valide:",
                      size: 22,
                      italics: true,
                      color: "6B7280"
                    })
                  ]
                }),
                new Paragraph({ children: [] }), // Espace

                // Image de signature avec bordure
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: imageBuffer,
                      transformation: {
                        width: 400,
                        height: 200,
                      },
                    })
                  ],
                  alignment: "center"
                }),
                new Paragraph({ children: [] }), // Espace

                // Informations de validation
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "VALIDATION ET CERTIFICATION",
                      bold: true,
                      size: 28,
                      color: "1F2937"
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Horodatage: ", bold: true, size: 22 }),
                    new TextRun({
                      text: new Date(signature.created_at).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short'
                      }),
                      size: 22
                    })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Plateforme: ", bold: true, size: 22 }),
                    new TextRun({ text: "eSignPro - Signature Électronique Sécurisée", size: 22 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Conformité: ", bold: true, size: 22 }),
                    new TextRun({ text: "Conforme à la législation suisse (SCSE)", size: 22, color: "059669" })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Intégrité: ", bold: true, size: 22 }),
                    new TextRun({ text: "Document protégé contre la falsification", size: 22, color: "059669" })
                  ]
                }),
                new Paragraph({ children: [] }), // Espace

                // Pied de page
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Ce document constitue une preuve légale de signature électronique.",
                      size: 20,
                      italics: true,
                      color: "6B7280"
                    })
                  ],
                  alignment: "center"
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Document généré le ${new Date().toLocaleString('fr-FR')}`,
                      size: 18,
                      color: "9CA3AF"
                    })
                  ],
                  alignment: "center"
                })
              ];

              const docWithImage = new Document({
                sections: [{
                  properties: {
                    page: {
                      margin: {
                        top: 1440,    // 1 inch
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                      },
                    },
                  },
                  children: completeFormParagraphs
                }]
              });

              const buffer = await Packer.toBuffer(docWithImage);
              signaturesFolder?.file(`${signature.signature_name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`, buffer);
              
              // Aussi sauvegarder l'image séparément
              signaturesFolder?.file(`${signature.signature_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, imageBuffer);
              
            } catch (imageError) {
              console.warn('⚠️ Erreur traitement image signature:', imageError);
              // Fallback: document sans image
              const buffer = await Packer.toBuffer(doc);
              signaturesFolder?.file(`${signature.signature_name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`, buffer);
            }
          } else {
            // Document sans image
            const buffer = await Packer.toBuffer(doc);
            signaturesFolder?.file(`${signature.signature_name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`, buffer);
          }

        } catch (docError) {
          console.warn('⚠️ Erreur création document signature:', docError);
        }
      }
    }

    // 5.3. Ajouter les dossiers avec leurs documents
    if (cases && cases.length > 0) {
      const dossiersFolder = clientFolder.folder('dossiers');

      for (const caseItem of cases) {
        const caseFolder = dossiersFolder?.folder(`${caseItem.case_number}`);
        
        // Informations du dossier
        const caseInfo = {
          numero_dossier: caseItem.case_number,
          compagnie_assurance: caseItem.insurance_company,
          numero_police: caseItem.policy_number,
          statut: caseItem.status,
          date_creation: caseItem.created_at,
          date_completion: caseItem.completed_at
        };

        caseFolder?.file('informations_dossier.json', JSON.stringify(caseInfo, null, 2));

        // Documents spécifiques à ce dossier
        const caseDocuments = clientDocuments?.filter(doc => doc.token === caseItem.case_number) || [];

        if (caseDocuments.length > 0) {
          console.log(`📄 Documents du dossier ${caseItem.case_number}:`, caseDocuments.length);
          const caseDocsFolder = caseFolder?.folder('documents');

          for (const document of caseDocuments) {
            try {
              // Télécharger le fichier réel
              const { buffer, error } = await downloadFileFromStorage(document);

              if (buffer && !error) {
                // Organiser par type de document
                const typeFolder = getDocumentTypeFolder(document.documenttype);
                const docTypeFolder = caseDocsFolder?.folder(typeFolder);

                // Ajouter le fichier réel au ZIP
                const safeFileName = document.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
                docTypeFolder?.file(safeFileName, buffer);

                console.log(`✅ Document dossier ajouté: ${caseItem.case_number}/${typeFolder}/${safeFileName}`);
              } else {
                console.warn(`⚠️ Impossible de télécharger document dossier: ${document.filename} - ${error}`);

                // Créer un fichier d'erreur
                const errorInfo = {
                  filename: document.filename,
                  filepath: document.filepath,
                  error: error,
                  case_number: caseItem.case_number,
                  document_type: document.documenttype
                };

                const errorFolder = caseDocsFolder?.folder('erreurs');
                errorFolder?.file(`ERREUR_${document.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`,
                  JSON.stringify(errorInfo, null, 2));
              }
            } catch (docError) {
              console.error(`❌ Erreur traitement document dossier ${document.filename}:`, docError);
            }
          }
        }

        // Signatures spécifiques à ce dossier
        const caseSigs = caseSignatures.filter(s => s.case_id === caseItem.id);
        
        if (caseSigs.length > 0) {
          for (const caseSig of caseSigs) {
            try {
              if (caseSig.signature_data && caseSig.signature_data.startsWith('data:image/')) {
                const base64Data = caseSig.signature_data.split(',')[1];
                const imageBuffer = Buffer.from(base64Data, 'base64');
                
                // Formulaire complet pour le dossier avec signature
                const caseFormParagraphs = [
                  // En-tête du formulaire de dossier
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "FORMULAIRE DE DOSSIER SIGNÉ",
                        bold: true,
                        size: 32,
                        color: "2563EB"
                      })
                    ],
                    alignment: "center"
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "eSignPro - Signature Électronique Sécurisée",
                        size: 24,
                        color: "6B7280"
                      })
                    ],
                    alignment: "center"
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Informations du dossier
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "INFORMATIONS DU DOSSIER",
                        bold: true,
                        size: 28,
                        color: "1F2937"
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Numéro de dossier: ", bold: true, size: 24 }),
                      new TextRun({ text: caseItem.case_number, size: 24, color: "2563EB" })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Compagnie d'assurance: ", bold: true, size: 24 }),
                      new TextRun({ text: caseItem.insurance_company, size: 24 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Type de police: ", bold: true, size: 24 }),
                      new TextRun({ text: caseItem.policy_type, size: 24 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Numéro de police: ", bold: true, size: 24 }),
                      new TextRun({ text: caseItem.policy_number, size: 24 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Statut: ", bold: true, size: 24 }),
                      new TextRun({
                        text: caseItem.status.toUpperCase(),
                        size: 24,
                        color: caseItem.status === 'completed' ? "059669" : "DC2626"
                      })
                    ]
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Informations client
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "INFORMATIONS CLIENT",
                        bold: true,
                        size: 28,
                        color: "1F2937"
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Nom complet: ", bold: true, size: 24 }),
                      new TextRun({ text: clientName, size: 24 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Email: ", bold: true, size: 24 }),
                      new TextRun({ text: client.users.email, size: 24 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Code client: ", bold: true, size: 24 }),
                      new TextRun({ text: client.client_code, size: 24 })
                    ]
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Informations de signature
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "SIGNATURE ÉLECTRONIQUE",
                        bold: true,
                        size: 28,
                        color: "1F2937"
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Date de signature: ", bold: true, size: 24 }),
                      new TextRun({
                        text: new Date(caseSig.signed_at || caseSig.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }),
                        size: 24
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Statut de validation: ", bold: true, size: 24 }),
                      new TextRun({
                        text: caseSig.is_valid ? 'Signature valide' : 'En attente de validation',
                        size: 24,
                        color: caseSig.is_valid ? "059669" : "DC2626"
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "La signature ci-dessous a été capturée électroniquement:",
                        size: 22,
                        italics: true,
                        color: "6B7280"
                      })
                    ]
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Image de signature
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: 400,
                          height: 200,
                        },
                      })
                    ],
                    alignment: "center"
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Validation et certification
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "VALIDATION ET CERTIFICATION",
                        bold: true,
                        size: 28,
                        color: "1F2937"
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Horodatage: ", bold: true, size: 22 }),
                      new TextRun({
                        text: new Date(caseSig.signed_at || caseSig.created_at).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        }),
                        size: 22
                      })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Plateforme: ", bold: true, size: 22 }),
                      new TextRun({ text: "eSignPro - Signature Électronique Sécurisée", size: 22 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Conformité: ", bold: true, size: 22 }),
                      new TextRun({ text: "Conforme à la législation suisse (SCSE)", size: 22, color: "059669" })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Intégrité: ", bold: true, size: 22 }),
                      new TextRun({ text: "Document protégé contre la falsification", size: 22, color: "059669" })
                    ]
                  }),
                  new Paragraph({ children: [] }), // Espace

                  // Pied de page
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Ce document constitue une preuve légale de signature électronique pour ce dossier.",
                        size: 20,
                        italics: true,
                        color: "6B7280"
                      })
                    ],
                    alignment: "center"
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Document généré le ${new Date().toLocaleString('fr-FR')}`,
                        size: 18,
                        color: "9CA3AF"
                      })
                    ],
                    alignment: "center"
                  })
                ];

                const doc = new Document({
                  sections: [{
                    properties: {
                      page: {
                        margin: {
                          top: 1440,    // 1 inch
                          right: 1440,
                          bottom: 1440,
                          left: 1440,
                        },
                      },
                    },
                    children: caseFormParagraphs
                  }]
                });

                const buffer = await Packer.toBuffer(doc);
                caseFolder?.file(`signature_${caseItem.case_number}.docx`, buffer);

                // Aussi sauvegarder l'image séparément
                caseFolder?.file(`signature_${caseItem.case_number}.png`, imageBuffer);

              } else {
                // Formulaire sans image de signature
                const basicFormParagraphs = [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "FORMULAIRE DE DOSSIER",
                        bold: true,
                        size: 32,
                        color: "2563EB"
                      })
                    ],
                    alignment: "center"
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Dossier ${caseItem.case_number}`,
                        size: 24,
                        color: "6B7280"
                      })
                    ],
                    alignment: "center"
                  }),
                ];

                const doc = new Document({
                  sections: [{
                    properties: {
                      page: {
                        margin: {
                          top: 1440,    // 1 inch
                          right: 1440,
                          bottom: 1440,
                          left: 1440,
                        },
                      },
                    },
                    children: caseFormParagraphs
                  }]
                });

                const buffer = await Packer.toBuffer(doc);
                caseFolder?.file(`signature_${caseItem.case_number}.docx`, buffer);
                caseFolder?.file(`signature_${caseItem.case_number}.png`, imageBuffer);
                
              }
            } catch (sigError) {
              console.warn('⚠️ Erreur traitement signature dossier:', sigError);
            }
          }
        }
      }
    }

    // 6. Générer le ZIP
    console.log('🔄 Génération du fichier ZIP...');
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 7. Retourner le ZIP
    const fileName = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_documents_complets.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('💥 Erreur création ZIP:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création du ZIP',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
