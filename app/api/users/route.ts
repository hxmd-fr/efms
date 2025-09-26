import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { logAction } from '@/app/utils/audit-logger';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- GET Method: Fetches all users ---
export async function GET() {
  // Add a robust check for environment variables
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error("DATABASE_ERROR: Missing database credentials in .env.local file.");
    return NextResponse.json(
      { message: 'Database credentials are not configured. Please check your .env.local file and restart the server.' },
      { status: 500 }
    );
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT User_ID, Name, Email, Role FROM Users ORDER BY Name ASC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DATABASE_ERROR (GET Users):', error);
    return NextResponse.json({ message: 'Failed to connect to or query the database.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// --- POST Method: Creates a new user (Upgraded with Logging) ---
export async function POST(request: Request) {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    return NextResponse.json({ message: 'Database credentials are not configured.' }, { status: 500 });
  }

  let connection;
  try {
    const { Name, Email, Password, Role, adminRole, adminId } = await request.json();

    if (adminRole !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can create new users.' }, { status: 403 });
    }
    if (!Name || !Email || !Password || !Role) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
     if (Password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(Password, salt);

    connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?);`;
    await connection.execute(query, [Name, Email, hashedPassword, Role]);
    
    // --- LOG THE ACTION ---
    // After the user is successfully created, log the event.
    const actionMessage = `Created new user: ${Name} (${Email}) with role ${Role}.`;
    await logAction(adminId, actionMessage);
    
    return NextResponse.json({ message: 'User created successfully!' }, { status: 201 });

  } catch (error: any) {
    console.error('DATABASE_ERROR (POST User):', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

