import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test de base - l'API répond
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        api: 'ok',
        database: 'checking',
        environment: 'checking'
      }
    };

    // Test de la base de données Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) {
        health.checks.database = `error: ${error.message}`;
        health.status = 'degraded';
      } else {
        health.checks.database = 'ok';
      }
    } catch (dbError) {
      health.checks.database = `error: ${dbError instanceof Error ? dbError.message : 'unknown'}`;
      health.status = 'degraded';
    }

    // Test des variables d'environnement critiques
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      health.checks.environment = `missing: ${missingEnvVars.join(', ')}`;
      health.status = 'unhealthy';
    } else {
      health.checks.environment = 'ok';
    }

    // Temps de réponse
    const responseTime = Date.now() - startTime;
    health.responseTime = `${responseTime}ms`;

    // Informations système
    health.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    // URL de l'application
    health.urls = {
      app: process.env.NEXT_PUBLIC_APP_URL || 'not-configured',
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-configured'
    };

    // Statut HTTP basé sur la santé globale
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    console.log(`🏥 Health check: ${health.status} (${responseTime}ms)`);

    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        api: 'error',
        database: 'unknown',
        environment: 'unknown'
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Support pour HEAD requests (utilisé par certains load balancers)
export async function HEAD(request: NextRequest) {
  try {
    // Test rapide sans vérifications approfondies
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
