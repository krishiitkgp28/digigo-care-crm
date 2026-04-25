import axios from 'axios';
import * as XLSX from "xlsx";

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto attach token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // BUG FIX: read fresh every time
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Global error handling
apiClient.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  // BUG FIX: Log all errors for debugging
  console.error('API Error:', error.response?.status, error.response?.data);
  return Promise.reject(error);
});

export const api = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  verifyToken: async () => {
    const res = await apiClient.get('/auth/verify');
    return res.data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  fetchUsers: async () => {
    const res = await apiClient.get('/users');
    return res.data?.data || [];
  },
  getUsers: async () => {
    const res = await apiClient.get('/users');
    return res.data?.data || [];
  },
  createUser: async (userData) => {
    const res = await apiClient.post('/users', userData);
    return res.data?.data || res.data;
  },
  updateUserGroup: async (id, group_name) => {
    const res = await apiClient.put(`/users/${id}/group`, { group_name });
    return res.data?.data || res.data;
  },
  deactivateUser: async (id) => {
    const res = await apiClient.put(`/users/${id}/deactivate`);
    return res.data?.data || res.data;
  },
  getPerformance: async () => {
    const res = await apiClient.get('/performance');
    return res.data?.data || [];
  },
  _mapLead: (d) => ({
    id: d.id,
    clientName: d.lead_name || d.name,
    phone: d.contact,
    email: d.email,
    address: d.location,
    city: d.city,
    status: d.status || "Not Contacted",
    assignedToId: d.assigned_to_id,
    internName: d.intern_name,
    internAccountId: d.account_id,
    internGroup: d.group_name,
    actionDate: d.created_at || new Date().toISOString(),
    planValue: d.plan_value,
    duration: d.duration
  }),

  fetchLeads: async () => {
    const res = await apiClient.get('/leads');
    console.log("Fetched leads:", res.data);
    if (!Array.isArray(res.data?.data)) return [];
    return res.data.data.map(d => api._mapLead(d));
  },
  fetchDemos: async () => {
    const res = await apiClient.get('/demos');
    if (!Array.isArray(res.data?.data)) return [];
    return res.data.data.map(d => ({
        ...d,
        clientName: d.lead_name,
        assignedToId: d.intern_id,
        date: d.date,
        time: d.time,
        group: d.intern_group
    }));
  },
  fetchActivity: async () => {
    const res = await apiClient.get('/activity');
    return res.data?.data || [];
  },
  getReports: async (params = {}) => {
    const res = await apiClient.get('/reports', { params });
    return res.data?.data || null;
  },
  createDemo: async (payload) => {
    const res = await apiClient.post('/demos', payload);
    return res.data?.data || res.data;
  },
  deleteLead: async (id) => {
    const res = await apiClient.delete(`/leads/${id}`);
    return res.data;
  },
  editLead: async (id, payload) => {
    const res = await apiClient.put(`/leads/${id}`, payload);
    return api._mapLead(res.data?.data || res.data);
  },
  updateDemo: async (id, updates) => {
    const res = await apiClient.put(`/demos/${id}`, updates);
    return res.data?.data || res.data;
  },
  convertDemo: async (id, payload) => {
    const res = await apiClient.put(`/demos/${id}/convert`, payload);
    return res.data?.data || res.data;
  },
  updateDemoFeedback: async (id, feedback) => {
    const res = await apiClient.put(`/demos/${id}/feedback`, { feedback });
    return res.data?.data || res.data;
  },
  uploadLeads: async (payload) => {
    const res = await apiClient.post('/leads/upload', payload);
    return res.data;
  },
  assignLeads: async (group, leadIds) => {
    const res = await apiClient.post('/leads/assign', { group, leadIds });
    return res.data;
  },
  resetPassword: async (id, payload) => {
    const res = await apiClient.put(`/admin/reset-password/${id}`, payload);
    return res.data;
  },
  parseExcel: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const mappedData = jsonData.map(row => {
            const data = {
              name: row.Name || row.name,
              contact: row.Contact || row.contact || row.Phone || row.phone,
              email: row.Email || row.email,
              location: row.Location || row.location || row.Address || row.address || row["Client Address"] || "",
              city: row.City || row.city || ""
            };
            if (!data.name || !data.contact || !data.email) {
              console.log("Field mismatch/missing formatting:", row);
            }
            return data;
          });
          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
};
