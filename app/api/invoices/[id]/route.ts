import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// PUT: Marks an invoice as 'Paid'
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // Sets the status to 'Paid' and records the current date as the payment date
    const query = `UPDATE Invoices SET Status = 'Paid', Payment_Date = CURDATE() WHERE Invoice_ID = ?;`;
    await connection.execute(query, [id]);
    return NextResponse.json({ message: 'Invoice marked as paid!' });
  } catch (error) {
    console.error('DATABASE_ERROR (PUT Invoice):', error);
    return NextResponse.json({ message: 'Failed to update invoice.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
