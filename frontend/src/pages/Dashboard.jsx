import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, BookOpen, Award, MessageSquare, TrendingUp, Clock, ArrowRight, Zap } from 'lucide-react';
import { dashboardService, orderService, libraryService, certificateService, complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const quickActions = [
  { label: 'Order Food', icon: '🍕', to: '/food', color: 'from-orange-400 to-red-400', bg: 'bg-orange-50' },
  { label: 'Book Seat', icon: '📚', to: '/library', color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50' },
  { label: 'Request Certificate', icon: '🎓', to: '/certificates', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
  { label: 'File Complaint', icon: '📝', to: '/complaints', color: 'from-purple-400 to-indigo-500', bg: 'bg-purple-50' },
];

const activityColors = {
  order: 'bg-orange-100 text-orange-600',
  booking: 'bg-sky-100 text-sky-600',
  certificate: 'bg-emerald-100 text-emerald-600',
  complaint: 'bg-purple-100 text-purple-600',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_orders: 0, active_bookings: 0, pending_certificates: 0, open_complaints: 0,
    total_users: 0, total_bookings: 0, my_total_orders: 0
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    orders_per_day: [0, 0, 0, 0, 0, 0, 0],
    bookings_per_day: [0, 0, 0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes, ordersRes, bookingsRes, certsRes, complaintsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getChartData(),
          orderService.getMyOrders(),
          libraryService.getMyBookings(),
          certificateService.getMyRequests(),
          complaintService.getMyComplaints(),
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (chartRes?.data) setChartData(chartRes.data);

        // Build recent activity
        const activity = [
          ...ordersRes.data.slice(0, 2).map(o => ({
            type: 'order', icon: '🍕', text: `Order placed at ${o.canteen}`,
            sub: `₹${o.total_amount} · ${o.status}`, time: o.created_at, color: activityColors.order
          })),
          ...bookingsRes.data.slice(0, 2).map(b => ({
            type: 'booking', icon: '📚', text: `Seat ${b.seat_id} booked`,
            sub: `${b.date} · ${b.status}`, time: b.created_at, color: activityColors.booking
          })),
          ...certsRes.data.slice(0, 1).map(c => ({
            type: 'certificate', icon: '🎓', text: `${c.certificate_type} requested`,
            sub: `ID: ${c.request_id} · ${c.status}`, time: c.created_at, color: activityColors.certificate
          })),
          ...complaintsRes.data.slice(0, 1).map(c => ({
            type: 'complaint', icon: '📝', text: c.subject,
            sub: `${c.category} · ${c.status}`, time: c.created_at, color: activityColors.complaint
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
        setRecentActivity(activity);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Refresh every 30 seconds to keep data sync
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.my_total_orders, icon: ShoppingBag, color: 'from-orange-400 to-red-400', textColor: 'text-orange-600', bg: 'bg-orange-50', shadow: 'shadow-orange-100' },
    { label: 'Active Bookings', value: stats.active_bookings, icon: BookOpen, color: 'from-sky-400 to-blue-500', textColor: 'text-sky-600', bg: 'bg-sky-50', shadow: 'shadow-sky-100' },
    { label: 'Pending Certificates', value: stats.pending_certificates, icon: Award, color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-100' },
    { label: 'Open Complaints', value: stats.open_complaints, icon: MessageSquare, color: 'from-purple-400 to-indigo-500', textColor: 'text-purple-600', bg: 'bg-purple-50', shadow: 'shadow-purple-100' },
  ];

  const lineData = {
    labels: chartData.labels,
    datasets: [{
      label: 'Orders',
      data: chartData.orders_per_day,
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.08)',
      tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#4F46E5',
    }],
  };

  const doughnutData = {
    labels: ['Food', 'Library', 'Certificates', 'Complaints'],
    datasets: [{
      data: [stats.my_total_orders, stats.active_bookings, stats.pending_certificates, stats.open_complaints],
      backgroundColor: ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 17 ? '🌤️ Good afternoon' : '🌙 Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">{greeting}, {user?.name?.split(' ')[0] || 'Student'}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">Here's what's happening on campus today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <Clock size={14} className="text-indigo-600" />
          <span className="text-sm text-indigo-600 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="skeleton h-8 w-16" />
                <div className="skeleton h-4 w-24" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{card.label}</p>
                  <p className="text-3xl font-grotesk font-bold text-slate-800 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon size={22} className="text-white" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line chart */}
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> Weekly Orders
            </h2>
            <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">This Week</span>
          </div>
          <div className="h-48">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut chart */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Service Usage</h2>
          <div className="h-40">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: '65%' }} />
          </div>
        </div>
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <Link key={action.to} to={action.to}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`${action.bg} dark:bg-slate-700/60 p-4 rounded-xl cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-slate-600 transition-colors`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-xl mb-2 shadow-md`}>
                    {action.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{action.label}</p>
                  <ArrowRight size={12} className="text-slate-400 mt-1" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No recent activity yet</p>
            ) : (
              recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${item.color}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.text}</p>
                    <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
