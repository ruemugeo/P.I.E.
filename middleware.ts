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
      // If decoding fails, don't crash the server, just ask for the password again
      console.log('Auth error ignored');
    }
  }

  return new NextResponse('Unauthorized access to the Cognitive Engine.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// CRITICAL FIX: Tell the lock to ignore Vercel's internal system files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};