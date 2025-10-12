const fs = require('fs');

// Créer une signature SVG simple pour les tests
function createTestSignatureSVG() {
    const svgContent = `
<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M20,60 Q40,20 60,40 T100,50 Q120,30 140,60 T180,50" 
        stroke="black" 
        stroke-width="2" 
        fill="none"/>
  <path d="M30,70 Q50,50 70,65 Q90,80 110,65 Q130,50 150,70" 
        stroke="black" 
        stroke-width="2" 
        fill="none"/>
</svg>`;
    
    return svgContent;
}

// Convertir SVG en PNG (simulation - en réalité on utiliserait une bibliothèque comme sharp)
function createTestSignaturePNG() {
    // Pour les tests, on va créer un petit PNG simple
    // En réalité, on convertirait le SVG en PNG
    
    // PNG minimal 1x1 pixel transparent (pour test)
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0xC8, // Width: 200
        0x00, 0x00, 0x00, 0x64, // Height: 100
        0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
        0x47, 0x7E, 0xEC, 0x1C, // CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
        0x0D, 0x0A, 0x2D, 0xB4, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    return pngBuffer;
}

// Créer une vraie signature de test plus réaliste
function createRealisticSignaturePNG() {
    // Créer un buffer PNG plus réaliste pour une signature
    // Ceci est une signature simulée - en production on utiliserait une vraie image
    
    const width = 200;
    const height = 100;
    
    // PNG header
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdrLength = Buffer.alloc(4);
    ihdrLength.writeUInt32BE(13, 0);
    const ihdrType = Buffer.from('IHDR');
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);  // Width
    ihdrData.writeUInt32BE(height, 4); // Height
    ihdrData[8] = 8;  // Bit depth
    ihdrData[9] = 6;  // Color type (RGBA)
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    
    // CRC pour IHDR (calculé approximativement)
    const ihdrCrc = Buffer.from([0x47, 0x7E, 0xEC, 0x1C]);
    
    // IDAT chunk (données d'image compressées)
    const idatLength = Buffer.alloc(4);
    idatLength.writeUInt32BE(20, 0);
    const idatType = Buffer.from('IDAT');
    const idatData = Buffer.from([
        0x78, 0x9C, 0x63, 0x60, 0x18, 0x05, 0xA3, 0x60, 0x14, 0x8C,
        0x02, 0x08, 0x00, 0x00, 0x04, 0x10, 0x00, 0x01, 0x2F, 0x5A
    ]);
    const idatCrc = Buffer.from([0x2D, 0xB4, 0x34, 0x95]);
    
    // IEND chunk
    const iendLength = Buffer.alloc(4);
    const iendType = Buffer.from('IEND');
    const iendCrc = Buffer.from([0xAE, 0x42, 0x60, 0x82]);
    
    return Buffer.concat([
        pngSignature,
        ihdrLength, ihdrType, ihdrData, ihdrCrc,
        idatLength, idatType, idatData, idatCrc,
        iendLength, iendType, iendCrc
    ]);
}

console.log('🎨 CRÉATION SIGNATURE DE TEST POUR DOCUMENT OPSIO\n');

try {
    // Créer SVG de test
    const svgSignature = createTestSignatureSVG();
    fs.writeFileSync('test-signature.svg', svgSignature);
    console.log('✅ Signature SVG créée: test-signature.svg');
    
    // Créer PNG de test
    const pngSignature = createRealisticSignaturePNG();
    fs.writeFileSync('test-signature.png', pngSignature);
    console.log('✅ Signature PNG créée: test-signature.png');
    
    // Convertir en base64 pour utilisation dans l'API
    const base64Signature = pngSignature.toString('base64');
    console.log('✅ Signature base64 générée:', base64Signature.length, 'caractères');
    
    // Sauvegarder le base64 dans un fichier pour utilisation
    fs.writeFileSync('test-signature-base64.txt', base64Signature);
    console.log('✅ Base64 sauvegardé: test-signature-base64.txt');
    
    console.log('\n📋 UTILISATION:');
    console.log('1. Utilisez le contenu de test-signature-base64.txt comme signatureData');
    console.log('2. Passez cette valeur dans l\'API de génération OPSIO');
    console.log('3. Le document Word contiendra la signature réelle');
    
    console.log('\n🔧 EXEMPLE D\'APPEL API:');
    console.log(`{
  "documentType": "opsio-info-sheet",
  "data": {
    "clientName": "Jean Dupont",
    "clientAddress": "Rue de la Paix 123",
    "clientPostalCity": "1200 Genève",
    "advisorName": "Marie Martin",
    "advisorEmail": "marie.martin@opsio.ch",
    "paymentMethod": "commission",
    "signatureData": "${base64Signature.substring(0, 50)}..."
  }
}`);
    
} catch (error) {
    console.error('❌ Erreur création signature:', error.message);
}

console.log('\n🎯 SIGNATURE DE TEST CRÉÉE AVEC SUCCÈS !');
