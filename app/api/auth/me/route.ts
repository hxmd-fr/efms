import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// This line forces the route to be fully dynamic,
// ensuring the cookies() function is always available.
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function GET() {
  try {
    // THIS IS THE FIX: We get the cookie store object first.
    // This more explicit, two-step pattern is more robust and helps
    // the TypeScript compiler correctly understand the types.
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token');

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token.value, JWT_SECRET);
    
    // Return the user's data from the token
    return NextResponse.json(decoded);

  } catch (error) {
    // This will catch errors from a missing/invalid token
    console.error('AUTH_ME_ERROR:', error);
    return NextResponse.json({ message: 'Invalid session or token.' }, { status: 401 });
  }
}


