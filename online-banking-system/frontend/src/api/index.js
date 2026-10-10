import client from './client';

export const authApi = {
  login: (username, password) => client.post('/auth/login', { username, password }).then((r) => r.data),
  verifyOtp: (username, otp) => client.post('/auth/verify-otp', { username, otp }).then((r) => r.data),
  forgotPassword: (username) => client.post('/auth/forgot-password', { username }).then((r) => r.data),
  resetPassword: (username, otp, newPassword) =>
    client.post('/auth/reset-password', { username, otp, newPassword }).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
  setMpin: (mpin) => client.post('/auth/mpin', { mpin }).then((r) => r.data),
};

export const accountsApi = {
  list: () => client.get('/accounts').then((r) => r.data.accounts),
  get: (id) => client.get(`/accounts/${id}`).then((r) => r.data.account),
  transactions: (id, params) => client.get(`/accounts/${id}/transactions`, { params }).then((r) => r.data.transactions),
  statementUrl: (id, params) => {
    const token = localStorage.getItem('obs_token');
    const qs = new URLSearchParams(params || {}).toString();
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');
    return `${base}/accounts/${id}/statement${qs ? `?${qs}` : ''}`;
  },
};

export const profileApi = {
  get: () => client.get('/profile').then((r) => r.data),
  update: (updates) => client.put('/profile', updates).then((r) => r.data),
};

export const beneficiaryApi = {
  list: () => client.get('/beneficiaries').then((r) => r.data.beneficiaries),
  add: (data) => client.post('/beneficiaries', data).then((r) => r.data.beneficiary),
  update: (id, data) => client.put(`/beneficiaries/${id}`, data).then((r) => r.data.beneficiary),
  remove: (id) => client.delete(`/beneficiaries/${id}`).then((r) => r.data),
};

export const transferApi = {
  initiate: (data) => client.post('/transfers/initiate', data).then((r) => r.data),
  confirm: (transactionId, mpin) => client.post('/transfers/confirm', { transactionId, mpin }).then((r) => r.data),
  get: (id) => client.get(`/transfers/${id}`).then((r) => r.data.transaction),
};

export const billerApi = {
  list: () => client.get('/bills/billers').then((r) => r.data.billers),
  add: (data) => client.post('/bills/billers', data).then((r) => r.data.biller),
  remove: (id) => client.delete(`/bills/billers/${id}`).then((r) => r.data),
};

export const billPayApi = {
  initiate: (data) => client.post('/bills/pay/initiate', data).then((r) => r.data),
  confirm: (transactionId, mpin) => client.post('/bills/pay/confirm', { transactionId, mpin }).then((r) => r.data),
  history: (params) => client.get('/bills/pay/history', { params }).then((r) => r.data.transactions),
};

export const depositApi = {
  list: () => client.get('/deposits').then((r) => r.data.deposits),
  get: (id) => client.get(`/deposits/${id}`).then((r) => r.data.deposit),
  open: (data) => client.post('/deposits', data).then((r) => r.data.deposit),
  closePrematurely: (id) => client.post(`/deposits/${id}/close`).then((r) => r.data),
};
