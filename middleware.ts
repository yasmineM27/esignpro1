import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes qui nécessitent une authentification agent
const protectedAgentRoutes = [
  '/agent-dashboard',
  '/agent/clients',
  '/agent/cases',
  '/agent/profile'
];

// Routes admin qui nécessitent une authentification admin
const protectedAdminRoutes = [
  '/admin'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route protégée pour les agents
  if (protectedAgentRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('agent_token')?.value;

    if (!token) {
      // Rediriger vers la page de connexion agent
      return NextResponse.redirect(new URL('/agent-login', request.url));
    }

    try {
      // Vérifier le token
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      // Token invalide, rediriger vers la connexion
      const response = NextResponse.redirect(new URL('/agent-login', request.url));
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
