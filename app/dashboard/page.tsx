"use client";

import { useState, useEffect, FC } from 'react';
import { useRouter } from 'next/navigation';
// Import the correct User type and UserProvider from your context file
import { UserProvider, useUser, User } from './user-context'; 
import TransactionsTab from './transactions-tab';
import FraudDetectionTab from './fraud-detection-tab';
import PredictionTab from './prediction-tab';
import SettingsTab from './settings-tab';
import AuditLogTab from './audit-log-tab';
import InvoicesTab from './invoices-tab';
import {
  Users, DollarSign, Target, ShieldAlert, LayoutGrid, Settings, LogOut, BarChart2, Loader2, AlertTriangle, Receipt, UserCircle, History, PieChart as PieIcon, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';


// --- (Verified) Typescript Interfaces ---
interface DashboardData { totalEmployees: number; employeeChange: number; monthlyExpenses: string; expenseChangePercentage: string; budgetUtilization: string; }
interface PieChartDataPoint { name: string; value: string; }
interface BarChartDataPoint { name: string; Expenses: string; }
interface ChartData { pieChartData: PieChartDataPoint[]; barChartData: BarChartDataPoint[]; }
// The main 'User' interface is now imported from user-context.tsx

// --- Reusable Components (Self-contained for clarity and stability) ---
const StatCard: FC<{ icon: LucideIcon; title: string; value: string; change?: string; colorClass: string; }> = ({ icon: Icon, title, value, change, colorClass }) => {
    const isPositive = change && parseFloat(change) >= 0;
    return ( <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform transition-transform hover:-translate-y-1"><div className="flex items-start justify-between"><div className={`p-3 rounded-xl bg-opacity-10 ${colorClass}`}><Icon className={`w-7 h-7 ${colorClass}`} /></div>{change && <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}</span>}</div><p className="text-gray-500 mt-4 mb-1">{title}</p><p className="text-3xl font-bold text-gray-800">{value}</p></div> );
};
const TabButton: FC<{ text: string; icon: LucideIcon; active: boolean; onClick: () => void; }> = ({ text, icon: Icon, active, onClick }) => ( <button onClick={onClick} className={`flex items-center px-4 py-3 font-semibold text-base rounded-t-lg border-b-4 transition-all duration-300 ${active ? 'text-indigo-600 border-indigo-600 bg-white shadow-md' : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-indigo-500'}`}><Icon className="w-5 h-5 mr-2"/>{text}</button> );
const LoadingSpinner: FC = () => ( <div className="flex flex-col justify-center items-center h-64 text-gray-500"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /><p className="mt-4 text-lg">Loading...</p></div> );
const ErrorDisplay: FC<{ message: string }> = ({ message }) => ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg flex items-center shadow-md"><AlertTriangle className="w-8 h-8 mr-4" /><div><h3 className="font-bold text-lg">Failed to Load Data</h3><p>{message}</p></div></div> );

const Navbar: FC<{ onLogout: () => void; }> = ({ onLogout }) => {
  const { user } = useUser();
  return ( <header className="bg-slate-900 text-white shadow-md p-4 flex justify-between items-center"><div className="flex items-center"><LayoutGrid className="w-8 h-8 mr-3 text-indigo-400" /><h1 className="text-xl font-bold tracking-wider">EFMS</h1></div><div className="flex items-center space-x-6"><div className="flex items-center"><UserCircle className="w-5 h-5 mr-2 text-gray-400" /><span className="font-medium">{user.name} ({user.role})</span></div><button onClick={onLogout} className="flex items-center p-2 rounded-lg text-gray-300 hover:bg-indigo-700 hover:text-white" aria-label="Log Out"><LogOut className="w-5 h-5" /></button></div></header> );
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const PieChart: FC<{ data: PieChartDataPoint[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + Number(item.value), 0);
    if (total === 0) return <div className="text-center py-10 text-gray-500">No expense data to display.</div>;
    let startAngle = -90;
    return ( <div className="flex flex-col md:flex-row items-center justify-center gap-6"><svg width="200" height="200" viewBox="0 0 200 200">{data.map((item, index) => { const angle = (Number(item.value) / total) * 360; const largeArcFlag = angle > 180 ? 1 : 0; const x1 = 100 + 90 * Math.cos(startAngle * Math.PI / 180); const y1 = 100 + 90 * Math.sin(startAngle * Math.PI / 180); startAngle += angle; const x2 = 100 + 90 * Math.cos(startAngle * Math.PI / 180); const y2 = 100 + 90 * Math.sin(startAngle * Math.PI / 180); const pathData = `M100,100 L${x1},${y1} A90,90 0 ${largeArcFlag},1 ${x2},${y2} Z`; return <path key={index} d={pathData} fill={CHART_COLORS[index % CHART_COLORS.length]} />; })}</svg><div className="space-y-2 w-full md:w-auto">{data.map((item, index) => ( <div key={index} className="flex items-center text-sm justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div><span className="font-semibold text-gray-700">{item.name}</span></div><span className="ml-4 text-gray-500">{((Number(item.value) / total) * 100).toFixed(1)}%</span></div> ))}</div></div> );
};
const BarChart: FC<{ data: BarChartDataPoint[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => Number(d.Expenses)));
    if (maxValue === 0) return <div className="text-center py-10 text-gray-500">No spending data available.</div>;
    const chartHeight = 250;
    return ( <div className="w-full flex justify-around items-end pt-4" style={{ height: `${chartHeight}px` }}>{data.map((item, index) => ( <div key={index} className="flex flex-col items-center group relative"><div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rs. {Number(item.Expenses).toLocaleString()}</div><div className="rounded-t-md hover:opacity-90 transition-opacity w-10 md:w-12" style={{ height: `${(Number(item.Expenses) / maxValue) * (chartHeight - 40)}px`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div><div className="text-sm mt-2 font-medium text-gray-500 truncate w-16 text-center">{item.name}</div></div> ))}</div> );
};

// This is the inner component that renders all the content once the user is authenticated.
const DashboardPageContent: FC<{ onLogout: () => void; }> = ({ onLogout }) => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [statsData, setStatsData] = useState<DashboardData | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const titles: { [key: string]: string } = {
        dashboard: 'Dashboard Overview', transactions: 'Manage Transactions', invoices: 'Invoice Management',
        prediction: 'AI Expense Prediction', fraud: 'Fraud Detection Analysis',
        settings: 'User Management', audit: 'System Audit Log'
    };

    useEffect(() => {
        if (activeTab === 'dashboard') {
            async function fetchData() {
              try { setLoading(true); setError(null); const [statsRes, chartsRes] = await Promise.all([ fetch('/api/dashboard-stats'), fetch('/api/dashboard-charts') ]); if (!statsRes.ok || !chartsRes.ok) { const err = await statsRes.json(); throw new Error(err.message || 'API Error'); } setStatsData(await statsRes.json()); setChartData(await chartsRes.json()); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setLoading(false); }
            }
            fetchData();
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar onLogout={onLogout} />
            <main className="p-8">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-800">{titles[activeTab] || 'Dashboard'}</h1>
                    <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span>.</p>
                </header>
                <div className="flex border-b border-gray-200 flex-wrap">
                    <TabButton text="Dashboard" icon={LayoutGrid} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <TabButton text="Transactions" icon={Receipt} active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <TabButton text="Invoices" icon={FileText} active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} />
                    <TabButton text="AI Prediction" icon={BarChart2} active={activeTab === 'prediction'} onClick={() => setActiveTab('prediction')} />
                    {(user.role === 'Admin' || user.role === 'Manager') && (
                        <TabButton text="Fraud Detection" icon={ShieldAlert} active={activeTab === 'fraud'} onClick={() => setActiveTab('fraud')} />
                    )}
                    {user.role === 'Admin' && (
                        <>
                            <TabButton text="Settings" icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                            <TabButton text="Audit Log" icon={History} active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
                        </>
                    )}
                </div>
                <div className="mt-8">
                    {activeTab === 'dashboard' && ( loading ? <LoadingSpinner /> : error ? <ErrorDisplay message={error} /> : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {statsData && <StatCard icon={Users} title="Total Employees" value={statsData.totalEmployees.toString()} change={`+${statsData.employeeChange} this month`} colorClass="text-indigo-500" />}
                                {statsData && <StatCard icon={DollarSign} title="Monthly Expenses" value={`Rs. ${parseFloat(statsData.monthlyExpenses).toLocaleString()}`} change={`${statsData.expenseChangePercentage}% vs last month`} colorClass="text-red-500" />}
                                {statsData && <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform transition-transform hover:-translate-y-1"><div className="p-3 rounded-xl bg-opacity-10 text-green-500 w-fit"><Target className="w-7 h-7 text-green-500" /></div><p className="text-gray-500 mt-4 mb-2">Budget Utilization</p><div className="flex items-center"><p className="text-3xl font-bold text-gray-800 mr-3">{statsData.budgetUtilization}%</p><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${statsData.budgetUtilization}%` }}></div></div></div></div>}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"><h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><PieIcon className="w-6 h-6 mr-2 text-indigo-500"/>Expenses by Type</h3>{chartData && chartData.pieChartData ? <PieChart data={chartData.pieChartData} /> : <div className="text-center py-12 text-gray-500">No data.</div>}</div>
                                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"><h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><BarChart2 className="w-6 h-6 mr-2 text-indigo-500"/>Spending by User</h3>{chartData && chartData.barChartData ? <BarChart data={chartData.barChartData} /> : <div className="text-center py-12 text-gray-500">No data.</div>}</div>
                            </div>
                        </div>
                    ))}
                   {activeTab === 'transactions' && <TransactionsTab currentUser={user} />}
                   {activeTab === 'invoices' && <InvoicesTab />}
                   {activeTab === 'prediction' && <PredictionTab />}
                   {activeTab === 'fraud' && <FraudDetectionTab currentUser={user} />}
                   {activeTab === 'settings' && <SettingsTab currentUser={user} />}
                   {activeTab === 'audit' && <AuditLogTab />}
                </div>
            </main>
        </div>
    );
}

// This is the main component that handles authentication before rendering anything.
export default function DashboardPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchCurrentUser() {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) { throw new Error('Not authenticated'); }
                const userData: User = await response.json();
                setCurrentUser(userData);
            } catch (error) {
                router.push('/login');
            } finally {
                setAuthLoading(false);
            }
        }
        fetchCurrentUser();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (authLoading || !currentUser) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;
    }

    return (
        <UserProvider initialUser={currentUser}>
            <DashboardPageContent onLogout={handleLogout} />
        </UserProvider>
    );
}

