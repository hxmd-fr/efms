import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { logAction } from '@/app/utils/audit-logger';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- PUT Method: Marks a specific alert as resolved ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Destructure 'id' from params at the top level
  const { id } = params;
  let connection;

  try {
    // Get the role and ID of the user performing the action from the request body
    const { role, adminId } = await request.json();

    // SERVER-SIDE SECURITY CHECK: Ensure the user has permission
    if (role === 'Employee') {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to resolve alerts.' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Update the 'is_resolved' flag for the specific Alert_ID
    const query = `UPDATE Fraud_Alerts SET is_resolved = 1 WHERE Alert_ID = ?;`;
    await connection.execute(query, [id]);
    
    // After successfully resolving the alert, create a log entry
    await logAction(adminId, `Resolved fraud alert ID: ${id}.`);

    return NextResponse.json({ message: 'Alert resolved successfully!' });

  } catch (error) {
    console.error('DATABASE_ERROR (PUT Alert):', error);
    if ((error as any).code === 'ER_ACCESS_DENIED_ERROR') {
        return NextResponse.json({ message: 'Database access denied. Check your .env.local credentials.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Failed to resolve alert.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

