import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Только точное совпадение с /buy-ticket, исключаем дочерние пути
const SENSITIVE_QUERY_PATHS = ['/buy-ticket'];

function buildCsp(isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  
  // 🔥 ИЗМЕНЕНО ДЛЯ ПРОДАКШЕНА
  const connectSrc = isDev
    ? "connect-src 'self' http://localhost:8000 ws://localhost:3000"
    : "connect-src 'self' https://igrovoy-labirint.ru";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, isDev: boolean): NextResponse {
  response.headers.set('Content-Security-Policy', buildCsp(isDev));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.delete('X-Powered-By');
  return response;
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  const { pathname, search } = request.nextUrl;

  // Очищаем параметры ТОЛЬКО для точного пути /buy-ticket
  // НЕ для /buy-ticket/success, /buy-ticket/anything-else
  const shouldCleanParams = SENSITIVE_QUERY_PATHS.some((p) => pathname === p) && search.length > 0 && request.method === 'GET';
  
  if (shouldCleanParams) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(cleanUrl), isDev);
  }

  if (pathname.startsWith('/api/') || pathname === '/api') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store');
    return applySecurityHeaders(response, isDev);
  }

  return applySecurityHeaders(NextResponse.next(), isDev);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};