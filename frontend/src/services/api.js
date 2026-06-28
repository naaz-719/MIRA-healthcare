import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE });

export const patientService = {
  list: () => api.get('/patients').then(r => r.data),
  get: (id) => api.get(`/patients/${id}`).then(r => r.data),
  create: (data) => api.post('/patients', data).then(r => r.data),
  update: (id, data) => api.put(`/patients/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/patients/${id}`).then(r => r.data),
};

export const statsService = {
  get: () => api.get('/stats').then(r => r.data),
};
