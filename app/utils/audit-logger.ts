import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'financedb',
};

// This helper function connects to the DB and inserts a new log entry.
export async function logAction(userId: number, action: string) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO Audit_Log (User_ID, Action) VALUES (?, ?);`;
    await connection.execute(query, [userId, action]);
  } catch (error) {
    // We log the error but don't stop the main API from succeeding.
    // A failed audit log should not break the user's main action.
    console.error('AUDIT_LOG_ERROR:', error);
  } finally {
    if (connection) await connection.end();
  }
}
