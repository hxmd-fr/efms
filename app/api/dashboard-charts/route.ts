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
    // Check for database credentials to provide a clear error if they are missing
    if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        console.error("DATABASE_ERROR: Missing credentials in .env.local");
        return NextResponse.json({ message: 'Database credentials are not configured. Please restart the server.' }, { status: 500 });
    }
      
    connection = await mysql.createConnection(dbConfig);

    // --- Query 1: Get total expenses grouped by Category for the Pie Chart ---
    // This query is now updated to use the new 'Category' column for a more detailed breakdown.
    const pieChartQuery = `
      SELECT 
        t.Category as name, 
        SUM(t.Amount) as value
      FROM Transactions t
      JOIN Accounts a ON t.Account_ID = a.Account_ID
      WHERE 
        a.Account_Type = 'Expense' 
        AND t.Trans_Type = 'Debit' 
        AND t.Category IS NOT NULL 
        AND t.Category != ''
      GROUP BY t.Category
      ORDER BY value DESC;
    `;
    const [pieChartRows]: [any[], any] = await connection.execute(pieChartQuery);

    // --- Query 2: Get total expenses grouped by User for the Bar Chart ---
    // This query remains the same but is included for completeness.
    const barChartQuery = `
      SELECT 
        u.Name as name, 
        SUM(t.Amount) as Expenses
      FROM Transactions t
      JOIN Users u ON t.User_ID = u.User_ID
      JOIN Accounts a ON t.Account_ID = a.Account_ID
      WHERE a.Account_Type = 'Expense' AND t.Trans_Type = 'Debit'
      GROUP BY u.Name
      ORDER BY Expenses DESC;
    `;
    const [barChartRows]: [any[], any] = await connection.execute(barChartQuery);
    
    // Return both sets of data in a single, clean response
    return NextResponse.json({
        pieChartData: pieChartRows,
        barChartData: barChartRows,
    });

  } catch (error) {
    console.error('DATABASE_ERROR (Dashboard Charts):', error);
    return NextResponse.json({ message: 'Failed to fetch chart data.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

