import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Lister toutes les signatures dans le storage pour un client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const action = searchParams.get('action') || 'list';

    console.log('📋 Gestion signatures storage:', { clientId, action });

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'clientId requis'
      }, { status: 400 });
    }

    if (action === 'list') {
      // Récupérer toutes les signatures du client depuis la DB
      const { data: signatures, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select(`
          id,
          signature_name,
          signature_metadata,
          created_at,
          is_default,
          is_active,
          clients!inner(
            client_code,
            users!inner(
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (sigError) {
        console.error('❌ Erreur récupération signatures DB:', sigError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la récupération des signatures'
        }, { status: 500 });
      }

      // Lister les fichiers dans le dossier signatures du client
      const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
        .from('client-documents')
        .list(`${clientId}/signatures`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.warn('⚠️ Erreur listage storage (peut être vide):', storageError);
      }

      // Enrichir les signatures avec les infos de storage
      const enrichedSignatures = signatures.map(sig => {
        const metadata = sig.signature_metadata as any;
        const storagePath = metadata?.storage_path;
        
        // Chercher le fichier correspondant dans le storage
        const storageFile = storageFiles?.find(file => 
          storagePath && storagePath.includes(file.name)
        );

        return {
          ...sig,
          client_name: `${sig.clients.users.first_name} ${sig.clients.users.last_name}`,
          client_code: sig.clients.client_code,
          client_email: sig.clients.users.email,
          storage_path: storagePath,
          storage_available: !!storagePath && !!storageFile,
          storage_file_info: storageFile ? {
            name: storageFile.name,
            size: storageFile.metadata?.size,
            created_at: storageFile.created_at,
            updated_at: storageFile.updated_at
          } : null,
          download_url: storagePath 
            ? `/api/client/get-signature-from-storage?storagePath=${encodeURIComponent(storagePath)}`
            : null
        };
      });

      return NextResponse.json({
        success: true,
        signatures: enrichedSignatures,
        storage_files: storageFiles || [],
        count: {
          database: signatures.length,
          storage: storageFiles?.length || 0,
          with_storage: enrichedSignatures.filter(s => s.storage_available).length
        }
      });
    }

    if (action === 'storage-only') {
      // Lister uniquement les fichiers dans le storage
      const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
        .from('client-documents')
        .list(`${clientId}/signatures`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.error('❌ Erreur listage storage:', storageError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors du listage des fichiers de signature'
        }, { status: 500 });
      }

      const enrichedFiles = storageFiles.map(file => ({
        ...file,
        full_path: `${clientId}/signatures/${file.name}`,
        download_url: `/api/client/get-signature-from-storage?storagePath=${encodeURIComponent(`${clientId}/signatures/${file.name}`)}`,
        public_url: supabaseAdmin.storage
          .from('client-documents')
          .getPublicUrl(`${clientId}/signatures/${file.name}`).data.publicUrl
      }));

      return NextResponse.json({
        success: true,
        storage_files: enrichedFiles,
        count: enrichedFiles.length
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Action non supportée'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur API manage-signatures-storage:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la gestion des signatures'
    }, { status: 500 });
  }
}

// Supprimer une signature du storage
export async function DELETE(request: NextRequest) {
  try {
    const { signatureId, storagePath, clientId } = await request.json();

    console.log('🗑️ Suppression signature storage:', { signatureId, storagePath, clientId });

    if (!signatureId && !storagePath) {
      return NextResponse.json({
        success: false,
        error: 'signatureId ou storagePath requis'
      }, { status: 400 });
    }

    let pathToDelete = storagePath;

    // Si on a l'ID de signature, récupérer le chemin depuis la DB
    if (signatureId && !storagePath) {
      const { data: signatureData, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select('signature_metadata')
        .eq('id', signatureId)
        .single();

      if (sigError || !signatureData) {
        return NextResponse.json({
          success: false,
          error: 'Signature non trouvée'
        }, { status: 404 });
      }

      const metadata = signatureData.signature_metadata as any;
      pathToDelete = metadata?.storage_path;
    }

    if (!pathToDelete) {
      return NextResponse.json({
        success: false,
        error: 'Aucun fichier à supprimer dans le storage'
      }, { status: 404 });
    }

    // Supprimer le fichier du storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('client-documents')
      .remove([pathToDelete]);

    if (deleteError) {
      console.error('❌ Erreur suppression storage:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la suppression du fichier'
      }, { status: 500 });
    }

    // Si on a l'ID de signature, mettre à jour les métadonnées
    if (signatureId) {
      const { error: updateError } = await supabaseAdmin
        .from('client_signatures')
        .update({
          signature_metadata: {
            ...((await supabaseAdmin
              .from('client_signatures')
              .select('signature_metadata')
              .eq('id', signatureId)
              .single()).data?.signature_metadata || {}),
            storage_path: null,
            storage_deleted_at: new Date().toISOString()
          }
        })
        .eq('id', signatureId);

      if (updateError) {
        console.warn('⚠️ Erreur mise à jour métadonnées:', updateError);
      }
    }

    console.log('✅ Signature supprimée du storage:', pathToDelete);

    return NextResponse.json({
      success: true,
      message: 'Signature supprimée du storage avec succès',
      deleted_path: pathToDelete
    });

  } catch (error) {
    console.error('❌ Erreur API DELETE manage-signatures-storage:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    }, { status: 500 });
  }
}

// Synchroniser les signatures entre DB et Storage
export async function POST(request: NextRequest) {
  try {
    const { clientId, action = 'sync' } = await request.json();

    console.log('🔄 Synchronisation signatures:', { clientId, action });

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'clientId requis'
      }, { status: 400 });
    }

    if (action === 'sync') {
      // Récupérer toutes les signatures de la DB
      const { data: signatures, error: sigError } = await supabaseAdmin
        .from('client_signatures')
        .select('id, signature_data, signature_name, signature_metadata')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (sigError) {
        console.error('❌ Erreur récupération signatures:', sigError);
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la récupération des signatures'
        }, { status: 500 });
      }

      let syncResults = {
        total: signatures.length,
        uploaded: 0,
        skipped: 0,
        errors: 0,
        details: []
      };

      // Pour chaque signature, vérifier si elle existe dans le storage
      for (const signature of signatures) {
        try {
          const metadata = signature.signature_metadata as any;
          
          // Si pas de storage_path, uploader la signature
          if (!metadata?.storage_path && signature.signature_data) {
            const base64Data = signature.signature_data.split(',')[1];
            const signatureBuffer = Buffer.from(base64Data, 'base64');
            
            const timestamp = Date.now();
            const safeSignatureName = signature.signature_name.replace(/[^a-zA-Z0-9]/g, '_');
            const signatureFileName = `${clientId}/signatures/${safeSignatureName}_${timestamp}.png`;
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('client-documents')
              .upload(signatureFileName, signatureBuffer, {
                contentType: 'image/png',
                upsert: false
              });
            
            if (uploadError) {
              console.warn('⚠️ Erreur upload sync:', uploadError);
              syncResults.errors++;
              syncResults.details.push({
                signature_id: signature.id,
                status: 'error',
                error: uploadError.message
              });
            } else {
              // Mettre à jour les métadonnées
              await supabaseAdmin
                .from('client_signatures')
                .update({
                  signature_metadata: {
                    ...metadata,
                    storage_path: uploadData.path,
                    synced_at: new Date().toISOString()
                  }
                })
                .eq('id', signature.id);
              
              syncResults.uploaded++;
              syncResults.details.push({
                signature_id: signature.id,
                status: 'uploaded',
                storage_path: uploadData.path
              });
            }
          } else {
            syncResults.skipped++;
            syncResults.details.push({
              signature_id: signature.id,
              status: 'skipped',
              reason: metadata?.storage_path ? 'already_in_storage' : 'no_signature_data'
            });
          }
        } catch (err) {
          console.error('❌ Erreur sync signature:', err);
          syncResults.errors++;
          syncResults.details.push({
            signature_id: signature.id,
            status: 'error',
            error: err.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Synchronisation terminée',
        results: syncResults
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Action non supportée'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur API POST manage-signatures-storage:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors de la synchronisation'
    }, { status: 500 });
  }
}
