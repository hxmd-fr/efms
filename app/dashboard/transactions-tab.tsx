"use client";

import { useState, useEffect, FormEvent, FC, useCallback } from 'react';
import { PlusCircle, Loader2, AlertTriangle, X, Pencil, Trash2, Filter } from 'lucide-react';

// --- (Verified) Typescript Interfaces ---
interface CurrentUser { userId: number; name: string; role: 'Admin' | 'Manager' | 'Employee'; }
interface DropdownUser { User_ID: number; Name: string; }
interface Account { Account_ID: number; Account_Type: string; }
interface Transaction { Trans_ID: number; Amount: string; Trans_Type: 'Debit' | 'Credit'; Date: string; Description: string; UserName: string; AccountType: string; User_ID: number; Account_ID: number; Category?: string; }

// --- TransactionModal Component ---
const TransactionModal: FC<{
    transactionToEdit: Transaction | null;
    onClose: () => void;
    onTransactionAdded: () => void;
    currentUser: CurrentUser;
}> = ({ transactionToEdit, onClose, onTransactionAdded, currentUser }) => {
    const isEditing = transactionToEdit !== null;
    const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
    const [users, setUsers] = useState<DropdownUser[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [formData, setFormData] = useState({
        User_ID: isEditing ? transactionToEdit.User_ID.toString() : '',
        Account_ID: isEditing ? transactionToEdit.Account_ID.toString() : '',
        Amount: isEditing ? transactionToEdit.Amount : '',
        Trans_Type: isEditing ? transactionToEdit.Trans_Type : 'Debit',
        Description: isEditing ? transactionToEdit.Description : '',
        Date: isEditing ? getFormattedDate(new Date(transactionToEdit.Date)) : getFormattedDate(new Date()),
        Category: isEditing ? (transactionToEdit.Category || '') : '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchDropdownData() {
            try {
                const [usersRes, accountsRes] = await Promise.all([fetch('/api/users'), fetch('/api/accounts')]);
                if (!usersRes.ok || !accountsRes.ok) throw new Error('Failed to fetch dropdown data');
                setUsers(await usersRes.json());
                setAccounts(await accountsRes.json());
            } catch (err) { setError(err instanceof Error ? err.message : 'Could not load required data'); }
        }
        fetchDropdownData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        const url = isEditing ? `/api/transactions/${transactionToEdit!.Trans_ID}` : '/api/transactions';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const selectedAccount = accounts.find(acc => acc.Account_ID === parseInt(formData.Account_ID));
            const body = {
                ...formData,
                User_ID: parseInt(formData.User_ID),
                Account_ID: parseInt(formData.Account_ID),
                Amount: parseFloat(formData.Amount),
                role: currentUser.role,
                adminId: currentUser.userId,
                Category: selectedAccount?.Account_Type === 'Expense' ? formData.Category : null
            };
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Request failed'); }
            onTransactionAdded();
            onClose();
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setIsSubmitting(false); }
    };

    const selectedAccount = accounts.find(acc => acc.Account_ID === parseInt(formData.Account_ID));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in my-8">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{transactionToEdit ? 'Edit' : 'Add New'} Transaction</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="user-select" className="block text-sm font-medium">User</label><select id="user-select" name="User_ID" value={formData.User_ID} onChange={handleChange} required className="w-full p-3 border rounded-lg bg-white"><option value="" disabled>Select User</option>{users.map(u => <option key={u.User_ID} value={u.User_ID}>{u.Name}</option>)}</select></div>
                    <div><label htmlFor="account-select" className="block text-sm font-medium">Account</label><select id="account-select" name="Account_ID" value={formData.Account_ID} onChange={handleChange} required className="w-full p-3 border rounded-lg bg-white"><option value="" disabled>Select Account</option>{accounts.map(a => <option key={a.Account_ID} value={a.Account_ID}>{a.Account_Type}</option>)}</select></div>
                    {selectedAccount?.Account_Type === 'Expense' && (
                        <div><label htmlFor="category-select" className="block text-sm font-medium">Expense Category</label><select id="category-select" name="Category" value={formData.Category} onChange={handleChange} required className="w-full p-3 border rounded-lg bg-white mt-1"><option value="" disabled>Select a category</option><option>Office Supplies</option><option>Travel</option><option>Software</option><option>Marketing</option><option>Utilities</option><option>Other</option></select></div>
                    )}
                    <div className="flex gap-4"><div className="w-1/2"><label htmlFor="amount-input" className="block text-sm font-medium">Amount</label><input id="amount-input" type="number" name="Amount" placeholder="0.00" value={formData.Amount} onChange={handleChange} required className="w-full p-3 border rounded-lg" step="0.01" /></div><div className="w-1/2"><label htmlFor="type-select" className="block text-sm font-medium">Type</label><select id="type-select" name="Trans_Type" value={formData.Trans_Type} onChange={handleChange} required className="w-full p-3 border rounded-lg bg-white"><option>Debit</option><option>Credit</option></select></div></div>
                    <div><label htmlFor="date-input" className="block text-sm font-medium">Date</label><input id="date-input" type="date" name="Date" value={formData.Date} onChange={handleChange} required className="w-full p-3 border rounded-lg bg-white" /></div>
                    <div><label htmlFor="description-textarea" className="block text-sm font-medium">Description</label><textarea id="description-textarea" name="Description" placeholder="e.g., Office supply purchase" value={formData.Description} onChange={handleChange} required className="w-full p-3 border rounded-lg h-24" /></div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4"><button type="button" onClick={onClose} className="px-6 py-2 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200">Cancel</button><button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center">{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}{isSubmitting ? 'Saving...' : 'Save'}</button></div>
                </form>
            </div>
        </div>
    );
};

