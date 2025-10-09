export default function TestPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test Portal Client
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test de Fonctionnement</h2>
          <p className="text-gray-600">
            Cette page de test fonctionne correctement. 
            Le problème vient probablement du composant EnhancedClientPortal.
          </p>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ Le routage Next.js fonctionne
            </p>
            <p className="text-green-800">
              ✅ Les composants de base se chargent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
