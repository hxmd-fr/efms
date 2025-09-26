"use client";

import { useState, useEffect, FC } from 'react';
import { Loader2, AlertTriangle, ShieldX } from 'lucide-react';

// --- Typescript Interface for a Log Entry ---
interface AuditLog {
  Log_ID: number;
  Action: string;
  Timestamp: string;
  UserName: string | null; // UserName can be null if the user was deleted
  UserEmail: string | null;
}

// --- Main Audit Log Tab Component ---
const AuditLogTab: FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/audit-log');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch audit log.');
        }
        setLogs(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-500" />
        <span>Loading secure audit trail...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md">
        <div className="flex">
          <ShieldX className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <p className="font-bold">Access Denied or Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">System Audit Log</h2>
        <p className="text-sm text-gray-500 mb-6">Showing the last 100 system events. This log is read-only.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-gray-100">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.Log_ID} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(log.Timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {log.UserName || <span className="text-gray-400 italic">User Deleted</span>}
                    <br />
                    <span className="text-xs text-gray-500">{log.UserEmail}</span>
                  </td>
                  <td className="p-4 text-gray-700">{log.Action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTab;
