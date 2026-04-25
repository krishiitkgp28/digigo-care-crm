// DemoTracker.jsx
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function DemoTracker() {
  const { demos, interns } = useAppContext();

  const [internFilterId, setInternFilterId] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const uniqueInternIds = [...new Set(demos.map(d => d.intern_id).filter(Boolean))];
  const uniqueGroups = [...new Set(demos.map(d => d.intern_group).filter(Boolean))];

  const filteredDemos = demos.filter(d => {
    const matchIntern = internFilterId ? String(d.intern_id) === String(internFilterId) : true;
    const matchGroup = groupFilter ? d.intern_group === groupFilter : true;
    const matchStatus = statusFilter ? d.lead_status === statusFilter : true;
    return matchIntern && matchGroup && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Demo Scheduled': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-700">Scheduled</span>;
      case 'Converted': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700">Converted</span>;
      case 'Follow-up Required': return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-700">Follow-up</span>;
      default: return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status || 'Not Contacted'}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demo Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Track upcoming and past product demonstrations across all interns.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
          >
            <option value="">All Lead Statuses</option>
            <option value="Not Contacted">Not Contacted</option>
            <option value="Follow-up Required">Follow-up Required</option>
            <option value="Demo Scheduled">Demo Scheduled</option>
            <option value="Converted">Converted</option>
          </select>
          <select
            value={internFilterId}
            onChange={e => setInternFilterId(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
          >
            <option value="">All Interns</option>
            {uniqueInternIds.map(id => {
              const intern = interns.find(i => i.id === id);
              return <option key={id} value={id}>{intern ? intern.name : `Unknown Intern (${id})`}</option>;
            })}
          </select>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 outline-none"
          >
            <option value="">All Groups</option>
            {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Client Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Client Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Demo Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Lead Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Feedback</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Assigned Intern</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase text-right">Intern Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDemos.map((demo) => {
                return (
                  <tr key={demo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>{demo.lead_name || demo.clientName}</div>
                      <div style={{ color: 'gray', fontSize: '10px', textTransform: 'uppercase' }}>
                        {demo.lead_location || 'No Address'} | {demo.lead_city || 'No City'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="text-indigo-600">{demo.lead_email || 'No Email'}</div>
                      <div className="text-gray-500 text-xs">{demo.lead_contact || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(demo.date || demo.demoDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(demo.lead_status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-[200px] truncate">
                      {demo.feedback || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{demo.intern_name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div>ID: {demo.intern_account_id || '-'}</div>
                      <div>Group: {demo.intern_group || '-'}</div>
                    </td>
                  </tr>
                );
              })}
              {filteredDemos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No demos found matching the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
