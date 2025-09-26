"use client";

import { useState, useEffect, FC, FormEvent } from 'react';
import { Loader2, AlertTriangle, X, Edit, PlusCircle, Trash2 } from 'lucide-react';

// --- Typescript Interfaces ---
interface CurrentUser { userId: number; name: string; role: 'Admin' | 'Manager' | 'Employee'; }
interface ManagedUser { User_ID: number; Name: string; Email: string; Role: 'Admin' | 'Manager' | 'Employee'; }

// --- Edit User Modal Component ---
const EditUserModal: FC<{
    userToEdit: ManagedUser;
    onClose: () => void;
    onUserUpdated: (updatedUser: ManagedUser) => void;
    currentUser: CurrentUser;
}> = ({ userToEdit, onClose, onUserUpdated, currentUser }) => {
    const [formData, setFormData] = useState({ Name: userToEdit.Name || '', Role: userToEdit.Role || 'Employee', Email: userToEdit.Email || '' });
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    const handleDetailsSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmittingDetails(true); setError(null); setSuccess(null);
        try {
            const res = await fetch(`/api/users/${userToEdit.User_ID}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Name: formData.Name, Role: formData.Role, Email: formData.Email, adminRole: currentUser.role })
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message); }
            setSuccess('User details updated successfully!');
            onUserUpdated({ ...userToEdit, ...formData });
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred');
        } finally { setIsSubmittingDetails(false); }
    };

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { setError('Password must be at least 6 characters long.'); return; }
        setIsSubmittingPassword(true); setError(null); setSuccess(null);
        try {
            const res = await fetch(`/api/users/${userToEdit.User_ID}/password`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword, adminRole: currentUser.role })
            });
            if (!res.ok) { const data = await res.json(); throw new Error(data.message); }
            setSuccess('Password updated successfully!');
            setNewPassword('');
        } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred');
        } finally { setIsSubmittingPassword(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit User: {userToEdit.Name}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors"><X className="w-6 h-6"/></button>
                </div>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleDetailsSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                            <input id="name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <input id="email" type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                            <select id="role" value={formData.Role} onChange={e => setFormData({...formData, Role: e.target.value as any})} className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                <option>Admin</option><option>Manager</option><option>Employee</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isSubmittingDetails || isSubmittingPassword} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                            {isSubmittingDetails && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                            {isSubmittingDetails ? 'Saving...' : 'Save Details'}
                        </button>
                    </form>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                         <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
                            <input id="password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Enter new password..."/>
                        </div>
                        <button type="submit" disabled={isSubmittingDetails || isSubmittingPassword} className="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors">
                            {isSubmittingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                            {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const AddUserModal: FC<{ onClose: () => void; onUserAdded: () => void; currentUser: CurrentUser; }> = ({ onClose, onUserAdded, currentUser }) => {
    const [formData, setFormData] = useState({ Name: '', Email: '', Password: '', Role: 'Employee' as 'Manager' | 'Employee' }); const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); setIsSubmitting(true); setError(null); try { const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, adminRole: currentUser.role }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.message); } onUserAdded(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setIsSubmitting(false); } };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto"><div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in my-8"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">Add New User</h2><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X /></button></div>{error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="add-name">Name</label><input id="add-name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} className="w-full p-2 border rounded-md mt-1"/></div><div><label htmlFor="add-email">Email</label><input id="add-email" type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full p-2 border rounded-md mt-1"/></div><div><label htmlFor="add-password">Password</label><input id="add-password" type="password" value={formData.Password} onChange={e => setFormData({...formData, Password: e.target.value})} className="w-full p-2 border rounded-md mt-1" placeholder="Min. 6 characters"/></div><div><label htmlFor="add-role">Role</label><select id="add-role" value={formData.Role} onChange={e => setFormData({...formData, Role: e.target.value as any})} className="w-full p-2 border rounded-md mt-1 bg-white"><option value="Employee">Employee</option><option value="Manager">Manager</option></select></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md font-semibold">Cancel</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold">{isSubmitting ? 'Creating...' : 'Create User'}</button></div></form></div></div> );
};

const ConfirmDeleteUserModal: FC<{ userToDelete: ManagedUser; onClose: () => void; onUserDeleted: () => void; currentUser: CurrentUser; }> = ({ userToDelete, onClose, onUserDeleted, currentUser }) => {
    const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
    const handleDelete = async () => { setIsSubmitting(true); setError(null); try { const res = await fetch(`/api/users/${userToDelete.User_ID}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminRole: currentUser.role, adminId: currentUser.userId }) }); if (!res.ok) { const data = await res.json(); throw new Error(data.message); } onUserDeleted(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setIsSubmitting(false); } };
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"><h2 className="text-2xl font-bold">Delete User</h2><p className="text-gray-600 mt-2 mb-6">Are you sure you want to permanently delete <strong className="font-semibold">{userToDelete.Name}</strong>?</p>{error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}<div className="flex justify-end gap-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md font-semibold">Cancel</button><button type="button" onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold">{isSubmitting ? 'Deleting...' : 'Delete User'}</button></div></div></div> );
};

// --- Main Settings Tab Component ---
const SettingsTab: FC<{ currentUser: CurrentUser }> = ({ currentUser }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => { try { setLoading(true); setError(null); const res = await fetch('/api/users'); if (!res.ok) throw new Error('Failed to fetch users'); setUsers(await res.json()); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);

  const handleUserUpdate = (updatedUser: ManagedUser) => { fetchUsers(); setEditingUser(updatedUser); };

  if (currentUser.role !== 'Admin') { return <div className="bg-white p-8 rounded-2xl shadow-lg"><h2 className="text-2xl font-bold">Access Denied</h2><p className="mt-2 text-gray-600">You must be an Admin to manage users.</p></div> }
  if (loading) { return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div>; }
  if (error) { return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>; }

  return (
    <div className="animate-fade-in">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                    <PlusCircle className="w-5 h-5" /> Add New User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.User_ID} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{user.Name}</td>
                                <td className="p-4 text-gray-600">{user.Email}</td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.Role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : user.Role === 'Manager' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{user.Role}</span></td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setEditingUser(user)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="Edit User"><Edit className="w-5 h-5"/></button>
                                    {currentUser.role === 'Admin' && user.User_ID !== currentUser.userId && (
                                        <button onClick={() => setDeletingUser(user)} className="p-2 text-red-600 hover:text-red-800" aria-label="Delete User"><Trash2 className="w-5 h-5"/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {editingUser && <EditUserModal userToEdit={editingUser} onClose={() => setEditingUser(null)} onUserUpdated={handleUserUpdate} currentUser={currentUser} />}
        {showAddUserModal && <AddUserModal onClose={() => setShowAddUserModal(false)} onUserAdded={fetchUsers} currentUser={currentUser} />}
        {deletingUser && <ConfirmDeleteUserModal userToDelete={deletingUser} onClose={() => setDeletingUser(null)} onUserDeleted={fetchUsers} currentUser={currentUser} />}
    </div>
  );
};

export default SettingsTab;

