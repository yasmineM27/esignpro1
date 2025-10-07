/**
 * Script de test pour vérifier que les signatures sont bien intégrées comme images dans les documents Word
 */

const { DocxGenerator } = require('../lib/docx-generator');
const fs = require('fs');
const path = require('path');

// Données de test
const testClientData = {
  nomPrenom: 'Jean Dupont',
  nom: 'Dupont',
  prenom: 'Jean',
  dateNaissance: '01.01.1980',
  numeroPolice: '123456789',
  email: 'jean.dupont@example.com',
  telephone: '+41 79 123 45 67',
  compagnieAssurance: 'CSS Assurance',
  typeFormulaire: 'LAMal',
  dateLamal: '31.12.2024',
  dateLCA: '31.12.2024',
  adresse: 'Rue de la Paix 123',
  npa: '1000',
  ville: 'Lausanne',
  npaVille: '1000 Lausanne',
  personnes: []
};

// Signature de test (image base64 simple - un petit carré rouge)
const testSignatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testSignatureIntegration() {
  console.log('🧪 Test d\'intégration de signature comme image dans Word...');
  
  try {
    // Générer le document avec signature
    console.log('📄 Génération du document Word avec signature...');
    const wordBuffer = await DocxGenerator.generateResignationDocument(testClientData, testSignatureBase64);
    
    // Sauvegarder le fichier de test
    const testFilePath = path.join(__dirname, 'test-document-avec-signature.docx');
    fs.writeFileSync(testFilePath, wordBuffer);
    
    console.log('✅ Document généré avec succès !');
    console.log(`📁 Fichier sauvegardé : ${testFilePath}`);
    console.log('🔍 Ouvrez le fichier pour vérifier que la signature apparaît comme une image');
    
    // Vérifier la taille du fichier (avec image, il devrait être plus gros)
    const stats = fs.statSync(testFilePath);
    console.log(`📊 Taille du fichier : ${stats.size} bytes`);
    
    if (stats.size > 50000) { // Un document avec image devrait faire plus de 50KB
      console.log('✅ La taille du fichier suggère qu\'une image a été intégrée');
    } else {
      console.log('⚠️ La taille du fichier est petite, l\'image pourrait ne pas être intégrée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
}

// Exécuter le test
testSignatureIntegration();
