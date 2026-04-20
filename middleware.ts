import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Get the authorization header from the request
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // CHANGE THESE to whatever username/password you want!
    if (user === 'admin' && pwd === 'ruemu@2004') {
      return NextResponse.next();
    }
  }

  // If no auth or wrong auth, trigger the browser's login popup
  return new NextResponse('Unauthorized access to the Cognitive Engine.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// This ensures the lock applies to every single page and API route
export const config = {
  matcher: '/:path*',
};