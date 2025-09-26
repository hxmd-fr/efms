import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function POST(request: Request) {
  // --- THIS IS THE FIX ---
  // We will now explicitly check if the environment variables were loaded.
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error("LOGIN_ERROR: Missing database credentials in .env.local file. Please ensure the file exists and the server was restarted.");
    return NextResponse.json(
      { message: 'Server configuration error: Database credentials are not configured. Please check your .env.local file and restart the server.' },
      { status: 500 }
    );
  }

  let connection;
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    
    const query = `SELECT User_ID, Name, Email, Password, Role FROM Users WHERE Email = ?`;
    const [rows]: [any[], any] = await connection.execute(query, [email]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    const tokenPayload = { userId: user.User_ID, name: user.Name, role: user.Role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    const response = NextResponse.json({ message: 'Login successful!' });
    
    response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60,
    });
    return response;

  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

