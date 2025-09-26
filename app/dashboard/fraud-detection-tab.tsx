"use client";

import { useState, useEffect, FC } from 'react';
import { Loader2, AlertTriangle, ShieldCheck, X, Zap } from 'lucide-react';

// --- (Verified) Typescript Interfaces ---
interface User {
  userId: number;
  name: string;
  role: 'Admin' | 'Manager' | 'Employee';
}

interface FraudAlert {
  Alert_ID: number;
  UserName: string;
  User_ID: number;
  day: string;
  spend: string;
  mu: string;
  z_score: string;
}

interface TransactionDetail {
    Trans_ID: number;
    Description: string;
    Amount: string;
    Date: string;
}

// --- Review Alert Modal Component ---
const ReviewAlertModal: FC<{
    alert: FraudAlert;
    onClose: () => void;
    onMarkLegitimate: (alertId: number) => Promise<void>;
}> = ({ alert, onClose, onMarkLegitimate }) => {
    const [details, setDetails] = useState<TransactionDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            try {
                const response = await fetch(`/api/daily-transactions?userId=${alert.User_ID}&day=${alert.day}`);
                if (!response.ok) throw new Error('Failed to fetch transaction details.');
                setDetails(await response.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [alert]);

    const handleMarkLegitimate = async () => {
        await onMarkLegitimate(alert.Alert_ID);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in my-8">
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Reviewing Activity</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X/></button></div>
                <div className="mb-6 border-b pb-4"><p>User: <strong className="font-semibold text-indigo-600">{alert.UserName}</strong></p><p>Date: <strong className="font-semibold">{new Date(alert.day).toLocaleDateString()}</strong></p><p>Spent: <strong className="font-semibold text-red-600">${parseFloat(alert.spend).toLocaleString()}</strong> (Avg: ${parseFloat(alert.mu).toLocaleString()})</p></div>
                <h3 className="text-lg font-semibold mb-3">Transactions:</h3>
                {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>}
                {error && <div className="text-red-600 p-3">{error}</div>}
                {!loading && !error && ( <div className="space-y-2 max-h-60 overflow-y-auto pr-2">{details.length > 0 ? details.map(t => ( <div key={t.Trans_ID} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"><div><p className="font-medium">{t.Description}</p><p className="text-xs text-gray-500">{new Date(t.Date).toLocaleTimeString()}</p></div><p className="font-semibold">-${parseFloat(t.Amount).toLocaleString()}</p></div> )) : <p>No details found.</p>}</div> )}
                <div className="mt-8 flex justify-end gap-4"><button type="button" onClick={onClose} className="px-6 py-2 rounded-lg font-semibold bg-gray-100">Cancel</button><button type="button" onClick={handleMarkLegitimate} className="px-6 py-2 rounded-lg font-semibold text-white bg-green-600">Mark as Legitimate</button></div>
            </div>
        </div>
    );
};


// --- Main Fraud Detection Tab Component ---
const FraudDetectionTab: FC<{ currentUser: User }> = ({ currentUser }) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingAlert, setReviewingAlert] = useState<FraudAlert | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchAlerts = async () => {
      try { setLoading(true); setError(null); const response = await fetch('/api/fraud-alerts'); if (!response.ok) throw new Error('Failed to fetch data'); setAlerts(await response.json()); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAlerts(); }, []);

  const handleRunCheck = async () => {
    setIsChecking(true);
    setError(null);
    try {
        const response = await fetch('/api/fraud-alerts', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to run fraud check.');
        await fetchAlerts();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during the check.');
    } finally {
        setIsChecking(false);
    }
  };

  const handleMarkLegitimate = async (alertId: number) => {
    try {
      const response = await fetch(`/api/fraud-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser.role, adminId: currentUser.userId }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Suspicious Activity Report</h2>
            {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                <button
                    onClick={handleRunCheck}
                    disabled={isChecking || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                >
                    {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {isChecking ? 'Analyzing...' : 'Run Fraud Check'}
                </button>
            )}
        </div>
        
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg my-4">{error}</div>}
        
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><ShieldCheck className="w-16 h-16 mx-auto text-green-500 mb-4" /><h3 className="text-xl font-semibold">No Unresolved Anomalies</h3><p>Click "Run Fraud Check" to analyze recent transactions for suspicious patterns.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2">
                <tr><th className="p-4">Date</th><th className="p-4">User</th><th className="p-4 text-right">Spending</th><th className="p-4 text-right">Average</th><th className="p-4 text-right">Z-Score</th><th className="p-4 text-center">Actions</th></tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.Alert_ID} className="border-b last:border-0 hover:bg-yellow-50">
                    <td className="p-4">{new Date(alert.day).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{alert.UserName}</td>
                    <td className="p-4 text-right font-semibold text-red-600">${parseFloat(alert.spend).toLocaleString()}</td>
                    <td className="p-4 text-right">${parseFloat(alert.mu).toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-orange-500">{parseFloat(alert.z_score).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                        <button onClick={() => setReviewingAlert(alert)} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 font-semibold">Review</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {reviewingAlert && <ReviewAlertModal alert={reviewingAlert} onClose={() => setReviewingAlert(null)} onMarkLegitimate={handleMarkLegitimate} />}
    </div>
  );
};

export default FraudDetectionTab;

