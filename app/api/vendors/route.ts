import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// GET: Fetches all vendors (unchanged)
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT Vendor_ID, Name FROM Vendors ORDER BY Name ASC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DATABASE_ERROR (GET Vendors):', error);
    return NextResponse.json({ message: 'Failed to fetch vendors.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST: Creates a new vendor (Upgraded to return the new vendor)
export async function POST(request: Request) {
  let connection;
  try {
    const { Name, Contact_Info } = await request.json();
    if (!Name || !Contact_Info) {
      return NextResponse.json({ message: 'Vendor name and contact info are required.' }, { status: 400 });
    }
    connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO Vendors (Name, Contact_Info) VALUES (?, ?);`;
    const [result]: [any, any] = await connection.execute(query, [Name, Contact_Info]);
    
    // Get the ID of the new vendor that was just inserted
    const newVendorId = result.insertId;

    // Return the complete new vendor object to the frontend
    const newVendor = { Vendor_ID: newVendorId, Name, Contact_Info };
    return NextResponse.json(newVendor, { status: 201 });

  } catch (error) {
    console.error('DATABASE_ERROR (POST Vendor):', error);
    return NextResponse.json({ message: 'Failed to create vendor.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}