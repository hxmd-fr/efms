import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// --- GET Method: Fetches EXISTING unresolved alerts ---
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT 
        fa.Alert_ID, fa.User_ID, u.Name as UserName, fa.details
      FROM Fraud_Alerts fa
      JOIN Users u ON fa.User_ID = u.User_ID
      WHERE fa.is_resolved = 0
      ORDER BY fa.created_at DESC;
    `;
    const [unresolvedAlerts] = await connection.execute(query);
    
    const results = (unresolvedAlerts as any[]).map(alert => {
        const details = alert.details; // mysql2 auto-parses JSON
        return {
            Alert_ID: alert.Alert_ID, User_ID: alert.User_ID, UserName: alert.UserName,
            day: details.day, spend: details.spend, mu: details.average, z_score: details.z_score,
        }
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error('DATABASE_ERROR (GET alerts):', error);
    return NextResponse.json({ message: 'Failed to fetch fraud alerts.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// --- POST Method: Runs the check and CREATES new alerts ---
export async function POST() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const zScoreQuery = `
        WITH daily AS ( SELECT t.User_ID, u.Name AS UserName, DATE(t.Date) AS day, SUM(t.Amount) AS spend FROM Transactions t JOIN Accounts a ON t.Account_ID = a.Account_ID JOIN Users u ON t.User_ID = u.User_ID WHERE a.Account_Type = 'Expense' AND t.Trans_Type = 'Debit' GROUP BY t.User_ID, u.Name, DATE(t.Date) ), stats AS ( SELECT User_ID, AVG(spend) AS mu, STDDEV_POP(spend) AS sigma FROM daily GROUP BY User_ID ) SELECT d.UserName, d.User_ID, d.day, d.spend, s.mu, s.sigma, CASE WHEN s.sigma = 0 THEN 0 ELSE (d.spend - s.mu) / s.sigma END AS z_score FROM daily d JOIN stats s ON d.User_ID = s.User_ID WHERE (s.sigma > 0 AND ABS((d.spend - s.mu) / s.sigma) >= 3) OR (s.sigma = 0 AND d.spend > 0 AND s.mu > 0);
    `;
    const [potentialAlerts]: [any[], any] = await connection.execute(zScoreQuery);
    
    let newAlertsCount = 0;
    for (const alert of potentialAlerts) {
      const { User_ID, day, spend, mu, z_score } = alert;
      const checkQuery = `SELECT Alert_ID FROM Fraud_Alerts WHERE User_ID = ? AND JSON_EXTRACT(details, '$.day') = ? AND is_resolved = 0`;
      const [existing] : [any[], any] = await connection.execute(checkQuery, [User_ID, day]);
      
      if (existing.length === 0) {
        newAlertsCount++;
        const insertQuery = `INSERT INTO Fraud_Alerts (User_ID, alert_type, details, created_at, is_resolved) VALUES (?, ?, ?, ?, 0);`;
        const details = JSON.stringify({ day, spend, average: mu, z_score });
        await connection.execute(insertQuery, [User_ID, 'z_score_anomaly', details, day]);
      }
    }
    return NextResponse.json({ message: 'Fraud check complete.', newAlertsFound: newAlertsCount });
  } catch (error) {
    console.error('DATABASE_ERROR (POST alerts):', error);
    return NextResponse.json({ message: 'Failed to run fraud check.' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

