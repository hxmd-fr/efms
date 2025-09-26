import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { logAction } from '@/app/utils/audit-logger';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- PUT Method: Updates an existing transaction ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    const { role, adminId, Account_ID, User_ID, Amount, Trans_Type, Description, Date, Category } = await request.json();

    if (role === 'Employee') {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to edit transactions.' }, { status: 403 });
    }

    if (!Account_ID || !User_ID || !Amount || !Trans_Type || !Date || !id) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `
      UPDATE Transactions 
      SET Account_ID = ?, User_ID = ?, Amount = ?, Trans_Type = ?, Description = ?, Date = ?, Category = ?
      WHERE Trans_ID = ?;
    `;
    
    await connection.execute(query, [Account_ID, User_ID, Amount, Trans_Type, Description, Date, Category, id]);

    const actionMessage = `Edited transaction ID ${id}: New amount $${Amount}, Description "${Description}".`;
    await logAction(adminId, actionMessage);

    return NextResponse.json({ message: 'Transaction updated successfully!' });

  } catch (error) {
    console.error('DATABASE_ERROR (PUT Transaction):', error);
    return NextResponse.json({ message: 'Failed to update transaction.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// --- DELETE Method: Deletes a transaction ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    const { role, adminId } = await request.json();

    if (role !== 'Admin') {
        return NextResponse.json({ message: 'Forbidden: Only Admins can delete transactions.' }, { status: 403 });
    }
    
    connection = await mysql.createConnection(dbConfig);

    const [transRows]: [any[], any] = await connection.execute('SELECT Description, Amount FROM Transactions WHERE Trans_ID = ?', [id]);
    const transDetails = transRows[0] || { Description: 'N/A', Amount: '0' };

    const query = "DELETE FROM Transactions WHERE Trans_ID = ?;";
    await connection.execute(query, [id]);

    const actionMessage = `Deleted transaction ID ${id}: "${transDetails.Description}" for $${transDetails.Amount}.`;
    await logAction(adminId, actionMessage);

    return NextResponse.json({ message: 'Transaction deleted successfully!' });

  } catch (error) {
    console.error('DATABASE_ERROR (DELETE Transaction):', error);
    return NextResponse.json({ message: 'Failed to delete transaction.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

