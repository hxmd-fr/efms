import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT Account_ID, Account_Type FROM Accounts ORDER BY Account_Type ASC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DATABASE_ERROR (GET Accounts):', error);
    return NextResponse.json({ message: 'Failed to fetch accounts.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
