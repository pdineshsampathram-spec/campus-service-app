import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Track request start for cold-start detection
  config.metadata = { startTime: new Date() };
  config.wakingTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('server-waking', { detail: true }));
  }, 1500); // If no response in 1.5s, show waking message
  
  return config;
});

// Standardize response unwrapping
api.interceptors.response.use(
  (response) => {
    // Clear waking timer
    if (response.config.wakingTimer) {
      clearTimeout(response.config.wakingTimer);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));
    }
    
    // Backend returns { success, data, message }
    const { success, data, message } = response.data;
    
    if (success) {
      return { success: true, data, status: response.status };
    }
    
    return Promise.reject({
      success: false,
      message: message || 'Operation failed',
      status: response.status
    });
  },
  (error) => {
    // Clear waking timer on error
    if (error.config?.wakingTimer) {
      clearTimeout(error.config.wakingTimer);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('campus_user');
      window.location.href = '/login';
    }

    // Handle structured error from backend if available
    const backendError = error.response?.data;
    const errorMsg = backendError?.message || backendError?.detail || error.message || 'An unexpected error occurred';
    
    return Promise.reject({
      success: false,
      message: errorMsg,
      status: error.response?.status
    });
  }
);

// Auth
export const authService = {
  register: (data, signal) => api.post('/api/auth/register', data, { signal }),
  login: (data, signal) => api.post('/api/auth/login', data, { signal }),
  getMe: (signal) => api.get('/api/auth/me', { signal }),
  updateProfile: (data, signal) => api.patch('/api/auth/me', data, { signal }),
};

// Orders
export const orderService = {
  createOrder: (data, signal) => api.post('/api/orders/', data, { signal }),
  getMyOrders: (signal) => api.get('/api/orders/my-orders', { signal }),
  getOrder: (id, signal) => api.get(`/api/orders/${id}`, { signal }),
};

// Food
export const foodService = {
  getCanteens: (signal) => api.get('/api/food/canteens', { signal }),
  getItem: (id, signal) => api.get(`/api/food/items/${id}`, { signal }),
};

// Library
export const libraryService = {
  bookSeat: (data, signal) => api.post('/api/library/book', data, { signal }),
  getMyBookings: (signal) => api.get('/api/library/my-bookings', { signal }),
  getSeatsStatus: (date, signal) => api.get(`/api/library/seats/${date}`, { signal }),
  cancelBooking: (id, signal) => api.delete(`/api/library/cancel/${id}`, { signal }),
  unbookSeat: (seatId, signal) => api.delete(`/api/library/unbook-seat/${seatId}`, { signal }),
};

// Certificates
export const certificateService = {
  requestCertificate: (data, signal) => api.post('/api/certificates/request', data, { signal }),
  getMyRequests: (signal) => api.get('/api/certificates/my-requests', { signal }),
};

// Exams
export const examService = {
  getExams: (signal) => api.get('/api/exams/', { signal }),
  getUpcoming: (signal) => api.get('/api/exams/upcoming', { signal }),
};

// Complaints
export const complaintService = {
  createComplaint: (data, signal) => api.post('/api/complaints/', data, { signal }),
  getMyComplaints: (signal) => api.get('/api/complaints/my-complaints', { signal }),
  updateStatus: (id, status, signal) => api.patch(`/api/complaints/${id}/status?status=${status}`, { signal }),
};

// Dashboard
export const dashboardService = {
  getStats: (signal) => api.get('/api/dashboard/stats', { signal }),
};

export default api;
