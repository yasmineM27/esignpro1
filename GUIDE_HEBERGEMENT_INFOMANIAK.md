# 🚀 GUIDE HÉBERGEMENT INFOMANIAK - eSignPro

## ✅ ÉTAPE 1: VÉRIFICATION DES PRÉREQUIS

### 1.1 Fichiers de Configuration

- ✅ `.env.production` - Configuré avec les bonnes URLs
- ✅ `infomaniak.config.json` - Configuration Informaniak
- ✅ `start.js` - Script de démarrage optimisé
- ✅ `next.config.js` - Configuration Next.js

### 1.2 Variables d'Environnement Critiques

```bash
NEXT_PUBLIC_APP_URL=https://esignpro.ch
NODE_ENV=production
PORT=3000
```

## 🔧 ÉTAPE 2: PRÉPARATION DU DÉPLOIEMENT

### 2.1 Test Local de Production

```bash
# 1. Construire l'application
npm run build

# 2. Tester en mode production
npm run start:prod
```

### 2.2 Vérification des APIs

- Testez `/api/health` pour le health check
- Vérifiez que Supabase est accessible
- Confirmez que les emails fonctionnent

## 📦 ÉTAPE 3: CONFIGURATION INFORMANIAK

### 3.1 Type de Déploiement

**RECOMMANDÉ: Node.js Application**

- Plus stable pour les APIs
- Meilleur pour les fonctionnalités dynamiques
- Support complet de Next.js

### 3.2 Configuration dans le Panel Informaniak

```json
{
  "runtime": "nodejs",
  "version": "18",
  "buildCommand": "npm ci && npm run build",
  "startCommand": "node start.js",
  "port": 3000,
  "healthCheck": "/api/health"
}
```

## 🌐 ÉTAPE 4: DÉPLOIEMENT

### 4.1 Upload des Fichiers

**IMPORTANT**: Uploadez TOUS les fichiers sauf:

- `node_modules/` (sera installé automatiquement)
- `.next/` (sera généré au build)
- `out/` (export statique)

### 4.2 Variables d'Environnement

Dans le panel Informaniak, ajoutez:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://esignpro.ch
NEXT_PUBLIC_SUPABASE_URL=https://vtbojyaszfsnepgyeoke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_Tx7YrXqY_3qJRkmWvFDi2B8zZpgrwMiCb
NEXTAUTH_SECRET=esignpro_production_secret_key_2024_infomaniak
NEXTAUTH_URL=https://esignpro.ch
PORT=3000
```

## 🔍 ÉTAPE 5: DIAGNOSTIC DES PROBLÈMES

### 5.1 Site Inaccessible - Causes Communes

1. **Port incorrect** - Vérifiez que PORT=3000
2. **Build échoué** - Vérifiez les logs de construction
3. **Variables manquantes** - Vérifiez toutes les variables d'env
4. **Health check échoué** - Testez `/api/health`

### 5.2 Commandes de Debug

```bash
# Vérifier les logs
tail -f /var/log/nodejs/app.log

# Tester le health check
curl https://esignpro.ch/api/health

# Vérifier le processus
ps aux | grep node
```

## 🛠️ ÉTAPE 6: SOLUTIONS AUX PROBLÈMES COURANTS

### 6.1 Erreur "Site Inaccessible"

**Solution 1: Vérifier le Port**

- Assurez-vous que l'app écoute sur le bon port
- Variable PORT doit être définie

**Solution 2: Health Check**

- Créez `/api/health` si manquant
- Vérifiez qu'il retourne status 200

**Solution 3: Logs d'Erreur**

- Consultez les logs Informaniak
- Vérifiez les erreurs de build

### 6.2 Erreur de Build

**Solution: Build Local**

```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
```

## 📋 ÉTAPE 7: CHECKLIST FINALE

### Avant Déploiement

- [ ] Build local réussi
- [ ] Variables d'environnement configurées
- [ ] Supabase accessible
- [ ] APIs testées localement
- [ ] Health check fonctionnel

### Après Déploiement

- [ ] Site accessible sur https://esignpro.ch
- [ ] Health check répond
- [ ] Login agent fonctionne
- [ ] Login admin fonctionne
- [ ] Génération de documents OK
- [ ] Signatures fonctionnelles

## 🚨 DÉPANNAGE URGENT

### Si le Site ne Répond Pas

1. **Vérifiez les logs Informaniak**
2. **Testez le health check**: `curl https://esignpro.ch/api/health`
3. **Vérifiez les variables d'environnement**
4. **Redémarrez l'application**

### Contacts d'Urgence

- Support Informaniak: support technique
- Logs d'application: Panel Informaniak > Logs
- Monitoring: Panel Informaniak > Statistiques

## 🎯 SOLUTION IMMÉDIATE - Votre Problème Actuel

### Diagnostic Effectué

✅ Fichiers locaux: OK
✅ Configuration: OK
❌ **Domaine inaccessible: esignpro.ch**

### Causes Possibles

1. **DNS non configuré** - Le domaine ne pointe pas vers Informaniak
2. **Application non déployée** - Les fichiers ne sont pas sur le serveur
3. **Application plantée** - L'app démarre mais crash immédiatement
4. **Port incorrect** - L'app n'écoute pas sur le bon port

### ÉTAPES IMMÉDIATES À SUIVRE

#### 1. Vérifiez le Panel Informaniak

```
1. Connectez-vous au panel Informaniak
2. Allez dans "Hébergement Web" > "Votre site"
3. Vérifiez l'état de l'application:
   - Status: En cours / Arrêtée / Erreur
   - Logs: Consultez les derniers logs
```

#### 2. Vérifiez la Configuration DNS

```
1. Panel Informaniak > Domaines > esignpro.ch
2. Vérifiez que les DNS pointent vers Informaniak
3. Vérifiez le certificat SSL
```

#### 3. Vérifiez le Déploiement

```
1. Panel > Hébergement > Fichiers
2. Vérifiez que TOUS les fichiers sont présents:
   - package.json ✓
   - start.js ✓
   - app/ ✓
   - components/ ✓
   - .env.production ✓
```

#### 4. Redémarrez l'Application

```
1. Panel > Hébergement > Applications Node.js
2. Cliquez "Redémarrer"
3. Attendez 2-3 minutes
4. Testez: https://esignpro.ch
```

### COMMANDES DE TEST

#### Test DNS Local

```bash
nslookup esignpro.ch
ping esignpro.ch
```

#### Test Health Check (après déploiement)

```bash
curl -I https://esignpro.ch/api/health
```

### SI LE PROBLÈME PERSISTE

#### Option 1: Déploiement Manuel

1. Téléchargez tous les fichiers via FTP/SFTP
2. Installez les dépendances: `npm ci`
3. Buildez: `npm run build`
4. Démarrez: `node start.js`

#### Option 2: Mode Debug

1. Activez les logs détaillés
2. Vérifiez les variables d'environnement
3. Testez en mode développement d'abord

#### Option 3: Support Informaniak

Si rien ne fonctionne, contactez le support avec:

- Logs d'erreur
- Configuration actuelle
- Étapes déjà tentées
