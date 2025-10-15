#!/usr/bin/env node

/**
 * Script de diagnostic pour le déploiement Informaniak
 * Vérifie tous les aspects critiques de l'application
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC INFOMANIAK - eSignPro');
console.log('=====================================\n');

// Configuration
const APP_URL = 'https://esignpro.ch';
const HEALTH_ENDPOINT = `${APP_URL}/api/health`;

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Vérification des fichiers locaux
function checkLocalFiles() {
  log('📁 VÉRIFICATION DES FICHIERS LOCAUX', 'blue');
  
  const requiredFiles = [
    '.env.production',
    'package.json',
    'next.config.js',
    'start.js',
    'infomaniak.config.json'
  ];

  const requiredDirs = [
    'app',
    'components',
    'lib'
  ];

  let allFilesOk = true;

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} - MANQUANT`, 'red');
      allFilesOk = false;
    }
  });

  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`✅ ${dir}/`, 'green');
    } else {
      log(`❌ ${dir}/ - MANQUANT`, 'red');
      allFilesOk = false;
    }
  });

  return allFilesOk;
}

// 2. Vérification de la configuration
function checkConfiguration() {
  log('\n⚙️ VÉRIFICATION DE LA CONFIGURATION', 'blue');
  
  let configOk = true;

  // Vérifier .env.production
  if (fs.existsSync('.env.production')) {
    const envContent = fs.readFileSync('.env.production', 'utf8');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(`${envVar}=`)) {
        log(`✅ ${envVar}`, 'green');
      } else {
        log(`❌ ${envVar} - MANQUANT`, 'red');
        configOk = false;
      }
    });

    // Vérifier les URLs
    if (envContent.includes('NEXT_PUBLIC_APP_URL=https://esignpro.ch')) {
      log('✅ URL de production correcte', 'green');
    } else {
      log('❌ URL de production incorrecte', 'red');
      configOk = false;
    }
  }

  // Vérifier package.json
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      log('✅ Script de build présent', 'green');
    } else {
      log('❌ Script de build manquant', 'red');
      configOk = false;
    }

    if (packageJson.scripts && packageJson.scripts.start) {
      log('✅ Script de start présent', 'green');
    } else {
      log('❌ Script de start manquant', 'red');
      configOk = false;
    }
  }

  return configOk;
}

// 3. Test de connectivité réseau
function testNetworkConnectivity() {
  return new Promise((resolve) => {
    log('\n🌐 TEST DE CONNECTIVITÉ RÉSEAU', 'blue');
    
    const options = {
      hostname: 'esignpro.ch',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      log(`✅ Connexion HTTPS établie - Status: ${res.statusCode}`, 'green');
      
      if (res.statusCode === 200) {
        log('✅ Site accessible', 'green');
        resolve(true);
      } else if (res.statusCode >= 500) {
        log('❌ Erreur serveur (5xx)', 'red');
        resolve(false);
      } else if (res.statusCode >= 400) {
        log('⚠️ Erreur client (4xx)', 'yellow');
        resolve(false);
      } else {
        log(`⚠️ Status inattendu: ${res.statusCode}`, 'yellow');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      log(`❌ Erreur de connexion: ${error.message}`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log('❌ Timeout de connexion', 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 4. Test du health check
function testHealthCheck() {
  return new Promise((resolve) => {
    log('\n🏥 TEST DU HEALTH CHECK', 'blue');
    
    const options = {
      hostname: 'esignpro.ch',
      port: 443,
      path: '/api/health',
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'eSignPro-Diagnostic/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const healthData = JSON.parse(data);
            log('✅ Health check accessible', 'green');
            log(`📊 Status: ${healthData.status}`, healthData.status === 'healthy' ? 'green' : 'yellow');
            log(`⏱️ Temps de réponse: ${healthData.responseTime || 'N/A'}`);
            
            if (healthData.checks) {
              Object.entries(healthData.checks).forEach(([check, status]) => {
                const color = status === 'ok' ? 'green' : 'red';
                log(`   ${check}: ${status}`, color);
              });
            }
            
            resolve(healthData.status === 'healthy');
          } else {
            log(`❌ Health check échoué - Status: ${res.statusCode}`, 'red');
            log(`Response: ${data.substring(0, 200)}...`);
            resolve(false);
          }
        } catch (error) {
          log(`❌ Erreur parsing health check: ${error.message}`, 'red');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Erreur health check: ${error.message}`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log('❌ Timeout health check', 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 5. Recommandations
function generateRecommendations(results) {
  log('\n💡 RECOMMANDATIONS', 'blue');
  
  if (!results.files) {
    log('🔧 Fichiers manquants - Vérifiez que tous les fichiers sont uploadés', 'yellow');
  }
  
  if (!results.config) {
    log('🔧 Configuration incorrecte - Vérifiez les variables d\'environnement', 'yellow');
  }
  
  if (!results.network) {
    log('🔧 Problème réseau - Vérifiez la configuration DNS et SSL', 'yellow');
    log('   - Vérifiez que le domaine pointe vers Informaniak', 'yellow');
    log('   - Vérifiez le certificat SSL', 'yellow');
  }
  
  if (!results.health) {
    log('🔧 Health check échoué - Problèmes possibles:', 'yellow');
    log('   - Application non démarrée', 'yellow');
    log('   - Port incorrect (doit être 3000)', 'yellow');
    log('   - Variables d\'environnement manquantes', 'yellow');
    log('   - Erreur de build', 'yellow');
  }

  if (results.files && results.config && results.network && results.health) {
    log('🎉 Tout semble fonctionner correctement !', 'green');
  } else {
    log('\n🚨 ACTIONS URGENTES:', 'red');
    log('1. Vérifiez les logs Informaniak', 'yellow');
    log('2. Redémarrez l\'application', 'yellow');
    log('3. Vérifiez les variables d\'environnement', 'yellow');
    log('4. Contactez le support si le problème persiste', 'yellow');
  }
}

// Fonction principale
async function runDiagnostic() {
  const results = {
    files: false,
    config: false,
    network: false,
    health: false
  };

  try {
    results.files = checkLocalFiles();
    results.config = checkConfiguration();
    results.network = await testNetworkConnectivity();
    results.health = await testHealthCheck();

    log('\n📋 RÉSUMÉ DU DIAGNOSTIC', 'blue');
    log(`Fichiers locaux: ${results.files ? '✅' : '❌'}`, results.files ? 'green' : 'red');
    log(`Configuration: ${results.config ? '✅' : '❌'}`, results.config ? 'green' : 'red');
    log(`Connectivité: ${results.network ? '✅' : '❌'}`, results.network ? 'green' : 'red');
    log(`Health check: ${results.health ? '✅' : '❌'}`, results.health ? 'green' : 'red');

    generateRecommendations(results);

  } catch (error) {
    log(`💥 Erreur lors du diagnostic: ${error.message}`, 'red');
  }
}

// Lancer le diagnostic
runDiagnostic();
