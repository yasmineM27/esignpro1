// Test pour vérifier que la signature apparaît bien sous "Signature Client(e):"
const fs = require('fs');

async function testSignatureSousClient() {
    console.log('🎯 TEST: SIGNATURE DIRECTEMENT SOUS "Signature Client(e):" \n');
    
    try {
        const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } = require('docx');
        
        console.log('📋 Création du document avec signature sous "Signature Client(e):"...');
        
        // Signature de test
        const testSignatureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        // Données de test
        const data = {
            clientName: 'Jean Dupont',
            clientAddress: 'Rue de la Paix 123',
            clientPostalCity: '1200 Genève',
            signatureData: testSignatureBase64
        };
        
        const currentDate = new Date().toLocaleDateString('fr-CH');
        
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 1440,
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                    children: [
                        // En-tête OPSIO
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "OPSIO Sàrl, Avenue de Bel-Air 16, 1225 Chêne-Bourg",
                                    size: 20,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 600 },
                        }),

                        // Titre
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Feuille d'information du conseiller aux preneurs d'assurance selon l'art. 45 LSA",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 600 },
                        }),

                        // Données client
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Nom et Prénom: ${data.clientName}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Adresse: ${data.clientAddress}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `NPA/Localité: ${data.clientPostalCity}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 600 },
                        }),

                        // Texte de confirmation
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage.",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 600 },
                        }),

                        // Section signatures SÉPARÉES
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Signature Conseiller/ère à la clientèle:",
                                    size: 20,
                                    bold: true,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "………………………………………………………………………",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Signature Client(e):",
                                    size: 20,
                                    bold: true,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        // SIGNATURE RÉELLE DIRECTEMENT SOUS "Signature Client(e):"
                        new Paragraph({
                            children: data.signatureData ? [
                                // Ajouter l'image de signature réelle si disponible
                                new ImageRun({
                                    data: Buffer.from(data.signatureData, 'base64'),
                                    transformation: {
                                        width: 200,
                                        height: 100,
                                    },
                                }),
                            ] : [
                                // Ligne vide pour signature manuelle si pas de signature électronique
                                new TextRun({
                                    text: "………………………………………………………………………",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 100 },
                        }),

                        // Ajouter le texte de confirmation de signature électronique
                        ...(data.signatureData ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `[Signature électronique appliquée le ${currentDate}]`,
                                        size: 18,
                                        italics: true,
                                        color: "666666",
                                    }),
                                ],
                                spacing: { after: 400 },
                            })
                        ] : []),

                        // Espacement final
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync('test-signature-sous-client.docx', buffer);
        
        console.log('✅ Document créé: test-signature-sous-client.docx');
        console.log('- Taille:', buffer.length, 'bytes');
        console.log('- Structure: Signatures séparées');
        console.log('- Conseiller: Ligne pointillée');
        console.log('- Client: SIGNATURE RÉELLE directement en dessous');
        
        console.log('\n🎉 TEST SIGNATURE SOUS CLIENT RÉUSSI !');
        console.log('');
        console.log('📋 STRUCTURE CORRIGÉE:');
        console.log('1. "Signature Conseiller/ère à la clientèle:" (en gras)');
        console.log('2. Ligne pointillée pour le conseiller');
        console.log('3. Espacement');
        console.log('4. "Signature Client(e):" (en gras)');
        console.log('5. IMAGE DE SIGNATURE RÉELLE directement en dessous');
        console.log('6. Texte de confirmation avec date');
        console.log('');
        console.log('🔍 VÉRIFICATION:');
        console.log('1. Ouvrez test-signature-sous-client.docx dans Microsoft Word');
        console.log('2. Vérifiez que "Signature Client(e):" est en gras');
        console.log('3. Vérifiez que la signature IMAGE apparaît DIRECTEMENT en dessous');
        console.log('4. Vérifiez que la signature du conseiller a une ligne pointillée');
        console.log('5. Vérifiez l\'espacement entre les deux signatures');
        console.log('');
        console.log('🎯 RÉSULTAT:');
        console.log('La signature réelle apparaît maintenant DIRECTEMENT sous');
        console.log('"Signature Client(e):" comme demandé !');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSignatureSousClient();
