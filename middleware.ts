import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Routes qui nécessitent une authentification agent
const protectedAgentRoutes = [
  '/agent-dashboard',
  '/agent/clients',
  '/agent/cases',
  '/agent/profile',
  '/agent' // 🔒 SÉCURISER L'ACCÈS À L'ESPACE AGENT
];

// Routes admin qui nécessitent une authentification admin
const protectedAdminRoutes = [
  '/admin' // 🔒 SÉCURISER L'ACCÈS À L'ADMINISTRATION
];

// Routes publiques autorisées (pour déploiement)
const publicRoutes = [
  '/',
  '/login', // 🔒 PAGE DE CONNEXION PRINCIPALE
  '/register',
  '/client-login',
  '/agent-login', // Gardé pour compatibilité si nécessaire
  '/demo',
  '/features',
  '/pricing',
  '/security',
  '/help',
  '/contact',
  '/privacy',
  '/terms',
  '/compliance',
  '/status'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route protégée pour les agents
  if (protectedAgentRoutes.some(route => pathname.startsWith(route))) {
    console.log(`🔍 Middleware: Route agent protégée détectée: ${pathname}`);

    const token = request.cookies.get('agent_token')?.value;
    console.log(`🔍 Middleware: agent_token trouvé: ${token ? 'OUI' : 'NON'}`);

    if (!token) {
      console.log(`❌ Middleware: Aucun agent_token trouvé, redirection vers /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Vérifier le token avec jose (compatible Edge Runtime)
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log(`🔍 Middleware: Token décodé - userId: ${payload.userId}, role: ${payload.role}`);

      console.log(`✅ Middleware: Accès autorisé pour agent ${payload.userId}`);
      return NextResponse.next();
    } catch (error) {
      console.log(`❌ Middleware: Token invalide, redirection vers /login:`, error);
      // Token invalide, rediriger vers la connexion
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('agent_token');
      return response;
    }
  }

  // Vérifier si c'est une route protégée pour les admins
  if (protectedAdminRoutes.some(route => pathname.startsWith(route))) {
    // Pour l'instant, on laisse l'accès libre à l'admin
    // En production, vous devriez implémenter une authentification admin
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
