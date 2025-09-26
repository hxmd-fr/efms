import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Helper function to perform linear regression calculation
function calculateLinearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: n === 1 ? data[0].y : 0 };
  const sumX = data.reduce((acc, point) => acc + point.x, 0);
  const sumY = data.reduce((acc, point) => acc + point.y, 0);
  const sumXY = data.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = data.reduce((acc, point) => acc + point.x * point.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

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
    const query = `SELECT month_start, month_expense FROM v_monthly_expense WHERE month_start < CURDATE() ORDER BY month_start ASC LIMIT 12;`;
    const [rows]: [any[], any] = await connection.execute(query);

    const historicalData = rows.map(row => ({
        name: new Date(row.month_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Expenses: parseFloat(row.month_expense)
    }));

    const regressionData = historicalData.map((point, index) => ({ x: index, y: point.Expenses }));
    const { slope, intercept } = calculateLinearRegression(regressionData);

    const forecastData = [];
    // Use the last historical date as the starting point for the forecast
    const lastHistoricalDate = rows.length > 0 ? new Date(rows[rows.length - 1].month_start) : new Date();

    // --- THIS IS THE FIX ---
    // This new loop correctly calculates the next three distinct months.
    for (let i = 1; i <= 3; i++) {
        const nextIndex = historicalData.length + i - 1;
        const predictedExpense = slope * nextIndex + intercept;
        
        // Create a new date for each iteration to avoid mutation bugs
        const nextMonthDate = new Date(lastHistoricalDate);
        nextMonthDate.setMonth(lastHistoricalDate.getMonth() + i);
        
        const nextMonthName = nextMonthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        forecastData.push({
            name: nextMonthName,
            'Predicted Expenses': Math.max(0, parseFloat(predictedExpense.toFixed(2))),
            'Prediction Range': [
                Math.max(0, parseFloat((predictedExpense * 0.85).toFixed(2))),
                parseFloat((predictedExpense * 1.15).toFixed(2))
            ]
        });
    }

    const allValues = [ ...historicalData.map(d => d.Expenses), ...forecastData.map(d => d['Prediction Range'][1]) ];
    const maxValue = Math.max(0, ...allValues);

    return NextResponse.json({
        historicalData,
        forecastData,
        maxValue: Math.ceil(maxValue / 1000) * 1000
    });

  } catch (error) {
    console.error('DATABASE_ERROR (Forecast):', error);
    return NextResponse.json({ message: 'Failed to generate forecast.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

