import { type NextRequest, NextResponse } from "next/server"
import { DocxGenerator } from "@/lib/docx-generator"

interface PersonInfo {
  nom: string
  prenom: string
  dateNaissance: string
  numeroPolice: string
}

interface ClientData {
  // Informations principales du client
  nom: string
  prenom: string
  dateNaissance: string
  numeroPolice: string
  email: string
  
  // Adresse séparée
  adresse: string
  npa: string
  ville: string
  
  // Type de formulaire et destinataire
  typeFormulaire: 'resiliation' | 'souscription' | 'modification' | 'autre'
  destinataire: string
  lieuDate: string
  
  // Personnes supplémentaires (famille)
  personnes: PersonInfo[]
  
  // Dates spécifiques
  dateLamal: string
  dateLCA: string
  
  // Champs calculés/legacy (pour compatibilité)
  nomPrenom: string
  npaVille: string
}

export async function POST(request: NextRequest) {
  try {
    const { clientData, clientId, caseId, includeSignature = true } = await request.json()

    console.log('📄 Génération document Word:', {
      clientId,
      caseId,
      includeSignature,
      clientName: clientData?.nomPrenom || 'N/A'
    });

    // Validation des données requises
    if (!clientData.nomPrenom || !clientData.adresse || !clientData.npaVille) {
      return NextResponse.json(
        {
          success: false,
          message: "Données client incomplètes",
        },
        { status: 400 }
      )
    }

    // Récupérer la signature du client si demandée
    let signatureData = null;
    let realCaseId = caseId;

    if (includeSignature) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase');

        // Si caseId ressemble à un token (commence par SECURE_), récupérer l'ID réel et le client_id
        let actualClientId = clientId;
        if (caseId && caseId.startsWith('SECURE_')) {
          const { data: caseData } = await supabaseAdmin
            .from('insurance_cases')
            .select('id, client_id')
            .eq('secure_token', caseId)
            .single();

          if (caseData) {
            realCaseId = caseData.id;
            actualClientId = actualClientId || caseData.client_id;
            console.log('✅ ID réel du cas récupéré:', realCaseId, 'Client ID:', actualClientId);
          }
        } else if (caseId && !actualClientId) {
          // Si on a un caseId normal mais pas de clientId, le récupérer
          const { data: caseData } = await supabaseAdmin
            .from('insurance_cases')
            .select('client_id')
            .eq('id', caseId)
            .single();

          if (caseData) {
            actualClientId = caseData.client_id;
            console.log('✅ Client ID récupéré depuis le cas:', actualClientId);
          }
        }

        // D'abord essayer avec la nouvelle table client_signatures
        if (actualClientId) {
          const { data: clientSignature } = await supabaseAdmin
            .from('client_signatures')
            .select('signature_data, signature_name')
            .eq('client_id', actualClientId)
            .eq('is_active', true)
            .eq('is_default', true)
            .single();

          if (clientSignature) {
            signatureData = clientSignature.signature_data;
            console.log('✅ Signature client récupérée depuis client_signatures');
          }
        }

        // Fallback: essayer avec l'ancienne table signatures si pas trouvé
        if (!signatureData && realCaseId) {
          const { data: caseSignature } = await supabaseAdmin
            .from('signatures')
            .select('signature_data')
            .eq('case_id', realCaseId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (caseSignature) {
            signatureData = caseSignature.signature_data;
            console.log('✅ Signature récupérée depuis signatures (fallback)');
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur récupération signature:', error);
      }
    }

    // Générer le document Word avec signature
    const wordBuffer = await DocxGenerator.generateResignationDocument(clientData, signatureData)

    // Générer un nom de fichier unique
    const fileName = `Resiliation_${clientData.nom}_${clientData.prenom}_${Date.now()}.docx`

    // Retourner le document comme réponse
    return new NextResponse(wordBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': wordBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("[API] Error generating Word document:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors de la génération du document Word",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}

// Méthode GET pour télécharger un document existant (optionnel)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: "Client ID requis" },
      { status: 400 }
    )
  }

  // Dans une vraie implémentation, vous récupéreriez les données depuis la base de données
  // Pour l'instant, retournons une erreur
  return NextResponse.json(
    { success: false, message: "Document non trouvé" },
    { status: 404 }
  )
}
