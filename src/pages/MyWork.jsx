import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';

const STATUS_OPTIONS = [
  "Not Contacted", "Follow-up Required", "Demo Scheduled"
];

const STATUS_COLORS = {
  "Not Contacted": "bg-gray-100 text-gray-700",
  "Follow-up Required": "bg-yellow-100 text-yellow-700",
  "Demo Scheduled": "bg-green-100 text-green-700",
  "Converted": "bg-indigo-100 text-indigo-700"
};

const TIME_OPTIONS = [];
for (let h = 8; h <= 22; h++) {
  const hrStr = h.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hrStr}:00`);
  if (h !== 22) {
    TIME_OPTIONS.push(`${hrStr}:30`);
  }
}

export default function MyWork() {
  const { user, leads, demos, fetchAllData } = useAppContext();

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, leadId: null, feedback: '' });
  const [demoModal, setDemoModal] = useState({ isOpen: false, leadId: null, date: '', time: '', error: '', loading: false });

  const myLeads = leads || [];
  const cities = [...new Set(myLeads.map(l => l.city))].filter(Boolean);

  const filteredLeads = myLeads.filter(l => {
    const matchSearch = l.clientName.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter ? l.city === cityFilter : true;
    const matchStatus = statusFilter ? l.status === statusFilter : true;
    return matchSearch && matchCity && matchStatus;
  });

  const [error, setError] = useState(null);

  const updateStatus = async (id, newStatus) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    try {
      setError(null);
      // FIX 1: Send all fields to prevent NULL overwrites
      await api.editLead(id, {
        name: lead.clientName,
        contact: lead.phone,
        email: lead.email,
        location: lead.address,
        city: lead.city,
        status: newStatus
      });
      await fetchAllData();
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.error || "Failed to update status.");
    }
  };

  const handleStatusChange = (lead, newStatus) => {
    if (newStatus === "Demo Scheduled") {
      // FIX 3, 4, 5: Match STRICTLY by lead_id + intern_id (NO name-based fallback)
      const hasDemo = demos.some(d => d.lead_id === lead.id && d.intern_id === user?.id);
      if (!hasDemo) {
        setDemoModal({ isOpen: true, leadId: lead.id, date: '', time: '', error: '' });
        return;
      }
    }
    updateStatus(lead.id, newStatus);
  };

  const saveFeedback = async () => {
    if (!feedbackModal.leadId) return;
    try {
      setError(null);
      // Find the demo for this lead
      const demo = demos.find(d => d.lead_id === feedbackModal.leadId && d.intern_id === user?.id);
      if (!demo) {
        setError("You can only add feedback after scheduling a demo.");
        setFeedbackModal({ isOpen: false, leadId: null, feedback: '' });
        return;
      }

      await api.updateDemoFeedback(demo.id, feedbackModal.feedback);
      await fetchAllData();
      setFeedbackModal({ isOpen: false, leadId: null, feedback: '' });
    } catch (err) {
      console.error("Error saving feedback:", err);
      setError("Failed to save feedback.");
    }
  };

  const scheduleDemo = async (e) => {
    e.preventDefault();
    if (!demoModal.date || !demoModal.time) {
      setDemoModal(p => ({ ...p, error: 'Date and Time are required' }));
      return;
    }
    const lead = leads.find(l => l.id === demoModal.leadId);
    if (!lead) return;

    setDemoModal(p => ({ ...p, loading: true, error: '' }));
    try {
      // FIX 6, 9: Only call createDemo, backend handles status update
      await api.createDemo({ lead_id: lead.id, date: demoModal.date, time: demoModal.time });
      await fetchAllData();
      setDemoModal({ isOpen: false, leadId: null, date: '', time: '', error: '', loading: false });
    } catch (err) {
      setDemoModal(p => ({ ...p, error: err.response?.data?.error || 'Failed to schedule demo.', loading: false }));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Leads</h1>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        <div className="overflow-x-auto h-full min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 flex-col">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client Name & Feedback</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address & City</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map(lead => {
                const isLocked = lead.status === "Demo Scheduled" || lead.status === "Converted";
                const isFollowUp = lead.status === "Follow-up Required";
                const rowClass = isLocked
                  ? "bg-green-50 border-l-4 border-green-400"
                  : isFollowUp
                    ? "bg-yellow-50 border-l-4 border-yellow-400"
                    : "bg-white hover:bg-gray-50 border-l-4 border-transparent";

                // FIX 5: STRICTLY match by lead_id + intern_id — NO name fallback
                const hasDemo = demos.some(d => d.lead_id === lead.id && d.intern_id === user?.id);

                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors group ${rowClass}`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{lead.clientName}</div>
                      {(() => {
                        const demo = demos.find(d => d.lead_id === lead.id && d.intern_id === user?.id);
                        return demo?.feedback ? (
                          <div className="mt-1 text-xs text-indigo-600 italic max-w-xs truncate">Feedback: {demo.feedback}</div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{lead.phone}</div>
                      <div className="text-xs text-blue-600">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{lead.address}</div>
                      <div className="text-xs text-gray-500">{lead.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        disabled={isLocked}
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead, e.target.value)}
                        className={`appearance-none rounded-full px-4 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center ${isLocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700 cursor-pointer"
                          }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        {lead.status === "Converted" && <option value="Converted">Converted</option>}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                      <button
                        onClick={() => {
                          const demo = demos.find(d => d.lead_id === lead.id && d.intern_id === user?.id);
                          setFeedbackModal({ isOpen: true, leadId: lead.id, feedback: demo?.feedback || '' });
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        Feedback
                      </button>
                      <button
                        disabled={isLocked || hasDemo}
                        onClick={() => setDemoModal({ isOpen: true, leadId: lead.id, date: '', time: '', error: '' })}
                        className={`text-sm font-medium transition-colors ${(isLocked || hasDemo) ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-900'}`}
                      >
                        {hasDemo ? 'Scheduled' : 'Schedule Demo'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Feedback</h3>
            <textarea
              value={feedbackModal.feedback}
              onChange={e => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 text-sm"
              placeholder="Add feedback about this lead..."
            />
            <div className="flex justify-end space-x-3 mt-5">
              <button onClick={() => setFeedbackModal({ isOpen: false, leadId: null, feedback: '' })} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveFeedback} className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Save Feedback</button>
            </div>
          </div>
        </div>
      )}

      {demoModal.isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Demo</h3>

            {demoModal.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
                {demoModal.error}
              </div>
            )}

            <form onSubmit={scheduleDemo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Demo Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={demoModal.date}
                  onChange={e => setDemoModal({ ...demoModal, date: e.target.value, error: '' })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Demo Time (08:00 AM - 10:00 PM)</label>
                <select
                  required
                  value={demoModal.time}
                  onChange={e => setDemoModal({ ...demoModal, time: e.target.value, error: '' })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Select Time Slot</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-400">Strictly 30-minute intervals aligned mappings.</p>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-2">
                <button type="button" onClick={() => setDemoModal({ isOpen: false, leadId: null, date: '', time: '', error: '', loading: false })} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={demoModal.loading} className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">{demoModal.loading ? 'Scheduling...' : 'Confirm Setup'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
