'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface DocumentData {
  id: string;
  documenttype: string;
  filename: string;
  status: string;
  uploaddate: string;
}

interface ClientPortalUploadProps {
  token: string;
  initialDocuments: DocumentData[];
}

const DOCUMENT_TYPES = [
  { type: 'identity_front', label: '🆔 CIN Recto', required: true },
  { type: 'identity_back', label: '🆔 CIN Verso', required: true },
  { type: 'insurance_contract', label: '📄 Contrat Assurance', required: false }, // ✅ NON REQUIS
  { type: 'proof_address', label: '🏠 Justificatif Domicile', required: false },
  { type: 'bank_statement', label: '🏦 Relevé Bancaire', required: false },
  { type: 'additional', label: '📎 Documents Additionnels', required: false }
];

export default function ClientPortalUpload({ token, initialDocuments }: ClientPortalUploadProps) {
  const [documents, setDocuments] = useState<DocumentData[]>(initialDocuments);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile pour éviter les erreurs SSR
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fonction pour uploader un fichier
  const uploadFile = useCallback(async (file: File, documentType: string) => {
    if (!file) return;

    // Validation du fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('❌ Fichier trop volumineux (max 10MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Type de fichier non autorisé (JPG, PNG, PDF uniquement)');
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('token', token);

      const response = await fetch('/api/client-portal/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Mettre à jour la liste des documents
        setDocuments(prev => {
          const filtered = prev.filter(doc => doc.documenttype !== documentType);
          return [...filtered, result.document];
        });
        
        alert('✅ Document uploadé avec succès !');
      } else {
        alert('❌ Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'upload');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    }
  }, [token]);

  // Gestionnaire de drop
  const handleDrop = useCallback((e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0], documentType);
    }
  }, [uploadFile]);

  // Gestionnaire de sélection de fichier
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0], documentType);
    }
  }, [uploadFile]);

  // Vérifier si tous les documents requis sont uploadés
  const requiredDocuments = DOCUMENT_TYPES.filter(type => type.required);
  const uploadedRequiredDocs = requiredDocuments.filter(type => 
    documents.some(doc => doc.documenttype === type.type)
  );
  const allRequiredUploaded = uploadedRequiredDocs.length === requiredDocuments.length;

  // Fonction pour finaliser le dossier
  const finalizeDossier = async () => {
    if (!allRequiredUploaded) {
      alert('❌ Veuillez uploader tous les documents requis avant de finaliser');
      return;
    }

    try {
      const response = await fetch('/api/client-portal/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ ' + result.message);
        // Rediriger vers la section signature dans EnhancedClientPortal
        // La signature sera gérée par le composant parent
        window.location.reload();
      } else {
        alert('❌ Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur finalisation:', error);
      alert('❌ Erreur lors de la finalisation');
    }
  };

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: isMobile ? '15px' : '20px'
    }}>
      {/* En-tête */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: isMobile ? '20px' : '30px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{
          color: '#1f2937', 
          marginBottom: '10px',
          fontSize: isMobile ? '20px' : '24px'
        }}>
          📄 Upload de Documents
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: isMobile ? '14px' : '16px',
          margin: '0'
        }}>
          Uploadez vos documents pour finaliser votre dossier
        </p>
      </div>

      {/* Liste des types de documents */}
      <div style={{ 
        display: 'grid', 
        gap: '20px',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))'
      }}>
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = documents.find(doc => doc.documenttype === docType.type);
          const isUploading = uploading[docType.type];
          const progress = uploadProgress[docType.type] || 0;

          return (
            <div
              key={docType.type}
              style={{
                border: dragOver === docType.type ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: dragOver === docType.type ? '#eff6ff' : '#ffffff',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(docType.type);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, docType.type)}
            >
              {/* En-tête du document */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}>
                <h3 style={{
                  margin: '0',
                  fontSize: isMobile ? '16px' : '18px',
                  color: '#1f2937',
                  fontWeight: '600'
                }}>
                  {docType.label}
                </h3>
                {docType.required && (
                  <span style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Requis
                  </span>
                )}
              </div>

              {/* État du document */}
              {existingDoc ? (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#166534', marginBottom: '8px' }}>
                    ✅ <strong>{existingDoc.filename}</strong>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#16a34a',
                    marginBottom: '10px'
                  }}>
                    Uploadé le {new Date(existingDoc.uploaddate).toLocaleDateString('fr-FR')}
                  </div>
                  <label style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    🔄 Remplacer
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e, docType.type)}
                    />
                  </label>
                </div>
              ) : isUploading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 15px'
                  }}></div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    Upload en cours... {progress}%
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '15px'
                  }}>
                    📁
                  </div>
                  <p style={{
                    margin: '0 0 15px 0',
                    color: '#6b7280',
                    fontSize: isMobile ? '14px' : '16px'
                  }}>
                    Glissez votre fichier ici ou cliquez pour sélectionner
                  </p>
                  <label style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    📎 Choisir un fichier
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e, docType.type)}
                    />
                  </label>
                  <p style={{
                    margin: '10px 0 0 0',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    JPG, PNG, PDF (max 10MB)
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bouton de finalisation */}
      {allRequiredUploaded && (
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '30px',
          backgroundColor: '#f0fdf4',
          borderRadius: '12px',
          border: '2px solid #10b981'
        }}>
          <h3 style={{
            color: '#166534',
            marginBottom: '15px',
            fontSize: isMobile ? '18px' : '20px'
          }}>
            🎉 Tous les documents requis sont uploadés !
          </h3>
          <p style={{
            color: '#166534',
            marginBottom: '20px',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            Vous pouvez maintenant finaliser votre dossier.
          </p>
          <button
            onClick={finalizeDossier}
            style={{
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minHeight: '50px'
            }}
          >
            ✅ Finaliser le dossier
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
