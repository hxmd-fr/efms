import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logAction } from '@/app/utils/audit-logger'; // 1. Import the logger

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST() {
  const token = (await cookies()).get('session_token');

  // --- 2. LOG THE ACTION ---
  // Before deleting the token, we read it to find out who is logging out.
  if (token) {
      try {
          // Verify the token to securely get the user's ID
          const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: number };
          // Record the logout event in the audit log
          await logAction(decoded.userId, `User logged out successfully.`);
      } catch (e) {
          // If the token is invalid or expired, we can't log the user ID,
          // but we still proceed with the logout to clear the bad cookie.
          console.error("Could not decode token on logout (it may have expired):", e);
      }
  }

  // Create a success response
  const response = NextResponse.json({ message: 'Logout successful!' });
  
  // Set the session_token cookie with a maxAge of 0 to effectively delete it from the browser.
  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // This tells the browser to expire the cookie immediately
  });

  return response;
}

