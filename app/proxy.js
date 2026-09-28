import { NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

/**
 * Rutas que requieren autenticación.
 */
const protectedRoutes = ['/dashboard', '/import', '/admin'];

/**
 * Rutas exclusivas para usuarios no autenticados (Login).
 */
const publicRoutes = ['/login'];

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  
  // Verificamos si la ruta actual coincide con rutas protegidas o públicas
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Extraemos la cookie de sesión
  const sessionCookie = req.cookies.get('session')?.value;
  let parsedSession = null;
  
  if (sessionCookie) {
    parsedSession = await decrypt(sessionCookie);
  }

  const isAuthenticated = !!parsedSession;

  // Regla 1: Usuario no autenticado intenta acceder a ruta protegida -> Redirigir a /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.nextUrl);
    // Podemos pasar un callback url para redirigir de vuelta tras el login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Regla 2: Usuario autenticado intenta ir a /login -> Redirigir al /dashboard
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Por defecto, permitimos continuar
  const response = NextResponse.next();
  
  // Refrescamos o prolongamos ligeramente la sesión si fuese necesario
  return response;
}

export const config = {
  // Aplicamos el middleware a todo excepto archivos estáticos, api interna y assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
