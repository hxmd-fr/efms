"use client";

import { useState, useEffect, FC, FormEvent } from 'react';
import { Loader2, AlertTriangle, X, PlusCircle, CheckCircle } from 'lucide-react';

// --- Typescript Interfaces ---
interface Vendor { Vendor_ID: number; Name: string; Contact_Info?: string; }
interface Invoice { Invoice_ID: number; Amount: string; Due_Date: string; Status: 'Paid' | 'Unpaid'; Payment_Date: string | null; VendorName: string; }

// --- Add Vendor Modal ---
const AddVendorModal: FC<{
    onClose: () => void;
    onVendorAdded: (newVendor: Vendor) => void;
}> = ({ onClose, onVendorAdded }) => {
    const [formData, setFormData] = useState({ Name: '', Contact_Info: '' });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        try {
            const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message); }
            const newVendor: Vendor = await res.json();
            onVendorAdded(newVendor); // Pass the new vendor back to the parent
            onClose();
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Add New Vendor</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X /></button></div>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label htmlFor="vendor-name" className="block text-sm font-medium text-gray-600 mb-1">Vendor Name</label><input id="vendor-name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required className="w-full p-2 border rounded-md mt-1"/></div>
                    <div><label htmlFor="vendor-contact" className="block text-sm font-medium text-gray-600 mb-1">Contact Info (Email/Phone)</label><input id="vendor-contact" value={formData.Contact_Info} onChange={e => setFormData({...formData, Contact_Info: e.target.value})} required className="w-full p-2 border rounded-md mt-1"/></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md font-semibold">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold">{isSubmitting ? 'Saving...' : 'Save Vendor'}</button></div>
                </form>
            </div>
        </div>
    );
};


// --- Add Invoice Modal (Upgraded) ---
const AddInvoiceModal: FC<{ onClose: () => void; onInvoiceAdded: () => void; }> = ({ onClose, onInvoiceAdded }) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [formData, setFormData] = useState({ Vendor_ID: '', Amount: '', Due_Date: '' });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddVendor, setShowAddVendor] = useState(false); // State for the new modal

    useEffect(() => { async function fetchVendors() { try { const res = await fetch('/api/vendors'); if (!res.ok) throw new Error('Failed to fetch vendors'); setVendors(await res.json()); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load vendors'); } } fetchVendors(); }, []);

    const handleVendorAdded = (newVendor: Vendor) => {
        setVendors(prev => [...prev, newVendor].sort((a, b) => a.Name.localeCompare(b.Name))); // Add new vendor and keep list sorted
        setFormData(prev => ({...prev, Vendor_ID: newVendor.Vendor_ID.toString()})); // Auto-select the new vendor
        setShowAddVendor(false); // Close the vendor modal
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); setError(null);
        try {
            const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, Amount: parseFloat(formData.Amount) }) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message); }
            onInvoiceAdded();
            onClose();
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in my-8">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Add New Invoice</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X /></button></div>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="vendor-select" className="block text-sm font-medium text-gray-600 mb-1">Vendor</label>
                        <div className="flex items-center gap-2">
                            <select id="vendor-select" value={formData.Vendor_ID} onChange={e => setFormData({...formData, Vendor_ID: e.target.value})} required className="flex-grow p-2 border rounded-md bg-white">
                                <option value="" disabled>Select a vendor</option>
                                {vendors.map(v => <option key={v.Vendor_ID} value={v.Vendor_ID}>{v.Name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowAddVendor(true)} className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md font-semibold hover:bg-indigo-200 whitespace-nowrap">+ New Vendor</button>
                        </div>
                    </div>
                    <div><label htmlFor="amount" className="block text-sm font-medium text-gray-600 mb-1">Amount</label><input id="amount" type="number" step="0.01" value={formData.Amount} onChange={e => setFormData({...formData, Amount: e.target.value})} required className="w-full p-2 border rounded-md"/></div>
                    <div><label htmlFor="due-date" className="block text-sm font-medium text-gray-600 mb-1">Due Date</label><input id="due-date" type="date" value={formData.Due_Date} onChange={e => setFormData({...formData, Due_Date: e.target.value})} required className="w-full p-2 border rounded-md"/></div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md font-semibold">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold">{isSubmitting ? 'Saving...' : 'Save Invoice'}</button>
                    </div>
                </form>
            </div>
            {/* Render the AddVendorModal on top of the AddInvoiceModal */}
            {showAddVendor && <AddVendorModal onClose={() => setShowAddVendor(false)} onVendorAdded={handleVendorAdded} />}
        </div>
    );
};

// --- Main Invoices Tab Component ---
const InvoicesTab: FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchInvoices = async () => { try { setLoading(true); setError(null); const res = await fetch('/api/invoices'); if (!res.ok) throw new Error('Failed to fetch invoices'); setInvoices(await res.json()); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setLoading(false); } };
  useEffect(() => { fetchInvoices(); }, []);

  const handleMarkAsPaid = async (invoiceId: number) => {
      try {
          const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'PUT' });
          if (!res.ok) throw new Error('Failed to update invoice');
          fetchInvoices(); // Refresh the list
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
      }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>;
  if (error) return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;

  return (
    <div className="animate-fade-in">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Invoice Management</h2>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                    <PlusCircle className="w-5 h-5" /> Add New Invoice
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2"><tr><th className="p-4">Vendor</th><th className="p-4">Amount</th><th className="p-4">Due Date</th><th className="p-4">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.Invoice_ID} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{invoice.VendorName}</td>
                                <td className="p-4 text-gray-800">Rs. {parseFloat(invoice.Amount).toLocaleString()}</td>
                                <td className="p-4 text-gray-600">{new Date(invoice.Due_Date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.Status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {invoice.Status}
                                    </span>
                                </td>
                                
                                <td className="p-4 text-center">
                                    {invoice.Status === 'Unpaid' && (
                                        <button onClick={() => handleMarkAsPaid(invoice.Invoice_ID)} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 font-semibold flex items-center gap-1 mx-auto">
                                            <CheckCircle className="w-4 h-4"/> Mark as Paid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {showAddModal && <AddInvoiceModal onClose={() => setShowAddModal(false)} onInvoiceAdded={fetchInvoices} />}
    </div>
  );
};

export default InvoicesTab;

