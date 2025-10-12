# 🔐 **COMPTES D'ACCÈS - eSignPro**

## 📋 **Informations de Connexion**

### **URL de Connexion**
```
http://localhost:3000/login
```

---

## 👥 **COMPTES DISPONIBLES**

### **1. 🔴 ADMINISTRATEUR**
```
Email    : waelha@gmail.com
Password : admin123
Rôle     : admin
Accès    : /admin (Administration complète)
```

**Permissions** :
- ✅ Gestion complète du système
- ✅ Accès à tous les dossiers
- ✅ Configuration système
- ✅ Gestion des utilisateurs
- ✅ Rapports et analytics

---

### **2. 🔵 AGENT**
```
Email    : agent.test@esignpro.ch
Password : test123
Rôle     : agent
Accès    : /agent (Espace Agent)
```

**Permissions** :
- ✅ Création de nouveaux dossiers
- ✅ Gestion des clients
- ✅ Génération de documents
- ✅ Suivi des signatures
- ✅ Téléchargement des documents signés

---

### **3. 🟢 CLIENT**
```
Email    : client.test@esignpro.ch
Password : client123
Rôle     : client
Accès    : /client-dashboard (Espace Client)
```

**Permissions** :
- ✅ Consultation de ses dossiers
- ✅ Signature électronique
- ✅ Téléchargement de ses documents
- ✅ Historique des actions

---

## 🎯 **FLUX DE CONNEXION**

### **Étapes de Connexion** :
1. **Aller sur** : `http://localhost:3000/login`
2. **Saisir** : Email et mot de passe
3. **Cliquer** : "Se connecter"
4. **Redirection automatique** selon le rôle :
   - Admin → `/admin`
   - Agent → `/agent`
   - Client → `/client-dashboard`

---

## 🔒 **SÉCURITÉ**

### **Authentification** :
- ✅ **Tokens JWT** pour la session
- ✅ **Cookies sécurisés** (httpOnly)
- ✅ **Vérification middleware** sur routes protégées
- ✅ **Déconnexion automatique** si token invalide

### **Protection des Routes** :
- 🚫 **Accès direct bloqué** : `/agent`, `/admin` sans connexion
- ✅ **Redirection automatique** : Vers `/login` si non connecté
- ✅ **Vérification rôle** : Accès selon permissions

---

## 🧪 **TESTS RECOMMANDÉS**

### **Test 1 : Connexion Admin**
```bash
1. Aller sur http://localhost:3000/login
2. Email: waelha@gmail.com
3. Password: admin123
4. Vérifier redirection vers /admin
```

### **Test 2 : Connexion Agent**
```bash
1. Aller sur http://localhost:3000/login
2. Email: agent.test@esignpro.ch
3. Password: test123
4. Vérifier redirection vers /agent
5. Vérifier navbar dynamique avec nom agent
```

### **Test 3 : Connexion Client**
```bash
1. Aller sur http://localhost:3000/login
2. Email: client.test@esignpro.ch
3. Password: client123
4. Vérifier redirection vers /client-dashboard
```

### **Test 4 : Sécurité**
```bash
1. Essayer d'accéder http://localhost:3000/agent sans connexion
2. Vérifier redirection vers /login
3. Se connecter puis se déconnecter
4. Vérifier suppression session et redirection
```

---

## 📊 **BASE DE DONNÉES**

### **Tables Utilisées** :
- **`users`** : Informations utilisateur (nom, email, rôle)
- **`agents`** : Informations agent (code, département, superviseur)
- **`clients`** : Informations client (adresse, code client)

### **Jointures** :
```sql
-- Récupération info agent
SELECT a.*, u.first_name, u.last_name, u.email 
FROM agents a 
INNER JOIN users u ON a.user_id = u.id 
WHERE a.id = ?

-- Récupération info client
SELECT c.*, u.first_name, u.last_name, u.email 
FROM clients c 
INNER JOIN users u ON c.user_id = u.id 
WHERE c.id = ?
```

---

## 🎨 **INTERFACE**

### **Page de Connexion** :
- ✅ **Design professionnel** avec logo eSignPro
- ✅ **Formulaire sécurisé** avec validation
- ✅ **Gestion erreurs** avec messages clairs
- ✅ **Responsive** mobile/desktop
- 🔒 **Section démo cachée** pour production

### **Navbar Dynamique** :
- ✅ **Nom réel** récupéré depuis base de données
- ✅ **Code agent** affiché (ex: "ID: WH001")
- ✅ **Badge superviseur** si applicable
- ✅ **Menu déroulant** : Profil/Paramètres/Déconnexion
- ✅ **Initiales** dans avatar coloré

---

## 🚀 **DÉPLOIEMENT**

### **Configuration Production** :
- ✅ **Section démo cachée** dans `/login`
- ✅ **Accès sécurisé** avec middleware
- ✅ **Variables d'environnement** configurées
- ✅ **Base de données** avec comptes réels

### **Comptes Production** :
```bash
# Remplacer les comptes de test par des vrais comptes :
# - Créer admin avec email/password sécurisés
# - Créer agents avec emails @esignpro.ch
# - Configurer clients avec vraies données
```

---

## 📝 **NOTES IMPORTANTES**

### **⚠️ Sécurité** :
- 🔒 **Changer les mots de passe** en production
- 🔒 **Configurer JWT_SECRET** fort
- 🔒 **Activer HTTPS** en production
- 🔒 **Limiter tentatives connexion**

### **🎯 Fonctionnalités** :
- ✅ **Connexion multi-rôles** fonctionnelle
- ✅ **Navbar dynamique** opérationnelle
- ✅ **Sécurité renforcée** avec middleware
- ✅ **Interface professionnelle** prête

---

## 🎉 **RÉSUMÉ**

**Comptes disponibles** :
1. **Admin** : `waelha@gmail.com` / `admin123`
2. **Agent** : `agent.test@esignpro.ch` / `test123`
3. **Client** : `client.test@esignpro.ch` / `client123`

**URL** : `http://localhost:3000/login`

**Section démo** : 🔒 **CACHÉE** pour production

**Le système est prêt pour le déploiement avec une authentification sécurisée !**
