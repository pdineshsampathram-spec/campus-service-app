import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';
import AIChatbot from './components/AIChatbot';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FoodOrdering = lazy(() => import('./pages/FoodOrdering'));
const LibraryBooking = lazy(() => import('./pages/LibraryBooking'));
const Certificates = lazy(() => import('./pages/Certificates'));
const ExamNotifications = lazy(() => import('./pages/ExamNotifications'));
const Complaints = lazy(() => import('./pages/Complaints'));
const Profile = lazy(() => import('./pages/Profile'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

import ErrorBoundary from './components/layout/ErrorBoundary';

import ServerStatusLoader from './components/layout/ServerStatusLoader';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1E293B',
                  color: '#f1f5f9',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                <Route path="/food" element={<DashboardLayout><FoodOrdering /></DashboardLayout>} />
                <Route path="/library" element={<DashboardLayout><LibraryBooking /></DashboardLayout>} />
                <Route path="/certificates" element={<DashboardLayout><Certificates /></DashboardLayout>} />
                <Route path="/exams" element={<DashboardLayout><ExamNotifications /></DashboardLayout>} />
                <Route path="/complaints" element={<DashboardLayout><Complaints /></DashboardLayout>} />
                <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
            <AIChatbot />
            <ServerStatusLoader />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
