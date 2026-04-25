import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function ConvertedLeads() {
  const { leads, interns, fetchAllData } = useAppContext();
  
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({ planValue: '', duration: '' });

  // Filter only "Converted" leads
  const convertedLeads = leads.filter(lead => lead.status === 'Converted');

  const openEdit = (lead) => {
    setEditingLead(lead);
    setEditForm({ planValue: lead.planValue || '', duration: lead.duration || '' });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.editLead(editingLead.id, {
        name: editingLead.clientName,
        contact: editingLead.phone,
        email: editingLead.email,
        location: editingLead.address,
        city: editingLead.city,
        status: editingLead.status,
        plan_value: Number(editForm.planValue),
        duration: Number(editForm.duration)
      });
      await fetchAllData();
      setEditingLead(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Converted Leads</h1>
        <p className="text-gray-500 text-sm mt-1">Review all successfully closed deals and their specific plans.</p>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Client Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Intern</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Group</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Plan Value</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Conversion Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {convertedLeads.map((lead) => {
                return (
                  <tr key={lead.id} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{lead.clientName}</div>
                      <div className="text-xs text-gray-600">{lead.phone} | {lead.email}</div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{lead.address || 'No Address'}, {lead.city || 'No City'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {lead.internName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.internGroup || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {formatCurrency((lead.planValue || 0) * (lead.duration || 1))}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{lead.planValue} × {lead.duration}yr</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.actionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(lead)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    </td>
                  </tr>
                );
              })}
              {convertedLeads.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No converted leads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Conversion details</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select 
                  value={editForm.planValue} 
                  onChange={e => setEditForm({...editForm, planValue: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Plan...</option>
                  <option value="999">Starter (₹999)</option>
                  <option value="2999">Smart (₹2999)</option>
                  <option value="4999">Pro (₹4999)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select 
                  value={editForm.duration} 
                  onChange={e => setEditForm({...editForm, duration: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Duration...</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setEditingLead(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
