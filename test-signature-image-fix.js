// Test pour corriger le problème d'affichage de la signature
const fs = require('fs');

async function testSignatureImageFix() {
    console.log('🔧 TEST: CORRECTION PROBLÈME SIGNATURE IMAGE\n');

    try {
        const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } = require('docx');

        console.log('📋 Diagnostic du problème de signature...');
        console.log('❌ PROBLÈME ACTUEL: "Nous ne pouvons pas afficher l\'image"');
        console.log('❌ CAUSE PROBABLE: Format d\'image ou données base64 incorrectes');
        console.log('');

        // Créer une vraie image PNG valide en base64 (pixel rouge 2x2)
        const validImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQIHWP8//8/AzYwirkTmwNYNQAAZgABAPX8iL0AAAAASUVORK5CYII=';

        console.log('🔧 SOLUTIONS TESTÉES:');
        console.log('1. ✅ Suppression du texte de confirmation');
        console.log('2. 🔄 Test avec image PNG valide');
        console.log('3. 🔄 Vérification du format base64');
        console.log('');

        // Données de test
        const data = {
            clientName: 'Jean Dupont',
            signatureData: validImageBase64 // Image PNG valide
        };

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
                        // Titre
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "TEST CORRECTION SIGNATURE",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 600 },
                        }),

                        // Client
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Client: ${data.clientName}`,
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 400 },
                        }),

                        // Section signature
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

                        // SIGNATURE CORRIGÉE - Sans texte de confirmation
                        new Paragraph({
                            children: data.signatureData ? [
                                new ImageRun({
                                    data: Buffer.from(data.signatureData, 'base64'),
                                    transformation: {
                                        width: 200,
                                        height: 100,
                                    },
                                }),
                            ] : [
                                new TextRun({
                                    text: "………………………………………………………………………",
                                    size: 20,
                                }),
                            ],
                            spacing: { after: 100 },
                        }),

                        // PLUS DE TEXTE DE CONFIRMATION (supprimé)

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
        fs.writeFileSync('test-signature-image-fix.docx', buffer);

        console.log('✅ Document test créé: test-signature-image-fix.docx');
        console.log('- Taille:', buffer.length, 'bytes');
        console.log('- Signature: Image PNG valide');
        console.log('- Texte confirmation: SUPPRIMÉ');

        console.log('\n🎉 CORRECTIONS APPLIQUÉES !');
        console.log('');
        console.log('📋 CHANGEMENTS:');
        console.log('1. ✅ Texte de confirmation supprimé dans OPSIO');
        console.log('2. ✅ Texte de confirmation supprimé dans résiliation');
        console.log('3. ✅ Test avec image PNG valide');
        console.log('');
        console.log('🔍 VÉRIFICATION:');
        console.log('1. Ouvrez test-signature-image-fix.docx dans Microsoft Word');
        console.log('2. Vérifiez que la signature apparaît comme une IMAGE');
        console.log('3. Vérifiez qu\'il n\'y a PLUS de texte "[Signature électronique appliquée...]"');
        console.log('4. Si l\'image n\'apparaît toujours pas, le problème vient des données base64 réelles');
        console.log('');
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('1. Tester le document généré');
        console.log('2. Si l\'image fonctionne, le problème vient des vraies signatures en base64');
        console.log('3. Vérifier le format des signatures stockées en base de données');
        console.log('4. S\'assurer que les signatures sont en PNG/JPEG valide');

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSignatureImageFix();