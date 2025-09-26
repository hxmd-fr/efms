import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// --- DATABASE CONNECTION CONFIGURATION ---
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

    // --- DATA FETCHING QUERIES ---

    const [employeeRows]: [any[], any] = await connection.execute(
      "SELECT COUNT(*) as totalEmployees FROM Employees"
    );
    const totalEmployees = employeeRows[0].totalEmployees || 0;

    const [employeeChangeRows]: [any[], any] = await connection.execute(
      "SELECT COUNT(*) as newHires FROM Employees WHERE Join_Date >= DATE_FORMAT(NOW(), '%Y-%m-01')"
    );
    const employeeChange = employeeChangeRows[0].newHires || 0;
    
    const [expenseRows]: [any[], any] = await connection.execute(
      "SELECT month_expense FROM v_monthly_expense WHERE month_start = DATE_FORMAT(NOW(), '%Y-%m-01')"
    );
    // FIX: Convert the string from the DB to a number using parseFloat()
    const monthlyExpenses = parseFloat(expenseRows[0]?.month_expense) || 0;

    const [lastMonthExpenseRows]: [any[], any] = await connection.execute(
      "SELECT month_expense FROM v_monthly_expense WHERE month_start = DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')"
    );
    // FIX: Convert this value to a number as well for the calculation
    const lastMonthExpenses = parseFloat(lastMonthExpenseRows[0]?.month_expense) || 0;

    const [budgetRows]: [any[], any] = await connection.execute(
        "SELECT SUM(Spent_Amount) as totalSpent, SUM(Allocated_Amount) as totalAllocated FROM Budget"
    );
    let budgetUtilization = 0;
    if (budgetRows[0] && budgetRows[0].totalAllocated > 0) {
        // FIX: Convert budget values to numbers before division
        const totalSpent = parseFloat(budgetRows[0].totalSpent);
        const totalAllocated = parseFloat(budgetRows[0].totalAllocated);
        budgetUtilization = (totalSpent / totalAllocated) * 100;
    }

    let expenseChangePercentage = 0;
    if (lastMonthExpenses > 0) {
      expenseChangePercentage = ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    } else if (monthlyExpenses > 0) {
      expenseChangePercentage = 100;
    }

    // --- SUCCESS RESPONSE ---
    // Now that all variables are numbers, .toFixed() will work correctly.
    return NextResponse.json({
      totalEmployees,
      employeeChange,
      monthlyExpenses: monthlyExpenses.toFixed(2),
      expenseChangePercentage: expenseChangePercentage.toFixed(1),
      budgetUtilization: budgetUtilization.toFixed(0),
    });

  } catch (error) {
    console.error('DATABASE_ERROR:', error);
    return NextResponse.json(
      { message: 'Failed to connect or query the database.' }, 
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

