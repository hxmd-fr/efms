import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { logAction } from '@/app/utils/audit-logger'; // <-- 1. IMPORT the new helper

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- PUT Method (Upgraded with Logging) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    const { Name, Role, Email, adminRole, adminId } = await request.json(); 

    if (adminRole !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can edit users.' }, { status: 403 });
    }
    if (!Name || !Role || !Email || !id) {
      return NextResponse.json({ message: 'Name, Role, and Email are required.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `UPDATE Users SET Name = ?, Role = ?, Email = ? WHERE User_ID = ?;`;
    await connection.execute(query, [Name, Role, Email, id]);
    
    // --- 2. LOG THE ACTION ---
    const actionMessage = `Edited user details for: ${Name} (ID: ${id})`;
    await logAction(adminId, actionMessage);

    return NextResponse.json({ message: 'User updated successfully!' });

  } catch (error: any) {
    console.error('DATABASE_ERROR (PUT User):', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update user.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// --- DELETE Method (Upgraded with Logging) ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    const { adminRole, adminId } = await request.json();

    if (adminRole !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Only Admins can delete users.' }, { status: 403 });
    }
    if (parseInt(id) === adminId) {
      return NextResponse.json({ message: 'Cannot delete your own Admin account.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    // First, get the name of the user being deleted for a clear log message
    const [userRows]: [any[], any] = await connection.execute(`SELECT Name FROM Users WHERE User_ID = ?`, [id]);
    const userNameToDelete = userRows[0]?.Name || 'Unknown User';
    
    // Now, delete the user
    const query = `DELETE FROM Users WHERE User_ID = ?;`;
    await connection.execute(query, [id]);

    // --- 2. LOG THE ACTION ---
    const actionMessage = `Deleted user: ${userNameToDelete} (ID: ${id})`;
    await logAction(adminId, actionMessage);

    return NextResponse.json({ message: 'User deleted successfully!' });

  } catch (error) {
    console.error('DATABASE_ERROR (DELETE User):', error);
    return NextResponse.json({ message: 'Failed to delete user.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

