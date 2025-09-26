import { NextResponse, NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// --- THIS IS THE FIX ---
// This line forces the route to be fully dynamic, ensuring the cookies()
// function is always available and can read the incoming request's cookies.
export const dynamic = 'force-dynamic';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// This function will fetch the audit log, but only for an admin
export async function GET(request: NextRequest) {
  let connection;
  try {
    // 1. Verify the user is an Admin from their session token
    const token = (await cookies()).get('session_token');
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }
    const decodedToken = jwt.verify(token.value, JWT_SECRET) as { role: string };
    if (decodedToken.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view the audit log.' }, { status: 403 });
    }

    // 2. If the user is an Admin, fetch the audit log data
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT 
        al.Log_ID,
        al.Action,
        al.Timestamp,
        u.Name as UserName,
        u.Email as UserEmail
      FROM Audit_Log al
      LEFT JOIN Users u ON al.User_ID = u.User_ID
      ORDER BY al.Timestamp DESC
      LIMIT 100;
    `;
    
    const [rows] = await connection.execute(query);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('DATABASE_ERROR (Audit Log):', error);
    return NextResponse.json({ message: 'Failed to fetch audit log.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

