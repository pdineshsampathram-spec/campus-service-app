import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import AnimatedBackground from './AnimatedBackground';
import CartDrawer from '../CartDrawer';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AnimatedBackground />
      <Sidebar />
      <div className="ml-64 transition-all duration-300 flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <CartDrawer />
    </div>
  );
}
