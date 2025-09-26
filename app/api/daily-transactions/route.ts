import { NextResponse, NextRequest } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// This function handles requests like /api/daily-transactions?userId=1&day=2025-09-04
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const day = searchParams.get('day');

    if (!userId || !day) {
      return NextResponse.json({ message: 'User ID and day are required.' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT Trans_ID, Description, Amount, Trans_Type, Date 
      FROM Transactions
      WHERE User_ID = ? AND DATE(Date) = ?
      ORDER BY Date DESC;
    `;
    
    const [rows] = await connection.execute(query, [userId, day]);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('DATABASE_ERROR (Daily-Transactions):', error);
    return NextResponse.json({ message: 'Failed to fetch daily transactions.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

