import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15s timeout as requested for production stability
});

// ... (interceptors omitted for brevity in replace_file_content if possible, but I'll replace the block)
// I will keep the interceptors but update the timeout and healthService.


// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Track retries
  config.metadata = config.metadata || { retryCount: 0 };
  
  // Track request start for cold-start detection
  config.wakingTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('server-waking', { detail: true }));
  }, 1500);
  
  return config;
});

// Standardize response unwrapping
api.interceptors.response.use(
  (response) => {
    if (response.config.wakingTimer) {
      clearTimeout(response.config.wakingTimer);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));
    }
    
    // Support both wrapped {success, data, message} and direct data from backend
    const resData = response.data;
    if (resData && typeof resData === 'object' && ('success' in resData)) {
      if (resData.success) {
        return { success: true, data: resData.data, status: response.status };
      }
      return Promise.reject({
        success: false,
        message: resData.message || 'Operation failed',
        status: response.status
      });
    }
    
    // Direct response fallback
    return { success: true, data: resData, status: response.status };
  },
  async (error) => {
    const { config, response } = error;
    
    if (config?.wakingTimer) {
      clearTimeout(config.wakingTimer);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));
    }

    // RETRY LOGIC for Cold Starts (503 Service Unavailable, 504 Gateway Timeout, or Network Error)
    const isRetryable = !response || response.status === 503 || response.status === 504;
    
    if (isRetryable && config && config.metadata.retryCount < 3) {
      config.metadata.retryCount += 1;
      const delay = 2000; // Fixed 2s delay as requested
      
      console.log(`⚠️ Server waking up. Retrying in ${delay}ms... (Attempt ${config.metadata.retryCount})`);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: true }));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('campus_user');
      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }

    const backendError = response?.data;
    let errorMsg = backendError?.message || backendError?.detail || error.message || 'An unexpected error occurred';
    
    // Friendly message for cold starts/network issues
    if (isRetryable) {
      errorMsg = "Server is starting. Please wait a moment.";
    }
    
    return Promise.reject({
      success: false,
      message: errorMsg,
      status: response?.status
    });
  }
);

// Health Check / Ping
export const healthService = {
  ping: (signal) => api.get('/', { signal }),
  wakeServer: async () => {
    try {
      await api.get('/health', { timeout: 10000 });
      return true;
    } catch (e) {
      return false;
    }
  }
};

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
