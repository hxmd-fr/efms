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

// --- PUT Method: Changes a user's password (Upgraded with Logging) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    const { password, adminRole, adminId } = await request.json();

    // SERVER-SIDE SECURITY CHECK
    if (adminRole !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can change passwords.' }, { status: 403 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ message: 'Password is required and must be at least 6 characters long.' }, { status: 400 });
    }

    // Securely hash the new password before saving it
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    connection = await mysql.createConnection(dbConfig);
    
    // Get the name of the user whose password is being changed for a clear log message
    const [userRows]: [any[], any] = await connection.execute(`SELECT Name FROM Users WHERE User_ID = ?`, [id]);
    const userName = userRows[0]?.Name || 'Unknown User';
    
    // Update the password in the database
    const query = `UPDATE Users SET Password = ? WHERE User_ID = ?;`;
    await connection.execute(query, [hashedPassword, id]);

    // --- LOG THE ACTION ---
    // After the password is changed, log the event.
    const actionMessage = `Changed password for user: ${userName} (ID: ${id}).`;
    await logAction(adminId, actionMessage);
    
    return NextResponse.json({ message: 'Password updated successfully!' });

  } catch (error) {
    console.error('DATABASE_ERROR (PUT Password):', error);
    if ((error as any).code === 'ER_ACCESS_DENIED_ERROR') {
        return NextResponse.json({ message: 'Database access denied. Check your .env.local credentials.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Failed to update password.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

