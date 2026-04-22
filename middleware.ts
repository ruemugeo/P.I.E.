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

  return new NextResponse(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// SECURED: Protects UI and /api calls
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};