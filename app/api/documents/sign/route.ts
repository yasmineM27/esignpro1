import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SignatureData {
  documentId: string;
  signerName: string;
  signerRole: 'client' | 'advisor';
  signatureType: 'electronic' | 'digital';
  ipAddress?: string;
  userAgent?: string;
}

function generateSignatureHash(data: SignatureData): string {
  const timestamp = new Date().toISOString();
  const signatureString = `${data.documentId}-${data.signerName}-${data.signerRole}-${timestamp}`;
  
  // Simple hash generation (in production, use a proper cryptographic hash)
  let hash = 0;
  for (let i = 0; i < signatureString.length; i++) {
    const char = signatureString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).toUpperCase();
}

function addSignatureToDocument(documentContent: string, signatureData: SignatureData): string {
  const timestamp = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const signatureHash = generateSignatureHash(signatureData);
  
  // Create signature block
  const signatureBlock = `
    <div style="border: 2px solid #28a745; padding: 15px; margin: 20px 0; background-color: #f8fff9;">
      <h4 style="color: #28a745; margin: 0 0 10px 0;">✅ Document Signé Électroniquement</h4>
      <p style="margin: 5px 0;"><strong>Signataire:</strong> ${signatureData.signerName}</p>
      <p style="margin: 5px 0;"><strong>Rôle:</strong> ${signatureData.signerRole === 'client' ? 'Client' : 'Conseiller'}</p>
      <p style="margin: 5px 0;"><strong>Date et heure:</strong> ${timestamp}</p>
      <p style="margin: 5px 0;"><strong>Type de signature:</strong> ${signatureData.signatureType === 'electronic' ? 'Électronique' : 'Numérique'}</p>
      <p style="margin: 5px 0;"><strong>Hash de vérification:</strong> <code>${signatureHash}</code></p>
      ${signatureData.ipAddress ? `<p style="margin: 5px 0;"><strong>Adresse IP:</strong> ${signatureData.ipAddress}</p>` : ''}
    </div>
  `;

  // Find the appropriate signature line and replace it
  let modifiedContent = documentContent;
  
  if (signatureData.signerRole === 'client') {
    // Replace client signature line
    modifiedContent = modifiedContent.replace(
      /<div class="signature-line" id="client-signature"><\/div>/,
      `<div class="signature-line" id="client-signature" style="background-color: #e8f5e8; border: 2px solid #28a745; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #28a745;">SIGNÉ ÉLECTRONIQUEMENT - ${signatureData.signerName}</div>`
    );
  } else {
    // Replace advisor signature line
    modifiedContent = modifiedContent.replace(
      /<div class="signature-line" id="advisor-signature"><\/div>/,
      `<div class="signature-line" id="advisor-signature" style="background-color: #e8f5e8; border: 2px solid #28a745; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #28a745;">SIGNÉ ÉLECTRONIQUEMENT - ${signatureData.signerName}</div>`
    );
  }

  // Add signature block before closing body tag
  modifiedContent = modifiedContent.replace(
    '</body>',
    `${signatureBlock}</body>`
  );

  return modifiedContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, signerName, signerRole, signatureType = 'electronic' } = body;

    console.log('✍️ Signature document:', { documentId, signerName, signerRole });

    // Validate required fields
    if (!documentId || !signerName || !signerRole) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants: documentId, signerName, signerRole requis'
      }, { status: 400 });
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Retrieve document
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('client_documents_archive')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      console.error('❌ Document non trouvé:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Document non trouvé'
      }, { status: 404 });
    }

    // Create signature data
    const signatureData: SignatureData = {
      documentId,
      signerName,
      signerRole: signerRole as 'client' | 'advisor',
      signatureType: signatureType as 'electronic' | 'digital',
      ipAddress,
      userAgent
    };

    // Generate signature hash
    const signatureHash = generateSignatureHash(signatureData);
    const timestamp = new Date().toISOString();

    // Get document content from variables_used (where we stored the HTML)
    const documentContent = document.variables_used?.document_content || '<html><body>Document content not found</body></html>';

    // Add signature to document content
    const signedContent = addSignatureToDocument(documentContent, signatureData);

    // Update document with signed content and signature info
    const updateData: any = {
      variables_used: {
        ...document.variables_used,
        document_content: signedContent,
        signatures: {
          ...document.variables_used?.signatures,
          [signerRole]: {
            name: signatureData.signerName,
            hash: signatureHash,
            timestamp: timestamp,
            ip: ipAddress
          }
        }
      },
      updated_at: timestamp
    };

    // Update signature status
    const existingSignatures = document.variables_used?.signatures || {};
    const hasClientSignature = existingSignatures.client || signerRole === 'client';
    const hasAdvisorSignature = existingSignatures.advisor || signerRole === 'advisor';

    if (hasClientSignature && hasAdvisorSignature) {
      updateData.is_signed = true;
      updateData.signature_applied_at = timestamp;
    }

    // Update document in database
    const { data: updatedDocument, error: updateError } = await supabaseAdmin
      .from('client_documents_archive')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour document:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Erreur mise à jour document'
      }, { status: 500 });
    }

    console.log('✅ Document signé avec succès:', {
      documentId,
      signerRole,
      status: updatedDocument.status,
      signatureHash
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        status: updatedDocument.status,
        signatureHash,
        signedAt: timestamp,
        content: signedContent
      },
      message: `Document signé avec succès par ${signerName}`
    });

  } catch (error) {
    console.error('❌ Erreur signature document:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// GET - Vérifier le statut de signature d'un document
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({
        success: false,
        error: 'documentId requis'
      }, { status: 400 });
    }

    const { data: document, error } = await supabaseAdmin
      .from('client_documents_archive')
      .select('id, is_signed, signature_applied_at, variables_used')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({
        success: false,
        error: 'Document non trouvé'
      }, { status: 404 });
    }

    const signatures = document.variables_used?.signatures || {};

    return NextResponse.json({
      success: true,
      signature: {
        documentId: document.id,
        status: document.is_signed ? 'completed' : 'pending',
        clientSigned: !!signatures.client,
        advisorSigned: !!signatures.advisor,
        clientSignedAt: signatures.client?.timestamp,
        advisorSignedAt: signatures.advisor?.timestamp,
        signatureAppliedAt: document.signature_applied_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification signature:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
