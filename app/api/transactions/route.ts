import { NextResponse, NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { logAction } from '@/app/utils/audit-logger';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- GET Method: Fetches transactions with advanced filtering ---
export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId');
    const accountType = searchParams.get('accountType');

    connection = await mysql.createConnection(dbConfig);

    let query = `
      SELECT 
        t.Trans_ID, t.Amount, t.Trans_Type, t.Date, t.Description, 
        u.Name as UserName, a.Account_Type as AccountType,
        t.User_ID, t.Account_ID, t.Category
      FROM Transactions t
      JOIN Users u ON t.User_ID = u.User_ID
      JOIN Accounts a ON t.Account_ID = a.Account_ID
    `;
    
    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];

    if (search) {
      conditions.push(`t.Description LIKE ?`);
      queryParams.push(`%${search}%`);
    }
    if (userId) {
      conditions.push(`t.User_ID = ?`);
      queryParams.push(parseInt(userId));
    }
    if (accountType) {
      conditions.push(`a.Account_Type = ?`);
      queryParams.push(accountType);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY t.Date DESC;`;
    
    const [rows] = await connection.execute(query, queryParams);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('DATABASE_ERROR (GET with filters):', error);
    return NextResponse.json({ message: 'Failed to fetch transactions.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// --- POST Method: Creates a new transaction with category support ---
export async function POST(request: Request) {
    let connection;
    try {
        const { Account_ID, User_ID, Amount, Trans_Type, Description, Date, Category, adminId } = await request.json();

        if (!Account_ID || !User_ID || !Amount || !Trans_Type || !Date) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        connection = await mysql.createConnection(dbConfig);
        const query = `
            INSERT INTO Transactions (Account_ID, User_ID, Amount, Trans_Type, Description, Date, Category) 
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        await connection.execute(query, [Account_ID, User_ID, Amount, Trans_Type, Description, Date, Category]);
        
        const actionMessage = `Created new transaction: "${Description}" for $${Amount}.`;
        await logAction(adminId, actionMessage);

        return NextResponse.json({ message: 'Transaction created successfully!' }, { status: 201 });

    } catch (error) {
        console.error('DATABASE_ERROR (POST transaction):', error);
        return NextResponse.json({ message: 'Failed to create transaction.' }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}

