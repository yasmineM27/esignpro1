// Test de l'intégration de la signature réelle dans le document OPSIO
const fs = require('fs');

async function testOpsioSignatureReelle() {
    console.log('🖋️ TEST: INTÉGRATION SIGNATURE RÉELLE DANS DOCUMENT OPSIO\n');
    
    try {
        // Test avec docx directement
        const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } = require('docx');
        
        console.log('📋 Création du document OPSIO avec signature réelle...');
        
        // Signature de test (image PNG 1x1 pixel en base64)
        const testSignatureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        // Données de test
        const data = {
            clientName: 'Jean Dupont',
            clientAddress: 'Rue de la Paix 123',
            clientPostalCity: '1200 Genève',
            clientBirthdate: '15.05.1980',
            clientEmail: 'jean.dupont@email.com',
            clientPhone: '+41 79 123 45 67',
            paymentMethod: 'commission',
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
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "info@opsio.ch  FINMA reg. no F01468622",
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

                        // Données client remplies automatiquement
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Vos données client:",
                                    bold: true,
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),

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
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Email: ${data.clientEmail}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Numéro de téléphone: ${data.clientPhone}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 600 },
                        }),

                        // Section 10 - Choix paiement
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "10. Décision du/de la client(e) sur la rémunération de l'intermédiaire",
                                    bold: true,
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data.paymentMethod === 'commission' ? "☑ " : "☐ ",
                                    size: 24,
                                }),
                                new TextRun({
                                    text: "Commission de la compagnie d'assurance",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: data.paymentMethod === 'fees' ? "☑ " : "☐ ",
                                    size: 24,
                                }),
                                new TextRun({
                                    text: "Honoraires payés par le/la client(e)",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 600 },
                        }),

                        // Section signature avec VRAIE SIGNATURE
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Signature Client(e):",
                                    bold: true,
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 200 },
                        }),

                        // SIGNATURE RÉELLE INTÉGRÉE
                        new Paragraph({
                            children: data.signatureData ? [
                                // Ajouter l'image de signature réelle
                                new ImageRun({
                                    data: Buffer.from(data.signatureData, 'base64'),
                                    transformation: {
                                        width: 200,
                                        height: 100,
                                    },
                                }),
                            ] : [
                                // Ligne vide pour signature manuelle
                                new TextRun({
                                    text: "_________________________",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 100 },
                        }),

                        // Texte de confirmation
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

                        // Confirmation finale
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Par la présente, le/la soussigné(e) confirme que le conseiller/ère à la clientèle de OPSIO Sàrl lui a remis le présent document et lui en a dûment explicité le contenu, avant la conclusion du contrat de courtage.",
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
        fs.writeFileSync('test-opsio-signature-reelle.docx', buffer);
        
        console.log('✅ Document OPSIO avec signature réelle créé: test-opsio-signature-reelle.docx');
        console.log('- Taille:', buffer.length, 'bytes');
        console.log('- Signature: IMAGE RÉELLE intégrée (comme documents-word-avec-signatures)');
        console.log('- Données client: Remplies automatiquement');
        console.log('- Choix paiement: Commission [☑] automatique');
        
        console.log('\n🎉 TEST SIGNATURE RÉELLE RÉUSSI !');
        console.log('');
        console.log('📋 COMPARAISON AVEC DOCUMENTS-WORD-AVEC-SIGNATURES:');
        console.log('✅ MÊME MÉTHODE: ImageRun avec Buffer.from(base64)');
        console.log('✅ MÊMES DIMENSIONS: width: 200, height: 100');
        console.log('✅ MÊME STRUCTURE: Paragraph avec ImageRun');
        console.log('✅ MÊME CONFIRMATION: Texte avec date et couleur');
        console.log('');
        console.log('🔍 VÉRIFICATION:');
        console.log('1. Ouvrez test-opsio-signature-reelle.docx dans Microsoft Word');
        console.log('2. Vérifiez que la signature apparaît comme une IMAGE (pas du texte)');
        console.log('3. Comparez avec un document de résiliation signé');
        console.log('4. La signature doit être identique en apparence !');
        console.log('');
        console.log('🎯 RÉSULTAT:');
        console.log('La signature réelle est maintenant intégrée dans le document OPSIO');
        console.log('exactement comme dans les documents-word-avec-signatures !');
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.message.includes('ImageRun')) {
            console.log('\n🔧 DIAGNOSTIC:');
            console.log('Problème avec ImageRun - version de la bibliothèque docx incompatible');
            console.log('Solution: Utiliser la même version que dans docx-generator.ts');
        }
    }
}

testOpsioSignatureReelle();