const ConfirmDeleteModal: FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in"><h2 className="text-xl font-bold">Are you sure?</h2><p className="text-gray-600 mt-2 mb-6">This will permanently delete the transaction.</p><div className="flex justify-end gap-4"><button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg font-semibold bg-gray-100">Cancel</button><button type="button" onClick={onConfirm} className="px-6 py-2 rounded-lg font-semibold text-white bg-red-600">Delete</button></div></div></div> );

const AccountTypeTag: FC<{ type: string }> = ({ type }) => {
    const styleMap: { [key: string]: string } = { 'Expense': 'bg-red-100 text-red-700', 'Revenue': 'bg-green-100 text-green-700', 'Asset': 'bg-blue-100 text-blue-700', 'Liability': 'bg-orange-100 text-orange-700', 'Equity': 'bg-purple-100 text-purple-700', };
    return ( <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styleMap[type] || 'bg-gray-100 text-gray-700'}`}>{type}</span> );
};

// --- Main TransactionsTab Component ---
export default function TransactionsTab({ currentUser }: { currentUser: CurrentUser }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({ search: '', userId: '', accountType: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<DropdownUser[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [modalState, setModalState] = useState<{ mode: 'closed' | 'add' | 'edit' | 'delete'; data?: any }>({ mode: 'closed' });

  useEffect(() => {
    async function fetchFilterData() {
        try {
            const [usersRes, accountsRes] = await Promise.all([fetch('/api/users'), fetch('/api/accounts')]);
            if (!usersRes.ok || !accountsRes.ok) throw new Error('Failed to fetch filter options');
            setUsers(await usersRes.json());
            setAccounts(await accountsRes.json());
        } catch (err) { console.error("Filter data fetch error:", err); }
    }
    fetchFilterData();
  }, []);

  const fetchTransactions = useCallback(async (currentFilters: typeof filters) => {
    try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.userId) params.append('userId', currentFilters.userId);
        if (currentFilters.accountType) params.append('accountType', currentFilters.accountType);

        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        setTransactions(await response.json());
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions({ search: '', userId: '', accountType: '' });
  }, [fetchTransactions]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilters = () => { fetchTransactions(filters); };

  const clearFilters = () => {
    const clearedFilters = { search: '', userId: '', accountType: '' };
    setFilters(clearedFilters);
    fetchTransactions(clearedFilters);
  };

  const handleDelete = async () => { if (modalState.mode !== 'delete' || typeof modalState.data !== 'number') return; try { const res = await fetch(`/api/transactions/${modalState.data}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: currentUser.role, adminId: currentUser.userId }) }); if (!res.ok) { const errData = await res.json(); throw new Error(errData.message || 'Failed to delete'); } setModalState({ mode: 'closed' }); fetchTransactions(filters); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); setModalState({ mode: 'closed' }); } };

  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg font-semibold hover:bg-gray-50 text-gray-700">
                    <Filter className="w-5 h-5" /> Filter
                </button>
                <button onClick={() => setModalState({ mode: 'add' })} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                    <PlusCircle className="w-5 h-5" /> Add Transaction
                </button>
            </div>
        </div>
        
        {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border flex flex-wrap items-end gap-4 animate-fade-in">
                <div className="flex-grow min-w-[200px]"><label htmlFor="search-filter" className="text-sm font-medium text-gray-600">Description</label><input id="search-filter" name="search" value={filters.search} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-1" placeholder="Search..." /></div>
                <div className="flex-grow min-w-[150px]"><label htmlFor="user-filter" className="text-sm font-medium text-gray-600">User</label><select id="user-filter" name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-1 bg-white"><option value="">All Users</option>{users.map(u => <option key={u.User_ID} value={u.User_ID}>{u.Name}</option>)}</select></div>
                <div className="flex-grow min-w-[150px]"><label htmlFor="account-filter" className="text-sm font-medium text-gray-600">Account Type</label><select id="account-filter" name="accountType" value={filters.accountType} onChange={handleFilterChange} className="w-full p-2 border rounded-md mt-1 bg-white"><option value="">All Types</option>{accounts.map(a => <option key={a.Account_ID} value={a.Account_Type}>{a.Account_Type}</option>)}</select></div>
                <button onClick={applyFilters} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700">Apply</button>
                <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300">Clear</button>
            </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
            {loading ? ( <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div> ) : (
                <table className="w-full text-left">
                    <thead className="border-b-2"><tr><th className="p-4">Date</th><th className="p-4">Description</th><th className="p-4">User</th><th className="p-4">Account</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody>
                        {transactions.length > 0 ? transactions.map(t => (
                            <tr key={t.Trans_ID} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4">{new Date(t.Date).toLocaleDateString()}</td>
                                <td className="p-4 font-medium">{t.Description}</td>
                                <td className="p-4">{t.UserName}</td>
                                <td className="p-4"><AccountTypeTag type={t.AccountType} /></td>
                                <td className={`p-4 text-right font-semibold ${t.Trans_Type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>{t.Trans_Type === 'Credit' ? '+' : '-'}Rs. {parseFloat(t.Amount).toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && ( <button onClick={() => setModalState({ mode: 'edit', data: t })} className="p-2 text-blue-600 hover:text-blue-800"><Pencil className="w-5 h-5" /></button> )}
                                    {currentUser.role === 'Admin' && ( <button onClick={() => setModalState({ mode: 'delete', data: t.Trans_ID })} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button> )}
                                </td>
                            </tr>
                        )) : ( <tr><td colSpan={6} className="text-center py-12 text-gray-500"><h3 className="text-lg font-medium">No Transactions Found</h3><p>Try adjusting your filters or add a new transaction.</p></td></tr> )}
                    </tbody>
                </table>
            )}
        </div>
        
        {(modalState.mode === 'add' || modalState.mode === 'edit') && <TransactionModal transactionToEdit={modalState.mode === 'edit' ? modalState.data as Transaction : null} currentUser={currentUser} onClose={() => setModalState({ mode: 'closed' })} onTransactionAdded={() => fetchTransactions(filters)} />}
        {modalState.mode === 'delete' && <ConfirmDeleteModal onConfirm={handleDelete} onCancel={() => setModalState({ mode: 'closed' })} />}
    </div>
  );
}

