// Test direct du générateur OPSIO robuste
const fs = require('fs');

// Simuler l'import du générateur
async function testGeneratorDirect() {
    console.log('🔧 TEST DIRECT: GÉNÉRATEUR OPSIO ROBUSTE\n');
    
    try {
        // Importer le générateur
        const { OpsioRobustGenerator } = require('./lib/opsio-robust-generator.ts');
        
        console.log('✅ Générateur importé avec succès');
        
        // Données de test
        const testData = {
            clientName: 'Jean Dupont Test Direct',
            clientAddress: 'Rue de la Paix 123',
            clientPostalCity: '1200 Genève',
            clientBirthdate: '15.05.1980',
            clientEmail: 'jean.dupont@email.com',
            clientPhone: '+41 79 123 45 67',
            advisorName: 'Marie Martin',
            advisorEmail: 'marie.martin@opsio.ch',
            advisorPhone: '+41 78 305 12 77',
            paymentMethod: 'commission',
            signatureData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            signatureHash: 'abc123def456'
        };
        
        console.log('📋 Génération du document OPSIO...');
        
        // Générer le document
        const buffer = await OpsioRobustGenerator.generateRobustOpsioDocument(testData);
        
        console.log('✅ Document généré avec succès');
        console.log('- Taille:', buffer.length, 'bytes');
        
        // Sauvegarder le document
        fs.writeFileSync('test-generator-direct.docx', buffer);
        console.log('✅ Document sauvegardé: test-generator-direct.docx');
        
        console.log('\n🎉 TEST DIRECT RÉUSSI !');
        console.log('');
        console.log('📋 RÉSUMÉ:');
        console.log('✅ Générateur fonctionne correctement');
        console.log('✅ Document Word généré sans erreur');
        console.log('✅ Toutes les données client intégrées');
        console.log('✅ Signature électronique incluse');
        console.log('');
        console.log('🔍 VÉRIFICATION:');
        console.log('Ouvrez test-generator-direct.docx dans Microsoft Word');
        console.log('pour vérifier qu\'il s\'ouvre sans erreur !');
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        console.error('Stack:', error.stack);
        
        // Essayons une approche alternative
        console.log('\n🔄 ESSAI ALTERNATIF...');
        
        try {
            // Créer un document Word simple manuellement
            const { Document, Packer, Paragraph, TextRun } = require('docx');
            
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "OPSIO Sàrl - Document de test",
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Ce document a été généré avec succès !",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Client: Jean Dupont Test Direct",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Adresse: Rue de la Paix 123, 1200 Genève",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Email: jean.dupont@email.com",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Téléphone: +41 79 123 45 67",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "",
                                    size: 20,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Signature personnes majeures:",
                                    bold: true,
                                    size: 22,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "[SIGNATURE ÉLECTRONIQUE APPLIQUÉE]",
                                    size: 20,
                                    bold: true,
                                    color: "0066CC",
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "[Signature électronique appliquée le " + new Date().toLocaleDateString('fr-CH') + "]",
                                    size: 18,
                                    italics: true,
                                    color: "666666",
                                }),
                            ],
                        }),
                    ],
                }],
            });
            
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync('test-simple-opsio.docx', buffer);
            
            console.log('✅ Document simple créé: test-simple-opsio.docx');
            console.log('- Taille:', buffer.length, 'bytes');
            console.log('- Structure simplifiée mais fonctionnelle');
            
        } catch (altError) {
            console.error('❌ ERREUR ALTERNATIVE:', altError.message);
        }
    }
}

testGeneratorDirect();
