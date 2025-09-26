import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// GET: Fetches all invoices with vendor names
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT i.Invoice_ID, i.Amount, i.Due_Date, i.Status, i.Payment_Date, v.Name as VendorName
      FROM Invoices i
      JOIN Vendors v ON i.Vendor_ID = v.Vendor_ID
      ORDER BY i.Due_Date ASC;
    `;
    const [rows] = await connection.execute(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DATABASE_ERROR (GET Invoices):', error);
    return NextResponse.json({ message: 'Failed to fetch invoices.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST: Creates a new invoice
export async function POST(request: Request) {
  let connection;
  try {
    const { Vendor_ID, Amount, Due_Date } = await request.json();
    if (!Vendor_ID || !Amount || !Due_Date) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO Invoices (Vendor_ID, Amount, Due_Date, Status) VALUES (?, ?, ?, 'Unpaid');`;
    await connection.execute(query, [Vendor_ID, Amount, Due_Date]);
    return NextResponse.json({ message: 'Invoice created successfully!' }, { status: 201 });
  } catch (error) {
    console.error('DATABASE_ERROR (POST Invoice):', error);
    return NextResponse.json({ message: 'Failed to create invoice.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
