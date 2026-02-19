import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  
  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnOnboarding = pathname.startsWith('/onboarding');
  const isOnAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  // Checking the local cookie since we lack a backend
  const hasOnboarded = req.cookies.get('has_onboarded')?.value === 'true';

  if (isLoggedIn) {
    if (isOnAuthPage) {
      return NextResponse.redirect(new URL(hasOnboarded ? '/dashboard' : '/onboarding', req.url));
    }
    if (isOnDashboard && !hasOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    if (isOnOnboarding && hasOnboarded) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else {
    // Protect private routes from unauthenticated users
    if (isOnDashboard || isOnOnboarding) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};