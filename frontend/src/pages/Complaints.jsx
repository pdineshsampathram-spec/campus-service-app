import { motion } from 'framer-motion';
import { MessageSquare, Send, AlertTriangle, CheckCircle, Clock, Loader, Search } from 'lucide-react';
import { complaintService } from '../services/api';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import SkeletonLoader from '../components/common/SkeletonLoader';

const categories = ['Hostel', 'Canteen', 'Academic', 'Facilities', 'Transport', 'Other'];
const priorities = ['low', 'medium', 'high'];

const categoryEmojis = {
  Hostel: '🏠', Canteen: '🍽️', Academic: '📚', Facilities: '🔧', Transport: '🚌', Other: '📋'
};

const statusConfig = {
  open: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Open' },
  in_progress: { color: 'bg-sky-100 text-sky-700', icon: Loader, label: 'In Progress' },
  resolved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Resolved' },
  closed: { color: 'bg-slate-100 text-slate-600', icon: CheckCircle, label: 'Closed' },
};

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function Complaints() {
  const [form, setForm] = useState({ category: 'Hostel', subject: '', description: '', priority: 'medium' });
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data } = await complaintService.getMyComplaints();
      setComplaints(data);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await complaintService.createComplaint(form);
      toast.success('Complaint submitted! We\'ll look into it promptly.', { duration: 5000 });
      setForm({ category: 'Hostel', subject: '', description: '', priority: 'medium' });
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Complaint Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Report issues and track their resolution</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" /> New Complaint
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                    className={`p-2.5 rounded-xl text-sm font-medium border-2 transition-all flex flex-col items-center gap-1 ${
                      form.category === cat
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}>
                    <span className="text-lg">{categoryEmojis[cat]}</span>
                    <span className="text-xs">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <div className="flex gap-2">
                {priorities.map(p => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                      form.priority === p
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
              <input type="text" required value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of the issue"
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea required value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Please provide detailed information about the issue..."
                rows={4} className="input-field resize-none" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                <><Send size={15} /> Submit Complaint</>}
            </button>
          </form>
        </div>

        {/* My complaints */}
        <div className="glass-card p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">My Complaints</h2>
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {loading ? (
              <SkeletonLoader variant="list" count={4} />
            ) : complaints.filter(c => 
              c.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
              c.category.toLowerCase().includes(debouncedSearch.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No complaints found</p>
              </div>
            ) : (
              complaints.filter(c => 
                c.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                c.category.toLowerCase().includes(debouncedSearch.toLowerCase())
              ).map((c, i) => {
                const { color, icon: StatusIcon, label } = statusConfig[c.status] || statusConfig.open;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryEmojis[c.category] || '📋'}</span>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-white">{c.subject}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.complaint_id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`badge ${color} flex items-center gap-1`}>
                          <StatusIcon size={10} /> {label}
                        </span>
                        <span className={`badge ${priorityColors[c.priority]} capitalize`}>{c.priority}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.description}</p>
                    
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                      <div className={`h-full rounded-full transition-all ${
                        c.status === 'open' ? 'w-1/4 bg-red-400' :
                        c.status === 'in_progress' ? 'w-2/3 bg-sky-400' :
                        'w-full bg-emerald-400'
                      }`} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
