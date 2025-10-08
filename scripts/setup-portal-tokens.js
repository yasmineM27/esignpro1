/**
 * Script pour configurer les portal tokens permanents
 * Exécuter avec: node scripts/setup-portal-tokens.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPortalTokens() {
  console.log('🚀 Configuration des portal tokens permanents...');

  try {
    // 1. Vérifier si la colonne portal_token existe
    console.log('1️⃣ Vérification de la structure de la table...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'clients' });

    if (columnsError) {
      console.log('⚠️ Impossible de vérifier les colonnes, on continue...');
    }

    // 2. Récupérer tous les clients sans portal_token
    console.log('2️⃣ Récupération des clients sans portal token...');
    
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, client_code, portal_token')
      .is('portal_token', null);

    if (fetchError) {
      console.error('❌ Erreur récupération clients:', fetchError);
      return;
    }

    console.log(`📊 ${clients?.length || 0} client(s) sans portal token trouvé(s)`);

    if (!clients || clients.length === 0) {
      console.log('✅ Tous les clients ont déjà un portal token !');
      
      // Afficher quelques exemples
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id, client_code, portal_token')
        .not('portal_token', 'is', null)
        .limit(5);

      console.log('📋 Exemples de portal tokens existants:');
      existingClients?.forEach(client => {
        console.log(`  - ${client.client_code}: ${client.portal_token}`);
      });
      
      return;
    }

    // 3. Générer des portal tokens pour chaque client
    console.log('3️⃣ Génération des portal tokens...');
    
    const updates = [];
    for (const client of clients) {
      const portalToken = `PORTAL_${client.client_code}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      updates.push({
        id: client.id,
        portal_token: portalToken
      });
      
      console.log(`  📝 ${client.client_code} → ${portalToken}`);
    }

    // 4. Mettre à jour tous les clients en une seule fois
    console.log('4️⃣ Mise à jour des clients...');
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ portal_token: update.portal_token })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Erreur mise à jour client ${update.id}:`, updateError);
      }
    }

    // 5. Vérifier les résultats
    console.log('5️⃣ Vérification des résultats...');
    
    const { data: updatedClients, error: verifyError } = await supabase
      .from('clients')
      .select('id, client_code, portal_token')
      .not('portal_token', 'is', null);

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
      return;
    }

    console.log(`✅ ${updatedClients?.length || 0} client(s) ont maintenant un portal token !`);
    
    // Afficher quelques exemples
    console.log('📋 Exemples de nouveaux portal tokens:');
    updatedClients?.slice(0, 5).forEach(client => {
      const portalUrl = `/client-portal/${client.portal_token}`;
      console.log(`  - ${client.client_code}: ${portalUrl}`);
    });

    console.log('🎉 Configuration terminée avec succès !');
    console.log('');
    console.log('📝 Prochaines étapes:');
    console.log('  1. Les clients auront maintenant des portals permanents');
    console.log('  2. Les URLs ne changeront plus à chaque nouveau dossier');
    console.log('  3. Les signatures seront visibles dans "Mes Clients"');

  } catch (error) {
    console.error('💥 Erreur lors de la configuration:', error);
  }
}

// Fonction pour tester un portal token
async function testPortalToken(portalToken) {
  console.log(`🧪 Test du portal token: ${portalToken}`);
  
  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      id,
      client_code,
      portal_token,
      users!inner(
        first_name,
        last_name,
        email
      )
    `)
    .eq('portal_token', portalToken)
    .single();

  if (error || !client) {
    console.log('❌ Portal token invalide');
    return false;
  }

  console.log('✅ Portal token valide pour:', {
    clientCode: client.client_code,
    clientName: `${client.users.first_name} ${client.users.last_name}`,
    email: client.users.email
  });
  
  return true;
}

// Exécuter le script
if (require.main === module) {
  setupPortalTokens().then(() => {
    console.log('🏁 Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { setupPortalTokens, testPortalToken };
