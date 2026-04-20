import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    try {
      const authValue = basicAuth.split(' ')[1];
      const decoded = atob(authValue);
      const [user, pwd] = decoded.split(':');

      if (user === 'admin' && pwd === 'ruemu@2004') {
        return NextResponse.next();
      }
    } catch (e) {
      console.log('Auth decoding failed');
    }
  }

  // Edge-safe: return null instead of a text string
  return new NextResponse(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// CRITICAL FIX: Exclude system files AND internal /api calls
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};